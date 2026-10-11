import { normalizeCompanyName, normalizeDomain, normalizePhone } from "./normalization";
import { prisma } from "./prisma";
import { DuplicateMatchResult, DealStage } from "@/types";

/**
 * Compute Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity ratio (0 to 1) between two strings
 */
export function stringSimilarity(a: string, b: string): number {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const distance = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;

  return 1 - distance / maxLen;
}

/**
 * Detect duplicates against the database for a company name, domain, and optional contact phone
 */
export async function findDuplicateOrganizations(
  rawName: string,
  rawDomain?: string | null,
  rawPhone?: string | null,
  excludeOrgId?: string
): Promise<DuplicateMatchResult[]> {
  const results: DuplicateMatchResult[] = [];
  const normalizedName = normalizeCompanyName(rawName);
  const domain = normalizeDomain(rawDomain);
  const cleanPhone = normalizePhone(rawPhone);

  if (!normalizedName && !domain && !cleanPhone) {
    return results;
  }

  // 1. Check exact normalized name match
  if (normalizedName) {
    const exactNameMatch = await prisma.organization.findFirst({
      where: {
        normalizedName: normalizedName,
        id: excludeOrgId ? { not: excludeOrgId } : undefined,
      },
      include: {
        deals: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            campaign: true,
            owner: true,
          },
        },
      },
    });

    if (exactNameMatch) {
      const activeDeal = exactNameMatch.deals[0];
      const daysSince = activeDeal
        ? Math.floor((Date.now() - new Date(activeDeal.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      results.push({
        matchType: "EXACT_NAME",
        confidence: 100,
        matchedField: "Company Name",
        matchedValue: exactNameMatch.name,
        organization: {
          id: exactNameMatch.id,
          name: exactNameMatch.name,
          normalizedName: exactNameMatch.normalizedName,
          domain: exactNameMatch.domain,
          city: exactNameMatch.city,
        },
        activeDeal: activeDeal
          ? {
              id: activeDeal.id,
              campaignName: activeDeal.campaign.name,
              stage: activeDeal.stage as DealStage,
              ownerName: activeDeal.owner?.name ?? null,
              ownerEmail: activeDeal.owner?.email ?? null,
              lastActivityAt: activeDeal.lastActivityAt.toISOString(),
              daysSinceLastActivity: daysSince,
            }
          : null,
      });
    }
  }

  // 2. Check exact domain match
  if (domain) {
    const exactDomainMatch = await prisma.organization.findFirst({
      where: {
        domain: domain,
        id: excludeOrgId ? { not: excludeOrgId } : undefined,
      },
      include: {
        deals: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            campaign: true,
            owner: true,
          },
        },
      },
    });

    // Only add if not already added by exact name
    if (exactDomainMatch && !results.some((r) => r.organization.id === exactDomainMatch.id)) {
      const activeDeal = exactDomainMatch.deals[0];
      const daysSince = activeDeal
        ? Math.floor((Date.now() - new Date(activeDeal.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      results.push({
        matchType: "EXACT_DOMAIN",
        confidence: 95,
        matchedField: "Website Domain",
        matchedValue: exactDomainMatch.domain || domain,
        organization: {
          id: exactDomainMatch.id,
          name: exactDomainMatch.name,
          normalizedName: exactDomainMatch.normalizedName,
          domain: exactDomainMatch.domain,
          city: exactDomainMatch.city,
        },
        activeDeal: activeDeal
          ? {
              id: activeDeal.id,
              campaignName: activeDeal.campaign.name,
              stage: activeDeal.stage as DealStage,
              ownerName: activeDeal.owner?.name ?? null,
              ownerEmail: activeDeal.owner?.email ?? null,
              lastActivityAt: activeDeal.lastActivityAt.toISOString(),
              daysSinceLastActivity: daysSince,
            }
          : null,
      });
    }
  }

  // 3. Fuzzy match against other organizations
  if (normalizedName && normalizedName.length >= 3) {
    const allOrgs = await prisma.organization.findMany({
      where: {
        id: {
          notIn: [
            ...(excludeOrgId ? [excludeOrgId] : []),
            ...results.map((r) => r.organization.id),
          ],
        },
      },
      include: {
        deals: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          include: {
            campaign: true,
            owner: true,
          },
        },
      },
    });

    for (const org of allOrgs) {
      const orgNorm = org.normalizedName;
      const sim = stringSimilarity(normalizedName, orgNorm);
      const isSub =
        (normalizedName.includes(orgNorm) || orgNorm.includes(normalizedName)) &&
        Math.min(normalizedName.length, orgNorm.length) >= 4;

      if (sim >= 0.75 || isSub) {
        const activeDeal = org.deals[0];
        const daysSince = activeDeal
          ? Math.floor((Date.now() - new Date(activeDeal.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        results.push({
          matchType: "FUZZY_NAME",
          confidence: Math.round(isSub ? Math.max(sim * 100, 80) : sim * 100),
          matchedField: "Fuzzy Name Match",
          matchedValue: org.name,
          organization: {
            id: org.id,
            name: org.name,
            normalizedName: org.normalizedName,
            domain: org.domain,
            city: org.city,
          },
          activeDeal: activeDeal
            ? {
                id: activeDeal.id,
                campaignName: activeDeal.campaign.name,
                stage: activeDeal.stage as DealStage,
                ownerName: activeDeal.owner?.name ?? null,
                ownerEmail: activeDeal.owner?.email ?? null,
                lastActivityAt: activeDeal.lastActivityAt.toISOString(),
                daysSinceLastActivity: daysSince,
              }
            : null,
        });
      }
    }
  }

  // 4. Contact Phone Collision Warning
  if (cleanPhone) {
    const matchingContact = await prisma.contact.findFirst({
      where: {
        phone: {
          contains: cleanPhone,
        },
        organizationId: excludeOrgId ? { not: excludeOrgId } : undefined,
      },
      include: {
        organization: {
          include: {
            deals: {
              orderBy: { updatedAt: "desc" },
              take: 1,
              include: {
                campaign: true,
                owner: true,
              },
            },
          },
        },
      },
    });

    if (
      matchingContact &&
      !results.some((r) => r.organization.id === matchingContact.organizationId)
    ) {
      const activeDeal = matchingContact.organization.deals[0];
      const daysSince = activeDeal
        ? Math.floor((Date.now() - new Date(activeDeal.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      results.push({
        matchType: "PHONE_COLLISION",
        confidence: 90,
        matchedField: `Contact Phone (${matchingContact.name}: ${matchingContact.phone})`,
        matchedValue: matchingContact.organization.name,
        organization: {
          id: matchingContact.organization.id,
          name: matchingContact.organization.name,
          normalizedName: matchingContact.organization.normalizedName,
          domain: matchingContact.organization.domain,
          city: matchingContact.organization.city,
        },
        activeDeal: activeDeal
          ? {
              id: activeDeal.id,
              campaignName: activeDeal.campaign.name,
              stage: activeDeal.stage as DealStage,
              ownerName: activeDeal.owner?.name ?? null,
              ownerEmail: activeDeal.owner?.email ?? null,
              lastActivityAt: activeDeal.lastActivityAt.toISOString(),
              daysSinceLastActivity: daysSince,
            }
          : null,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
