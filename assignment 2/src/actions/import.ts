"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { normalizeCompanyName, normalizeDomain, normalizePhone } from "@/lib/normalization";
import { findDuplicateOrganizations } from "@/lib/fuzzy";
import { DealStage, SponsorshipTier, OrgType } from "@/types";
import { DEFAULT_FOLLOW_UP_DAYS } from "@/lib/constants";

export interface ImportRowData {
  rowIndex: number;
  companyName: string;
  domain?: string;
  type?: OrgType;
  city?: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  stage?: DealStage;
  tier?: SponsorshipTier;
  valueINR?: number;
  notes?: string;
}

export interface ImportReportItem {
  rowIndex: number;
  companyName: string;
  contactName: string;
  status: "CREATED" | "ATTACHED" | "SKIPPED_EXACT" | "QUEUED_FUZZY" | "ERROR";
  actionTaken: string;
  details: string;
  dealId?: string;
}

export async function processCsvImportAction(
  campaignId: string,
  rows: ImportRowData[],
  options: {
    skipExactDuplicates?: boolean;
    attachExistingOrganizations?: boolean;
    importFuzzyAsNew?: boolean;
  }
): Promise<{
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  attachedCount: number;
  skippedCount: number;
  fuzzyCount: number;
  errorCount: number;
  report: ImportReportItem[];
}> {
  const user = await requireAuth();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Target campaign not found.");
  }

  const report: ImportReportItem[] = [];
  let createdCount = 0;
  let attachedCount = 0;
  let skippedCount = 0;
  let fuzzyCount = 0;
  let errorCount = 0;

  for (const row of rows) {
    const rawName = row.companyName?.trim();
    if (!rawName) {
      report.push({
        rowIndex: row.rowIndex,
        companyName: "—",
        contactName: row.contactName || "—",
        status: "ERROR",
        actionTaken: "Skipped",
        details: "Missing company name.",
      });
      errorCount++;
      continue;
    }

    const normalizedName = normalizeCompanyName(rawName);
    const domain = normalizeDomain(row.domain);
    const phone = normalizePhone(row.contactPhone);

    // Duplicate check
    const duplicates = await findDuplicateOrganizations(rawName, domain, phone);
    const exactMatch = duplicates.find(
      (d) => d.matchType === "EXACT_NAME" || d.matchType === "EXACT_DOMAIN"
    );
    const fuzzyMatches = duplicates.filter(
      (d) => d.matchType === "FUZZY_NAME" || d.matchType === "PHONE_COLLISION"
    );

    if (exactMatch) {
      if (options.attachExistingOrganizations) {
        // Check if existing org already has a deal in this campaign
        const existingDeal = await prisma.deal.findUnique({
          where: {
            organizationId_campaignId: {
              organizationId: exactMatch.organization.id,
              campaignId: campaign.id,
            },
          },
        });

        if (existingDeal) {
          report.push({
            rowIndex: row.rowIndex,
            companyName: rawName,
            contactName: row.contactName || "—",
            status: "SKIPPED_EXACT",
            actionTaken: "Skipped",
            details: `Exact match "${exactMatch.organization.name}" already has an active deal in ${campaign.name}.`,
          });
          skippedCount++;
        } else {
          // Create deal under existing organization
          const stage: DealStage = row.stage || "PROSPECT";
          const followUp = stage === "CONFIRMED" || stage === "LOST"
            ? null
            : new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);

          const deal = await prisma.deal.create({
            data: {
              organizationId: exactMatch.organization.id,
              campaignId: campaign.id,
              ownerId: user.id,
              stage,
              tier: row.tier || null,
              valueINR: row.valueINR || null,
              nextFollowUpAt: followUp,
              lastActivityAt: new Date(),
            },
          });

          // Add contact if provided
          if (row.contactName?.trim()) {
            await prisma.contact.create({
              data: {
                organizationId: exactMatch.organization.id,
                name: row.contactName.trim(),
                title: row.contactTitle?.trim() || null,
                phone: row.contactPhone?.trim() || null,
                email: row.contactEmail?.trim() || null,
              },
            });
          }

          await prisma.activity.create({
            data: {
              dealId: deal.id,
              userId: user.id,
              type: "NOTE",
              body: `Imported deal into ${campaign.name} attached to existing organization "${exactMatch.organization.name}".`,
            },
          });

          report.push({
            rowIndex: row.rowIndex,
            companyName: rawName,
            contactName: row.contactName || "—",
            status: "ATTACHED",
            actionTaken: "Attached Deal",
            details: `Attached to existing company record "${exactMatch.organization.name}".`,
            dealId: deal.id,
          });
          attachedCount++;
        }
      } else {
        report.push({
          rowIndex: row.rowIndex,
          companyName: rawName,
          contactName: row.contactName || "—",
          status: "SKIPPED_EXACT",
          actionTaken: "Skipped",
          details: `Exact match "${exactMatch.organization.name}" found in database.`,
        });
        skippedCount++;
      }
      continue;
    }

    if (fuzzyMatches.length > 0 && !options.importFuzzyAsNew) {
      report.push({
        rowIndex: row.rowIndex,
        companyName: rawName,
        contactName: row.contactName || "—",
        status: "QUEUED_FUZZY",
        actionTaken: "Flagged for Review",
        details: `Potential duplicate with "${fuzzyMatches[0].organization.name}" (${fuzzyMatches[0].matchedField}, ${fuzzyMatches[0].confidence}% confidence).`,
      });
      fuzzyCount++;
      continue;
    }

    // Create New Organization, Contact, Deal
    try {
      const stage: DealStage = row.stage || "PROSPECT";
      const followUp = stage === "CONFIRMED" || stage === "LOST"
        ? null
        : new Date(Date.now() + DEFAULT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: rawName,
            normalizedName,
            domain,
            type: row.type || "SPONSOR",
            city: row.city?.trim() || null,
            notes: row.notes?.trim() || null,
          },
        });

        if (row.contactName?.trim()) {
          await tx.contact.create({
            data: {
              organizationId: org.id,
              name: row.contactName.trim(),
              title: row.contactTitle?.trim() || null,
              phone: row.contactPhone?.trim() || null,
              email: row.contactEmail?.trim() || null,
              isPrimary: true,
            },
          });
        }

        const deal = await tx.deal.create({
          data: {
            organizationId: org.id,
            campaignId: campaign.id,
            ownerId: user.id,
            stage,
            tier: row.tier || null,
            valueINR: row.valueINR || null,
            nextFollowUpAt: followUp,
            lastActivityAt: new Date(),
          },
        });

        await tx.activity.create({
          data: {
            dealId: deal.id,
            userId: user.id,
            type: "NOTE",
            body: `Imported from CSV into ${campaign.name} by ${user.name}.`,
          },
        });

        return deal;
      });

      report.push({
        rowIndex: row.rowIndex,
        companyName: rawName,
        contactName: row.contactName || "—",
        status: "CREATED",
        actionTaken: "Created New",
        details: `Created new organization and deal in ${campaign.name}.`,
        dealId: result.id,
      });
      createdCount++;
    } catch (err: any) {
      report.push({
        rowIndex: row.rowIndex,
        companyName: rawName,
        contactName: row.contactName || "—",
        status: "ERROR",
        actionTaken: "Failed",
        details: err.message || "Database insert error.",
      });
      errorCount++;
    }
  }

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/follow-ups");

  return {
    success: true,
    totalProcessed: rows.length,
    createdCount,
    attachedCount,
    skippedCount,
    fuzzyCount,
    errorCount,
    report,
  };
}
