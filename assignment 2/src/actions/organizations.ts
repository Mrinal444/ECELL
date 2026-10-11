"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireLead } from "@/lib/auth";
import { normalizeCompanyName, normalizeDomain, normalizePhone } from "@/lib/normalization";
import { findDuplicateOrganizations } from "@/lib/fuzzy";
import { OrgType, DuplicateMatchResult } from "@/types";

export async function checkDuplicatesAction(
  name: string,
  domain?: string | null,
  phone?: string | null,
  excludeOrgId?: string
): Promise<DuplicateMatchResult[]> {
  await requireAuth();
  return findDuplicateOrganizations(name, domain, phone, excludeOrgId);
}

export async function updateOrganizationAction(
  orgId: string,
  data: {
    name: string;
    domain?: string | null;
    type?: OrgType;
    city?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();

  const normalizedName = normalizeCompanyName(data.name);
  const domain = normalizeDomain(data.domain);

  if (!normalizedName) {
    return { success: false, error: "Company name cannot be empty." };
  }

  // Check if normalized name or domain collides with another org
  const existingName = await prisma.organization.findFirst({
    where: {
      normalizedName,
      id: { not: orgId },
    },
  });

  if (existingName) {
    return {
      success: false,
      error: `Another company named "${existingName.name}" already exists with normalized key "${normalizedName}".`,
    };
  }

  if (domain) {
    const existingDomain = await prisma.organization.findFirst({
      where: {
        domain,
        id: { not: orgId },
      },
    });

    if (existingDomain) {
      return {
        success: false,
        error: `Another company (${existingDomain.name}) is already registered with domain "${domain}".`,
      };
    }
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name.trim(),
      normalizedName,
      domain,
      type: data.type || "SPONSOR",
      city: data.city?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  revalidatePath(`/orgs/${orgId}`);
  revalidatePath("/deals");
  return { success: true };
}

export async function addContactAction(
  organizationId: string,
  data: {
    name: string;
    title?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  await requireAuth();

  if (!data.name?.trim()) {
    return { success: false, error: "Contact name is required." };
  }

  if (data.isPrimary) {
    // Demote any existing primary contact
    await prisma.contact.updateMany({
      where: { organizationId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      organizationId,
      name: data.name.trim(),
      title: data.title?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      isPrimary: data.isPrimary || false,
    },
  });

  revalidatePath(`/orgs/${organizationId}`);
  return { success: true, contactId: contact.id };
}

/**
 * Lead-Only Merge Organizations Tool
 * Moves all contacts, deals, and activities from sourceOrg into targetOrg.
 */
export async function mergeOrganizationsAction(
  sourceOrgId: string,
  targetOrgId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await requireLead();

  if (sourceOrgId === targetOrgId) {
    return { success: false, error: "Cannot merge an organization into itself." };
  }

  const [sourceOrg, targetOrg] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: sourceOrgId },
      include: {
        contacts: true,
        deals: {
          include: {
            campaign: true,
            activities: true,
          },
        },
      },
    }),
    prisma.organization.findUnique({
      where: { id: targetOrgId },
      include: {
        contacts: true,
        deals: {
          include: {
            campaign: true,
          },
        },
      },
    }),
  ]);

  if (!sourceOrg || !targetOrg) {
    return { success: false, error: "Source or Target organization does not exist." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Move all contacts from source to target
      await tx.contact.updateMany({
        where: { organizationId: sourceOrgId },
        data: { organizationId: targetOrgId, isPrimary: false },
      });

      // 2. Handle Deals
      for (const sourceDeal of sourceOrg.deals) {
        // Check if target already has a deal in the same campaign
        const existingTargetDeal = targetOrg.deals.find(
          (d) => d.campaignId === sourceDeal.campaignId
        );

        if (existingTargetDeal) {
          // Move activities to existing target deal
          await tx.activity.updateMany({
            where: { dealId: sourceDeal.id },
            data: { dealId: existingTargetDeal.id },
          });

          // Log merge note on target deal
          await tx.activity.create({
            data: {
              dealId: existingTargetDeal.id,
              userId: user.id,
              type: "MERGE",
              body: `Merged duplicate deal for "${sourceOrg.name}" from ${sourceDeal.campaign.name} into this record.`,
            },
          });

          // Delete duplicate source deal
          await tx.deal.delete({
            where: { id: sourceDeal.id },
          });
        } else {
          // Re-parent source deal to target org
          await tx.deal.update({
            where: { id: sourceDeal.id },
            data: { organizationId: targetOrgId },
          });

          // Log merge activity
          await tx.activity.create({
            data: {
              dealId: sourceDeal.id,
              userId: user.id,
              type: "MERGE",
              body: `Organization "${sourceOrg.name}" was merged into "${targetOrg.name}". Deal re-parented.`,
            },
          });
        }
      }

      // 3. Delete the source organization
      await tx.organization.delete({
        where: { id: sourceOrgId },
      });
    });

    revalidatePath("/");
    revalidatePath(`/orgs/${targetOrgId}`);
    revalidatePath("/deals");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to merge organizations." };
  }
}
