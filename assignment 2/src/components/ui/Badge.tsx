import React from "react";
import { STAGE_CONFIG, TIERS_CONFIG, LOST_REASONS_CONFIG } from "@/lib/constants";
import { DealStage, SponsorshipTier, UserRole, LostReason } from "@/types";

export function StageBadge({ stage }: { stage: DealStage | string }) {
  const config = STAGE_CONFIG[stage as DealStage] || {
    label: stage,
    badgeBg: "bg-surface-muted",
    badgeText: "text-ink-muted",
    border: "border-border-grid",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium border ${config.badgeBg} ${config.badgeText} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

export function TierBadge({ tier }: { tier?: SponsorshipTier | string | null }) {
  if (!tier) return null;
  const config = TIERS_CONFIG[tier as SponsorshipTier] || {
    label: tier,
    color: "text-ink bg-surface-muted",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold border border-border-grid ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const isLead = role === "LEAD";
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono tracking-wider uppercase border font-semibold ${
        isLead
          ? "bg-ink text-canvas border-ink"
          : "bg-surface text-ink-muted border-border-grid"
      }`}
    >
      {isLead ? "LEAD" : "MEMBER"}
    </span>
  );
}

export function OverdueBadge({ days }: { days?: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono font-bold bg-signal-red text-white border border-signal-red">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      OVERDUE{days ? ` (${days}d)` : ""}
    </span>
  );
}

export function StaleBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono font-bold bg-ink text-canvas border border-ink">
      <span className="w-1.5 h-1.5 bg-canvas" />
      STALE ({days}d)
    </span>
  );
}

export function LostReasonBadge({ reason }: { reason?: LostReason | string | null }) {
  if (!reason) return null;
  const label = LOST_REASONS_CONFIG[reason as LostReason] || reason;
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-stone-200 text-stone-700 border border-stone-300">
      Lost: {label}
    </span>
  );
}
