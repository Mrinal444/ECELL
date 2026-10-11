"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireLead, canManageDeal } from "@/lib/auth";
import { normalizeCompanyName, normalizeDomain, normalizePhone } from "@/lib/normalization";
import { findDuplicateOrganizations } from "@/lib/fuzzy";
import { DealStage, LostReason, SponsorshipTier, PaymentStatus, ActivityType, DealType } from "@/types";
import { DEFAULT_FOLLOW_UP_DAYS, STALE_DAYS_WARNING, STALE_DAYS_LEAD_RECLAIM } from "@/lib/constants";

export interface CreateDealInput {
  companyName: string;
  domain?: string;
  type?: "SPONSOR" | "SPEAKER" | "PARTNER";
  city?: string;
  notes?: string;
  campaignId: string;
  ownerId?: string | null;
  stage?: DealStage;
  nextFollowUpAt?: string | null;
  contact: {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
  };
  tier?: SponsorshipTier;
  valueINR?: number;
  dealType?: DealType;
  forceAllowDuplicate?: boolean;
}

export async function createDealAction(input: CreateDealInput): Promise<{
  success: boolean;
  dealId?: string;
  error?: string;
  duplicates?: any[];
}> {
  const user = await requireAuth();

  const normalizedName = normalizeCompanyName(input.companyName);
  const domain = normalizeDomain(input.domain);
  const phone = normalizePhone(input.contact.phone);

  if (!normalizedName) {
    return { success: false, error: "Company name is required." };
  }

  if (!input.contact.name?.trim()) {
    return { success: false, error: "At least one contact person name is required." };
  }

  // 1. Run duplicate check if not forced
  if (!input.forceAllowDuplicate) {
    const duplicates = await findDuplicateOrganizations(input.companyName, domain, phone);
    const hasExact = duplicates.some(
      (d) => d.matchType === "EXACT_NAME" || d.matchType === "EXACT_DOMAIN"
    );

    if (hasExact) {
      const topMatch = duplicates[0];
      const handlerText = topMatch.activeDeal?.ownerName
        ? `Already handled by ${topMatch.activeDeal.ownerName} (${topMatch.activeDeal.stage})`
        : "Already registered in system";
      return {
        success: false,
        error: `Duplicate organization detected: ${topMatch.organization.name}. ${handlerText}.`,
        duplicates,
      };
    }

    if (duplicates.length > 0) {
      return {
        success: false,
        error: `Potential duplicate found (${duplicates[0].matchedField}). Review matches below or confirm creation.`,
        duplicates,
      };
    }
  }

  // Determine campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
  });

  if (!campaign) {
    return { success: false, error: "Selected campaign does not exist." };
  }

  // Determine default owner: if user is LEAD, can assign to specified ownerId, else defaults to creator
  const ownerId = user.role === "LEAD" && input.ownerId !== undefined ? input.ownerId : user.id;

  // Calculate default next follow-up date: +3 days from now
  const defaultFollowUp = new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);
  const followUpDate = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : defaultFollowUp;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find or create organization
      let org = await tx.organization.findUnique({
        where: { normalizedName },
      });

      if (!org && domain) {
        org = await tx.organization.findUnique({
          where: { domain },
        });
      }

      if (!org) {
        org = await tx.organization.create({
          data: {
            name: input.companyName.trim(),
            normalizedName,
            domain,
            type: input.type || "SPONSOR",
            city: input.city?.trim() || null,
            notes: input.notes?.trim() || null,
          },
        });
      }

      // Check if deal already exists for this org and campaign
      const existingDeal = await tx.deal.findUnique({
        where: {
          organizationId_campaignId: {
            organizationId: org.id,
            campaignId: campaign.id,
          },
        },
      });

      if (existingDeal) {
        throw new Error(
          `A deal for "${org.name}" already exists in ${campaign.name}. You cannot create a duplicate deal in the same campaign.`
        );
      }

      // Create Contact
      await tx.contact.create({
        data: {
          organizationId: org.id,
          name: input.contact.name.trim(),
          title: input.contact.title?.trim() || null,
          phone: input.contact.phone?.trim() || null,
          email: input.contact.email?.trim() || null,
          isPrimary: true,
        },
      });

      // Create Deal
      const initialStage: DealStage = input.stage || "PROSPECT";
      const deal = await tx.deal.create({
        data: {
          organizationId: org.id,
          campaignId: campaign.id,
          ownerId,
          stage: initialStage,
          tier: input.tier || null,
          valueINR: input.valueINR || null,
          dealType: input.dealType || "CASH",
          nextFollowUpAt: initialStage === "CONFIRMED" || initialStage === "LOST" ? null : followUpDate,
          lastActivityAt: new Date(),
          version: 1,
        },
      });

      // Log initial creation activity
      await tx.activity.create({
        data: {
          dealId: deal.id,
          userId: user.id,
          type: "NOTE",
          body: `Created deal in ${campaign.name} at stage "${initialStage}". Primary contact: ${input.contact.name} (${input.contact.phone || "No phone"}).`,
        },
      });

      return deal;
    });

    revalidatePath("/");
    revalidatePath("/deals");
    revalidatePath("/follow-ups");

    return { success: true, dealId: result.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create deal." };
  }
}

