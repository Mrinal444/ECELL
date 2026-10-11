import { DealStage, SponsorshipTier, LostReason, ActivityType } from "@/types";

export const STALE_DAYS_WARNING = 10;
export const STALE_DAYS_LEAD_RECLAIM = 20;
export const DEFAULT_FOLLOW_UP_DAYS = 3;

export const DEAL_STAGES: DealStage[] = [
  "PROSPECT",
  "CONTACTED",
  "REPLIED",
  "MEETING_SCHEDULED",
  "NEGOTIATION",
  "CONFIRMED",
  "LOST",
];

export const STAGE_CONFIG: Record<
  DealStage,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    order: number;
  }
> = {
  PROSPECT: {
    label: "Prospect",
    description: "Identified company, research or outreach not yet initiated",
    badgeBg: "bg-surface-muted",
    badgeText: "text-ink-muted",
    border: "border-border",
    order: 1,
  },
  CONTACTED: {
    label: "Contacted",
    description: "Initial message, pitch deck or email sent",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    border: "border-blue-200",
    order: 2,
  },
  REPLIED: {
    label: "Replied",
    description: "Positive or neutral response received from sponsor",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-700",
    border: "border-indigo-200",
    order: 3,
  },
  MEETING_SCHEDULED: {
    label: "Meeting Scheduled",
    description: "Pitch meeting or discussion scheduled on calendar",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    border: "border-amber-300",
    order: 4,
  },
  NEGOTIATION: {
    label: "Negotiation",
    description: "Discussing deliverables, tier packages, and deliverables",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    border: "border-purple-200",
    order: 5,
  },
  CONFIRMED: {
    label: "Confirmed",
    description: "Sponsorship agreement signed, invoice pledged or paid",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    border: "border-emerald-300",
    order: 6,
  },
  LOST: {
    label: "Lost",
    description: "Declined, budget constraints, or no response after multiple touchpoints",
    badgeBg: "bg-zinc-100",
    badgeText: "text-zinc-600",
    border: "border-zinc-300",
    order: 7,
  },
};

export const TIERS_CONFIG: Record<
  SponsorshipTier,
  { label: string; minAmount: number; color: string }
> = {
  TITLE: { label: "Title Sponsor", minAmount: 1000000, color: "text-amber-900 bg-amber-100" },
  CO_TITLE: { label: "Co-Title Sponsor", minAmount: 700000, color: "text-amber-800 bg-amber-50" },
  PLATINUM: { label: "Platinum Sponsor", minAmount: 500000, color: "text-slate-800 bg-slate-100" },
  GOLD: { label: "Gold Sponsor", minAmount: 300000, color: "text-yellow-800 bg-yellow-100" },
  SILVER: { label: "Silver Sponsor", minAmount: 150000, color: "text-zinc-700 bg-zinc-100" },
  BRONZE: { label: "Bronze Sponsor", minAmount: 75000, color: "text-orange-900 bg-orange-100" },
  IN_KIND: { label: "In-Kind / Beverage / Merchandise", minAmount: 0, color: "text-teal-800 bg-teal-50" },
  PARTNER: { label: "Community / Media Partner", minAmount: 0, color: "text-sky-800 bg-sky-50" },
};

export const LOST_REASONS_CONFIG: Record<LostReason, string> = {
  BUDGET: "Budget exhausted / Not sponsoring campus events this quarter",
  NO_RESPONSE: "Unresponsive after 3+ follow-ups on multiple channels",
  COMPETITOR: "Exclusively sponsoring competing summit / collegiate festival",
  TIMING: "Outreach initiated too late / Brand fiscal planning closed",
  OTHER: "Other organizational reason (specified in activity note)",
};

export const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: string; badgeClass: string }
> = {
  WHATSAPP: { label: "WhatsApp Message", icon: "MessageSquare", badgeClass: "bg-emerald-100 text-emerald-800" },
  CALL: { label: "Phone Call", icon: "Phone", badgeClass: "bg-blue-100 text-blue-800" },
  EMAIL: { label: "Email Sent/Received", icon: "Mail", badgeClass: "bg-purple-100 text-purple-800" },
  MEETING: { label: "Pitch / Sync Meeting", icon: "Users", badgeClass: "bg-amber-100 text-amber-800" },
  NOTE: { label: "Internal Note", icon: "FileText", badgeClass: "bg-zinc-100 text-zinc-800" },
  STAGE_CHANGE: { label: "Stage Change", icon: "ArrowRightCircle", badgeClass: "bg-indigo-100 text-indigo-800" },
  ASSIGNMENT: { label: "Ownership / Assignment", icon: "UserCheck", badgeClass: "bg-cyan-100 text-cyan-800" },
  MERGE: { label: "Company Merged", icon: "GitMerge", badgeClass: "bg-rose-100 text-rose-800" },
};
