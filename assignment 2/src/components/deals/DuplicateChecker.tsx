"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle, ExternalLink, ShieldAlert, PhoneCall } from "lucide-react";
import { checkDuplicatesAction } from "@/actions/organizations";
import { DuplicateMatchResult } from "@/types";
import { StageBadge } from "@/components/ui/Badge";

interface DuplicateCheckerProps {
  companyName: string;
  domain?: string;
  phone?: string;
  excludeOrgId?: string;
  onDuplicateStateChange?: (hasExact: boolean, duplicates: DuplicateMatchResult[]) => void;
}

export function DuplicateChecker({
  companyName,
  domain,
  phone,
  excludeOrgId,
  onDuplicateStateChange,
}: DuplicateCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!companyName || companyName.trim().length < 2) {
      setDuplicates([]);
      setHasSearched(false);
      onDuplicateStateChange?.(false, []);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await checkDuplicatesAction(
          companyName,
          domain || null,
          phone || null,
          excludeOrgId
        );
        setDuplicates(results);
        setHasSearched(true);
        const hasExact = results.some(
          (d) => d.matchType === "EXACT_NAME" || d.matchType === "EXACT_DOMAIN"
        );
        onDuplicateStateChange?.(hasExact, results);
      } catch (err) {
        console.error("Duplicate check error:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [companyName, domain, phone, excludeOrgId]);

  if (!companyName || companyName.trim().length < 2) {
    return null;
  }

  const exactMatches = duplicates.filter(
    (d) => d.matchType === "EXACT_NAME" || d.matchType === "EXACT_DOMAIN"
  );
  const fuzzyMatches = duplicates.filter((d) => d.matchType === "FUZZY_NAME");
  const phoneCollisions = duplicates.filter((d) => d.matchType === "PHONE_COLLISION");

  return (
    <div className="mt-3 text-xs font-mono">
      {loading && (
        <div className="flex items-center gap-2 text-ink-muted py-2">
          <div className="w-3 h-3 border-2 border-ink border-t-transparent animate-spin rounded-full" />
          <span>Analyzing company registries & domains...</span>
        </div>
      )}

      {!loading && hasSearched && duplicates.length === 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-300 text-green-800">
          <CheckCircle2 className="w-4 h-4 text-signal-green shrink-0" />
          <span>
            No duplicates found for <strong>"{companyName}"</strong>. Ready to create.
          </span>
        </div>
      )}

      {/* EXACT MATCH BLOCK - High Priority Warning */}
      {!loading && exactMatches.length > 0 && (
        <div className="p-3 bg-red-50 border-2 border-signal-red text-red-950 space-y-2 mb-2">
          <div className="flex items-center gap-2 font-bold text-signal-red">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>EXACT DUPLICATE DETECTED</span>
          </div>

          {exactMatches.map((match, idx) => (
            <div
              key={idx}
              className="bg-white p-2.5 border border-red-200 text-ink space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{match.organization.name}</span>
                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 border border-red-300 uppercase font-semibold">
                  {match.matchedField} (100% Match)
                </span>
              </div>

              {match.organization.domain && (
                <div className="text-ink-muted text-[11px]">
                  Domain: <span className="text-ink">{match.organization.domain}</span>
                </div>
              )}

              {match.activeDeal ? (
                <div className="p-2 bg-stone-50 border border-border-grid mt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">Active Pipeline:</span>
                    <span className="font-semibold text-ink">
                      {match.activeDeal.campaignName}
                    </span>
                    <StageBadge stage={match.activeDeal.stage} />
                  </div>
                  <div className="text-ink-muted">
                    Owner:{" "}
                    <span className="font-bold text-ink">
                      {match.activeDeal.ownerName || "Unclaimed"}
                    </span>{" "}
                    ({match.activeDeal.daysSinceLastActivity}d ago)
                  </div>
                  <Link
                    href={`/deals/${match.activeDeal.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-signal-red hover:underline font-bold"
                  >
                    <span>View Deal</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="text-ink-muted text-[11px]">
                  Company exists in directory with no active deal in current campaign.
                  <Link
                    href={`/orgs/${match.organization.id}`}
                    target="_blank"
                    className="ml-2 text-ink font-bold underline inline-flex items-center gap-0.5"
                  >
                    View Org <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FUZZY MATCHES */}
      {!loading && fuzzyMatches.length > 0 && (
        <div className="p-3 bg-amber-50 border border-signal-amber text-amber-950 space-y-2 mb-2">
          <div className="flex items-center gap-2 font-bold text-signal-amber">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>POTENTIAL SIMILAR ORGANIZATIONS ({fuzzyMatches.length})</span>
          </div>

          <div className="space-y-1.5">
            {fuzzyMatches.map((match, idx) => (
              <div
                key={idx}
                className="bg-white p-2 border border-amber-200 text-ink flex items-center justify-between"
              >
                <div>
                  <div className="font-bold">{match.organization.name}</div>
                  <div className="text-[10px] text-ink-muted">
                    Normalized match: {match.confidence}% similarity on {match.matchedField}
                    {match.activeDeal && ` · Handled by ${match.activeDeal.ownerName || "Unassigned"}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {match.activeDeal && <StageBadge stage={match.activeDeal.stage} />}
                  <Link
                    href={
                      match.activeDeal
                        ? `/deals/${match.activeDeal.id}`
                        : `/orgs/${match.organization.id}`
                    }
                    target="_blank"
                    className="text-ink hover:underline font-bold inline-flex items-center gap-0.5 text-[11px]"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHONE COLLISION */}
      {!loading && phoneCollisions.length > 0 && (
        <div className="p-3 bg-stone-100 border border-border-grid text-ink space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Contact Phone Shared with Existing Company</span>
          </div>
          <p className="text-[11px] text-ink-muted">
            The phone number is registered under <strong>{phoneCollisions[0].organization.name}</strong>. This might be an agency, shared POC, or duplicate record.
          </p>
        </div>
      )}
    </div>
  );
}