/**
 * Atomic Claim Deal with optimistic concurrency check
 */
export async function claimDealAction(dealId: string, currentVersion?: number): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await requireAuth();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { owner: true, organization: true },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  if (deal.ownerId && deal.ownerId !== user.id) {
    return {
      success: false,
      error: `Deal is already claimed by ${deal.owner?.name || "another team member"}.`,
    };
  }

  // Atomic update
  const updated = await prisma.deal.updateMany({
    where: {
      id: dealId,
      ownerId: null,
      version: currentVersion !== undefined ? currentVersion : deal.version,
    },
    data: {
      ownerId: user.id,
      version: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });

  if (updated.count === 0) {
    // Re-fetch to give precise race condition feedback
    const refreshed = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { owner: true },
    });
    return {
      success: false,
      error: `Claim failed: deal was just claimed by ${refreshed?.owner?.name || "someone else"}.`,
    };
  }

  // Append Activity
  await prisma.activity.create({
    data: {
      dealId,
      userId: user.id,
      type: "ASSIGNMENT",
      body: `Claimed ownership of deal.`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  return { success: true };
}

/**
 * Reassign Deal (Lead or Owner only)
 */
export async function reassignDealAction(
  dealId: string,
  newOwnerId: string | null,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { owner: true },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  // Only current owner or Lead can reassign
  if (user.role !== "LEAD" && deal.ownerId !== user.id) {
    return { success: false, error: "Only the deal owner or a Lead can reassign this deal." };
  }

  let newOwnerName = "Unassigned";
  if (newOwnerId) {
    const newOwner = await prisma.user.findUnique({
      where: { id: newOwnerId },
    });
    if (!newOwner || !newOwner.active) {
      return { success: false, error: "Target user is invalid or deactivated." };
    }
    newOwnerName = newOwner.name;
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      ownerId: newOwnerId,
      version: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      dealId,
      userId: user.id,
      type: "ASSIGNMENT",
      body: `Reassigned deal from ${deal.owner?.name || "Unassigned"} to ${newOwnerName}.${reason ? ` Reason: ${reason}` : ""}`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  return { success: true };
}

/**
 * Move Deal Stage with transition rules and required follow-up
 */
export async function updateDealStageAction(
  dealId: string,
  newStage: DealStage,
  data?: {
    lostReason?: LostReason;
    valueINR?: number;
    tier?: SponsorshipTier;
    dealType?: DealType;
    paymentStatus?: PaymentStatus;
    nextFollowUpAt?: string | null;
    note?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { owner: true },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  // Check permission: Lead or Owner can move stage
  if (!canManageDeal(user, deal.ownerId)) {
    return { success: false, error: "Only the deal owner or a Lead can change deal stages." };
  }

  const oldStage = deal.stage as DealStage;

  // Validation rules
  if (newStage === "LOST") {
    if (!data?.lostReason) {
      return { success: false, error: "A Lost Reason is required when marking a deal as Lost." };
    }
  }

  if (newStage === "CONFIRMED") {
    if (!data?.tier) {
      return { success: false, error: "Sponsorship Tier is required when confirming a deal." };
    }
  }

  // Calculate next follow-up
  let followUpDate: Date | null = null;
  if (newStage !== "CONFIRMED" && newStage !== "LOST") {
    if (data?.nextFollowUpAt) {
      followUpDate = new Date(data.nextFollowUpAt);
    } else {
      // Default to +3 days if not supplied
      followUpDate = new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);
    }
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: newStage,
      lostReason: newStage === "LOST" ? data?.lostReason || null : null,
      valueINR: data?.valueINR !== undefined ? data.valueINR : deal.valueINR,
      tier: data?.tier !== undefined ? data.tier : deal.tier,
      dealType: data?.dealType !== undefined ? data.dealType : deal.dealType,
      paymentStatus: data?.paymentStatus !== undefined ? data.paymentStatus : deal.paymentStatus,
      nextFollowUpAt: followUpDate,
      lastActivityAt: new Date(),
      version: { increment: 1 },
    },
  });

  // Create append-only stage change activity
  const stageNote = data?.note ? ` Note: ${data.note}` : "";
  const lostNote = newStage === "LOST" && data?.lostReason ? ` Reason: ${data.lostReason}.` : "";
  const confirmedNote =
    newStage === "CONFIRMED" && data?.tier
      ? ` Tier: ${data.tier}, Value: ₹${(data.valueINR || deal.valueINR || 0).toLocaleString("en-IN")}.`
      : "";

  await prisma.activity.create({
    data: {
      dealId,
      userId: user.id,
      type: "STAGE_CHANGE",
      body: `Stage changed from ${oldStage} → ${newStage}.${lostNote}${confirmedNote}${stageNote}`,
      metadata: JSON.stringify({
        from: oldStage,
        to: newStage,
        lostReason: data?.lostReason,
        valueINR: data?.valueINR,
        tier: data?.tier,
      }),
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/follow-ups");
  return { success: true };
}

/**
 * Log Activity (WhatsApp, Call, Email, Meeting, Note)
 */
export async function logDealActivityAction(
  dealId: string,
  data: {
    type: ActivityType;
    body: string;
    nextFollowUpAt?: string | null;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { owner: true },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  if (!data.body?.trim()) {
    return { success: false, error: "Activity note/body cannot be empty." };
  }

  // Non-owners can only add NOTE (e.g. "I know their HR head")
  const isOwnerOrLead = canManageDeal(user, deal.ownerId);
  if (!isOwnerOrLead && data.type !== "NOTE") {
    return {
      success: false,
      error: "Non-owners can only post internal notes on this deal.",
    };
  }

  // Determine next follow-up date
  let followUpDate: Date | null = deal.nextFollowUpAt;
  if (data.nextFollowUpAt) {
    followUpDate = new Date(data.nextFollowUpAt);
  } else if (data.type === "WHATSAPP" || data.type === "CALL" || data.type === "EMAIL") {
    // If logging direct communication, default follow-up to +3 days if none currently set
    if (!deal.nextFollowUpAt || new Date(deal.nextFollowUpAt) <= new Date()) {
      followUpDate = new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);
    }
  }

  await prisma.activity.create({
    data: {
      dealId,
      userId: user.id,
      type: data.type,
      body: data.body.trim(),
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  });

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      lastActivityAt: new Date(),
      nextFollowUpAt: deal.stage === "CONFIRMED" || deal.stage === "LOST" ? null : followUpDate,
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/follow-ups");
  return { success: true };
}

/**
 * Snooze Follow-Up by N days
 */
export async function snoozeFollowUpAction(
  dealId: string,
  days: number = 3
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  if (!canManageDeal(user, deal.ownerId)) {
    return { success: false, error: "Permission denied." };
  }

  const baseDate = deal.nextFollowUpAt && new Date(deal.nextFollowUpAt) > new Date()
    ? new Date(deal.nextFollowUpAt)
    : new Date();

  const newFollowUp = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      nextFollowUpAt: newFollowUp,
      lastActivityAt: new Date(),
    },
  });

  await prisma.activity.create({
    data: {
      dealId,
      userId: user.id,
      type: "NOTE",
      body: `Snoozed follow-up by +${days} days (next due: ${newFollowUp.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}).`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/follow-ups");
  return { success: true };
}

/**
 * Reclaim Stale Deal (Lead only)
 */
export async function reclaimStaleDealAction(
  dealId: string,
  newOwnerId?: string
): Promise<{ success: boolean; error?: string }> {
  const leadUser = await requireLead();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { owner: true },
  });

  if (!deal) {
    return { success: false, error: "Deal not found." };
  }

  const daysInactive = Math.floor(
    (Date.now() - new Date(deal.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const targetOwnerId = newOwnerId || leadUser.id;
  const targetUser = await prisma.user.findUnique({
    where: { id: targetOwnerId },
  });

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      ownerId: targetOwnerId,
      lastActivityAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000),
      version: { increment: 1 },
    },
  });

  await prisma.activity.create({
    data: {
      dealId,
      userId: leadUser.id,
      type: "ASSIGNMENT",
      body: `Reclaimed stale deal (${daysInactive} days inactive from ${deal.owner?.name || "Unassigned"}) and assigned to ${targetUser?.name || "Lead"}.`,
    },
  });

  revalidatePath("/");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/deals");
  revalidatePath("/follow-ups");
  return { success: true };
}
