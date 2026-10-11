"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowRight,
  User,
  Building2,
  ExternalLink,
  ShieldAlert,
  Plus,
  RefreshCw,
} from "lucide-react";
import { StageBadge, TierBadge, OverdueBadge } from "@/components/ui/Badge";
import { snoozeFollowUpAction } from "@/actions/deals";
import { WhatsAppModal } from "@/components/deals/WhatsAppModal";
import { DealStage, SponsorshipTier, SessionUser } from "@/types";

interface TriageDeal {
  id: string;
  stage: DealStage;
  tier?: SponsorshipTier | null;
  valueINR?: number | null;
  nextFollowUpAt?: string | null;
  lastActivityAt: string;
  organization: {
    id: string;
    name: string;
    domain?: string | null;
    city?: string | null;
    contacts: {
      id: string;
      name: string;
      phone?: string | null;
      email?: string | null;
      title?: string | null;
    }[];
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  campaign: {
    id: string;
    name: string;
  };
}

interface FollowUpTriageProps {
  deals: TriageDeal[];
  currentUser: SessionUser;
  campaigns: { id: string; name: string; year: number }[];
  teamMembers: { id: string; name: string; role: string }[];
}

export function FollowUpTriageView({
  deals,
  currentUser,
  campaigns,
  teamMembers,
}: FollowUpTriageProps) {
  const [filterOwner, setFilterOwner] = useState<string>(currentUser.id);
  const [filterCampaign, setFilterCampaign] = useState<string>("");
  const [snoozingId, setSnoozingId] = useState<string | null>(null);

  // WhatsApp modal state
  const [activeWhatsAppDeal, setActiveWhatsAppDeal] = useState<TriageDeal | null>(null);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    if (filterOwner === "MINE" || filterOwner === currentUser.id) {
      if (deal.owner?.id !== currentUser.id) return false;
    } else if (filterOwner === "UNASSIGNED") {
      if (deal.owner !== null) return false;
    } else if (filterOwner && filterOwner !== "ALL") {
      if (deal.owner?.id !== filterOwner) return false;
    }

    if (filterCampaign && deal.campaign.name !== filterCampaign) {
      // or check campaignId if present
    }

    return true;
  });

  // Segregate into Overdue, Today, Upcoming, Unscheduled
  const overdueList: { deal: TriageDeal; daysOverdue: number }[] = [];
  const todayList: TriageDeal[] = [];
  const upcomingList: TriageDeal[] = [];
  const unscheduledList: TriageDeal[] = [];

  filteredDeals.forEach((d) => {
    if (!d.nextFollowUpAt) {
      unscheduledList.push(d);
      return;
    }
    const fDate = new Date(d.nextFollowUpAt);
    if (fDate < startOfToday) {
      const diff = Math.max(
        1,
        Math.floor((startOfToday.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      overdueList.push({ deal: d, daysOverdue: diff });
    } else if (fDate <= endOfToday) {
      todayList.push(d);
    } else if (fDate <= sevenDaysFromNow) {
      upcomingList.push(d);
    } else {
      upcomingList.push(d);
    }
  });

  // Sort overdue by most overdue first
  overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const handleSnooze = async (dealId: string, days: number) => {
    setSnoozingId(dealId);
    try {
      await snoozeFollowUpAction(dealId, days);
      window.location.reload();
    } catch (err) {
      alert("Failed to reschedule follow-up.");
    } finally {
      setSnoozingId(null);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header with KPI Counts */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black uppercase text-ink tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-signal-red" />
              <span>Follow-Up Triage &amp; Cadence Center</span>
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Zero dropped leads. Daily triage workflow to keep deals active and prevent stale drop-offs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/deals"
              className="bg-canvas border border-border-grid px-3 py-1.5 font-bold hover:bg-surface-muted text-ink"
            >
              Back to Pipeline
            </Link>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-grid">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="font-bold text-ink mr-2 uppercase text-[10px]">Filter By Owner:</span>
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="bg-canvas border border-border-grid p-1.5 text-xs font-mono font-bold"
              >
                <option value={currentUser.id}>My Deals ({currentUser.name})</option>
                <option value="ALL">All Team Members</option>
                <option value="UNASSIGNED">Open Queue (Unassigned)</option>
                {teamMembers
                  .filter((m) => m.id !== currentUser.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-red-50 border border-signal-red text-signal-red font-bold">
              {overdueList.length} Overdue
            </span>
            <span className="px-2.5 py-1 bg-amber-50 border border-signal-amber text-amber-900 font-bold">
              {todayList.length} Due Today
            </span>
            <span className="px-2.5 py-1 bg-canvas border border-border-grid text-ink font-bold">
              {upcomingList.length} Upcoming
            </span>
          </div>
        </div>
      </div>

      {/* 1. OVERDUE SECTION (HIGH PRIORITY) */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <h2 className="text-sm font-bold text-signal-red uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>Overdue Follow-Ups ({overdueList.length})</span>
          </h2>
          <span className="text-[11px] text-ink-muted">
            These prospects were promised a touch before today. Reach out immediately.
          </span>
        </div>

        {overdueList.length === 0 ? (
          <div className="p-6 text-center text-ink-muted bg-green-50/40 border border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-700 mx-auto mb-1" />
            <div className="font-bold text-green-900">Zero Overdue Follow-Ups!</div>
            <div className="text-[11px] text-green-800">
              Outstanding cadence discipline. All scheduled follow-ups are up to date.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-grid">
            {overdueList.map(({ deal, daysOverdue }) => {
              const contact = deal.organization.contacts[0];
              const isOwner = deal.owner?.id === currentUser.id;
              const isLead = currentUser.role === "LEAD";

              return (
                <div
                  key={deal.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-red-50/30 px-2 transition-colors"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-bold text-sm text-ink hover:underline"
                      >
                        {deal.organization.name}
                      </Link>
                      <StageBadge stage={deal.stage} />
                      <OverdueBadge days={daysOverdue} />
                    </div>

                    <div className="text-[11px] text-ink-muted flex items-center gap-2">
                      <span>{deal.campaign.name}</span>
                      {contact && (
                        <span>
                          &bull; POC: {contact.name}{" "}
                          {contact.phone && `(${contact.phone})`}
                        </span>
                      )}
                      {deal.owner && <span>&bull; Owner: {deal.owner.name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {contact?.phone && (
                      <button
                        type="button"
                        onClick={() => setActiveWhatsAppDeal(deal)}
                        className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 font-bold hover:bg-green-800 shadow-sharp-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {(isOwner || isLead) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={snoozingId === deal.id}
                          onClick={() => handleSnooze(deal.id, 1)}
                          className="bg-canvas border border-border-grid px-2 py-1.5 font-bold text-[10px] hover:bg-surface-muted"
                          title="Snooze to tomorrow"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          disabled={snoozingId === deal.id}
                          onClick={() => handleSnooze(deal.id, 3)}
                          className="bg-canvas border border-border-grid px-2 py-1.5 font-bold text-[10px] hover:bg-surface-muted"
                          title="Snooze 3 days"
                        >
                          +3d
                        </button>
                        <button
                          type="button"
                          disabled={snoozingId === deal.id}
                          onClick={() => handleSnooze(deal.id, 7)}
                          className="bg-canvas border border-border-grid px-2 py-1.5 font-bold text-[10px] hover:bg-surface-muted"
                          title="Snooze 7 days"
                        >
                          +7d
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/deals/${deal.id}`}
                      className="bg-ink text-canvas px-3 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. DUE TODAY SECTION */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <h2 className="text-sm font-bold text-signal-amber uppercase flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Scheduled for Today ({todayList.length})</span>
          </h2>
          <span className="text-[11px] text-ink-muted">
            Target actions due before end of day.
          </span>
        </div>

        {todayList.length === 0 ? (
          <div className="p-4 text-center text-ink-muted">
            No further follow-ups scheduled for today.
          </div>
        ) : (
          <div className="divide-y divide-border-grid">
            {todayList.map((deal) => {
              const contact = deal.organization.contacts[0];
              const isOwner = deal.owner?.id === currentUser.id;
              const isLead = currentUser.role === "LEAD";

              return (
                <div
                  key={deal.id}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-canvas px-2 transition-colors"
                >
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-bold text-sm text-ink hover:underline"
                      >
                        {deal.organization.name}
                      </Link>
                      <StageBadge stage={deal.stage} />
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5">
                        Due Today
                      </span>
                    </div>

                    <div className="text-[11px] text-ink-muted flex items-center gap-2">
                      <span>{deal.campaign.name}</span>
                      {contact && <span>&bull; POC: {contact.name}</span>}
                      {deal.owner && <span>&bull; Owner: {deal.owner.name}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contact?.phone && (
                      <button
                        type="button"
                        onClick={() => setActiveWhatsAppDeal(deal)}
                        className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 font-bold hover:bg-green-800 shadow-sharp-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {(isOwner || isLead) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={snoozingId === deal.id}
                          onClick={() => handleSnooze(deal.id, 1)}
                          className="bg-canvas border border-border-grid px-2 py-1.5 font-bold text-[10px] hover:bg-surface-muted"
                        >
                          +1d
                        </button>
                        <button
                          type="button"
                          disabled={snoozingId === deal.id}
                          onClick={() => handleSnooze(deal.id, 3)}
                          className="bg-canvas border border-border-grid px-2 py-1.5 font-bold text-[10px] hover:bg-surface-muted"
                        >
                          +3d
                        </button>
                      </div>
                    )}

                    <Link
                      href={`/deals/${deal.id}`}
                      className="bg-ink text-canvas px-3 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. UPCOMING (NEXT 7 DAYS) */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <h2 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-ink-muted" />
            <span>Upcoming (Next 7 Days) ({upcomingList.length})</span>
          </h2>
          <span className="text-[11px] text-ink-muted">
            Future pipeline cadence scheduled.
          </span>
        </div>

        {upcomingList.length === 0 ? (
          <div className="p-4 text-center text-ink-muted">
            No upcoming follow-ups scheduled in the next 7 days.
          </div>
        ) : (
          <div className="divide-y divide-border-grid">
            {upcomingList.map((deal) => {
              const contact = deal.organization.contacts[0];
              const fDate = new Date(deal.nextFollowUpAt!);

              return (
                <div
                  key={deal.id}
                  className="py-2.5 flex flex-wrap items-center justify-between gap-3 hover:bg-canvas px-2 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-bold text-sm text-ink hover:underline"
                      >
                        {deal.organization.name}
                      </Link>
                      <StageBadge stage={deal.stage} />
                      <span className="text-[10px] text-ink-muted">
                        Due:{" "}
                        {fDate.toLocaleDateString("en-IN", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="text-[10px] text-ink-muted">
                      {deal.campaign.name} &bull; Owner: {deal.owner?.name || "Unassigned"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="bg-canvas border border-border-grid text-ink px-2.5 py-1 font-bold hover:bg-surface-muted flex items-center gap-1 text-[11px]"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Modal Trigger */}
      {activeWhatsAppDeal && activeWhatsAppDeal.organization.contacts[0] && (
        <WhatsAppModal
          isOpen={!!activeWhatsAppDeal}
          onClose={() => setActiveWhatsAppDeal(null)}
          dealId={activeWhatsAppDeal.id}
          contactName={activeWhatsAppDeal.organization.contacts[0].name}
          contactPhone={activeWhatsAppDeal.organization.contacts[0].phone || ""}
          companyName={activeWhatsAppDeal.organization.name}
          campaignName={activeWhatsAppDeal.campaign.name}
          senderName={currentUser.name}
        />
      )}
    </div>
  );
}
