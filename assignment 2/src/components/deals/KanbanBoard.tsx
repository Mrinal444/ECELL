"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Clock,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  HandMetal,
  CheckCircle,
  Filter,
  DollarSign,
  Sparkles,
  Phone,
} from "lucide-react";
import { DealStage, SponsorshipTier, SessionUser, LostReason } from "@/types";
import { DEAL_STAGES, STAGE_CONFIG, STALE_DAYS_WARNING } from "@/lib/constants";
import {
  StageBadge,
  TierBadge,
  OverdueBadge,
  StaleBadge,
  LostReasonBadge,
} from "@/components/ui/Badge";
import { claimDealAction } from "@/actions/deals";
import { WhatsAppModal } from "@/components/deals/WhatsAppModal";
import { StageChangeModal } from "@/components/deals/StageChangeModal";

export interface KanbanDeal {
  id: string;
  stage: DealStage;
  tier?: SponsorshipTier | null;
  valueINR?: number | null;
  dealType?: string | null;
  nextFollowUpAt?: Date | string | null;
  lastActivityAt: Date | string;
  version: number;
  lostReason?: LostReason | null;
  organization: {
    id: string;
    name: string;
    city?: string | null;
    type?: string | null;
    domain?: string | null;
    contacts: {
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
  _count?: {
    activities: number;
  };
}

interface KanbanBoardProps {
  deals: KanbanDeal[];
  currentUser: SessionUser;
  campaignName: string;
  campaignId: string;
  teamMembers: { id: string; name: string; email: string; role: string; active: boolean }[];
}

export function KanbanBoard({
  deals,
  currentUser,
  campaignName,
  campaignId,
  teamMembers,
}: KanbanBoardProps) {
  const [filterMode, setFilterMode] = useState<"all" | "mine" | "unclaimed" | "overdue" | "stale">(
    "all"
  );
  const [claimingDealId, setClaimingDealId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<{ [key: string]: string }>({});

  // WhatsApp Modal State
  const [activeWhatsAppDeal, setActiveWhatsAppDeal] = useState<KanbanDeal | null>(null);

  // Stage Change Modal State
  const [activeStageModalDeal, setActiveStageModalDeal] = useState<KanbanDeal | null>(null);

  const now = new Date();

  // Helper to calculate overdue & stale
  const getDealStatus = (deal: KanbanDeal) => {
    const isClosed = deal.stage === "CONFIRMED" || deal.stage === "LOST";
    let isOverdue = false;
    let overdueDays = 0;
    let isStale = false;
    let inactiveDays = 0;

    if (!isClosed && deal.nextFollowUpAt) {
      const followUpDate = new Date(deal.nextFollowUpAt);
      if (followUpDate < now) {
        isOverdue = true;
        overdueDays = Math.max(
          1,
          Math.floor((now.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24))
        );
      }
    }

    const lastAct = new Date(deal.lastActivityAt);
    inactiveDays = Math.floor((now.getTime() - lastAct.getTime()) / (1000 * 60 * 60 * 24));
    if (!isClosed && deal.owner && inactiveDays >= STALE_DAYS_WARNING) {
      isStale = true;
    }

    return { isOverdue, overdueDays, isStale, inactiveDays };
  };

  const handleClaim = async (deal: KanbanDeal) => {
    setClaimingDealId(deal.id);
    setClaimError((prev) => ({ ...prev, [deal.id]: "" }));

    try {
      const res = await claimDealAction(deal.id, deal.version);
      if (!res.success) {
        setClaimError((prev) => ({
          ...prev,
          [deal.id]: res.error || "Claim failed. Deal may have been modified.",
        }));
      }
    } catch (err: any) {
      setClaimError((prev) => ({
        ...prev,
        [deal.id]: err.message || "Failed to claim deal.",
      }));
    } finally {
      setClaimingDealId(null);
    }
  };

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    const { isOverdue, isStale } = getDealStatus(deal);
    if (filterMode === "mine") return deal.owner?.id === currentUser.id;
    if (filterMode === "unclaimed") return !deal.owner;
    if (filterMode === "overdue") return isOverdue;
    if (filterMode === "stale") return isStale;
    return true;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Board Controls & Metric Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border-2 border-border-grid p-3 shadow-sharp-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase">
            <Filter className="w-3.5 h-3.5" />
            View Filter:
          </span>

          <button
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 text-xs border transition-all ${
              filterMode === "all"
                ? "bg-ink text-canvas border-ink font-bold"
                : "bg-canvas text-ink hover:bg-surface-muted border-border-grid"
            }`}
          >
            All Pipeline ({deals.length})
          </button>

          <button
            onClick={() => setFilterMode("mine")}
            className={`px-2.5 py-1 text-xs border transition-all ${
              filterMode === "mine"
                ? "bg-ink text-canvas border-ink font-bold"
                : "bg-canvas text-ink hover:bg-surface-muted border-border-grid"
            }`}
          >
            My Assigned Deals ({deals.filter((d) => d.owner?.id === currentUser.id).length})
          </button>

          <button
            onClick={() => setFilterMode("unclaimed")}
            className={`px-2.5 py-1 text-xs border transition-all ${
              filterMode === "unclaimed"
                ? "bg-ink text-canvas border-ink font-bold"
                : "bg-canvas text-ink hover:bg-surface-muted border-border-grid"
            }`}
          >
            Open Queue ({deals.filter((d) => !d.owner).length})
          </button>

          <button
            onClick={() => setFilterMode("overdue")}
            className={`px-2.5 py-1 text-xs border transition-all ${
              filterMode === "overdue"
                ? "bg-signal-red text-white border-signal-red font-bold"
                : "bg-canvas text-signal-red hover:bg-red-50 border-border-grid"
            }`}
          >
            Overdue ({deals.filter((d) => getDealStatus(d).isOverdue).length})
          </button>

          <button
            onClick={() => setFilterMode("stale")}
            className={`px-2.5 py-1 text-xs border transition-all ${
              filterMode === "stale"
                ? "bg-ink text-canvas border-ink font-bold"
                : "bg-canvas text-ink hover:bg-surface-muted border-border-grid"
            }`}
          >
            Stale / Inactive ({deals.filter((d) => getDealStatus(d).isStale).length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span>
            Total Pipeline Value:{" "}
            <strong className="text-ink text-sm">
              ₹
              {(
                deals.reduce((acc, d) => acc + (d.valueINR || 0), 0) / 100000
              ).toFixed(1)}{" "}
              Lakhs
            </strong>
          </span>
        </div>
      </div>

      {/* KANBAN HORIZONTAL COLUMNS */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 min-h-[70vh]">
        {DEAL_STAGES.map((stage) => {
          const stageConfig = STAGE_CONFIG[stage];
          const stageDeals = filteredDeals.filter((d) => d.stage === stage);
          const stageSum = stageDeals.reduce((acc, d) => acc + (d.valueINR || 0), 0);

          return (
            <div
              key={stage}
              className="w-80 shrink-0 bg-surface border-2 border-border-grid flex flex-col shadow-sharp-sm"
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b-2 border-border-grid ${stageConfig.badgeBg} flex items-center justify-between`}
              >
                <div>
                  <div className="font-extrabold text-xs tracking-wider uppercase text-ink flex items-center gap-1.5">
                    <span>{stageConfig.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/70 border border-border-grid">
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageSum > 0 && (
                    <div className="text-[10px] text-ink-muted font-mono mt-0.5">
                      ₹{(stageSum / 100000).toFixed(1)}L total
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Cards Container */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh] bg-canvas/40">
                {stageDeals.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-ink-muted border border-dashed border-border-grid">
                    No deals in {stageConfig.label}
                  </div>
                ) : (
                  stageDeals.map((deal) => {
                    const { isOverdue, overdueDays, isStale, inactiveDays } =
                      getDealStatus(deal);
                    const primaryContact = deal.organization.contacts[0];
                    const isMyDeal = deal.owner?.id === currentUser.id;

                    return (
                      <div
                        key={deal.id}
                        className={`bg-surface border-2 p-3 text-xs space-y-2.5 transition-all shadow-sharp-sm hover:translate-x-0.5 hover:-translate-y-0.5 ${
                          isOverdue
                            ? "border-signal-red"
                            : isStale
                            ? "border-ink border-dashed"
                            : "border-border-grid hover:border-ink"
                        }`}
                      >
                        {/* Card Header: Org Name + Badges */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <Link
                              href={`/deals/${deal.id}`}
                              className="font-bold text-sm text-ink hover:underline flex items-center gap-1"
                            >
                              <span>{deal.organization.name}</span>
                            </Link>

                            <div className="text-[10px] text-ink-muted flex items-center gap-1.5 mt-0.5">
                              {deal.organization.city && <span>{deal.organization.city}</span>}
                              {deal.organization.type && (
                                <span className="uppercase">{deal.organization.type}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {deal.tier && <TierBadge tier={deal.tier} />}
                            {deal.lostReason && (
                              <LostReasonBadge reason={deal.lostReason} />
                            )}
                          </div>
                        </div>

                        {/* Financial Amount if Present */}
                        {deal.valueINR ? (
                          <div className="text-[11px] font-bold text-ink bg-canvas p-1 px-2 border border-border-grid flex items-center justify-between">
                            <span>Target / Committed:</span>
                            <span className="text-sm">
                              ₹{deal.valueINR.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : null}

                        {/* Primary Contact Person */}
                        {primaryContact && (
                          <div className="text-[11px] text-ink bg-surface-muted p-1.5 border border-border-grid space-y-0.5">
                            <div className="font-semibold">{primaryContact.name}</div>
                            {primaryContact.phone && (
                              <div className="text-ink-muted flex items-center justify-between">
                                <span>{primaryContact.phone}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveWhatsAppDeal(deal)}
                                  className="text-green-700 hover:text-green-900 font-bold inline-flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Overdue / Stale Warning Banners */}
                        <div className="flex flex-wrap gap-1">
                          {isOverdue && <OverdueBadge days={overdueDays} />}
                          {isStale && <StaleBadge days={inactiveDays} />}
                        </div>

                        {/* Ownership & Race-Condition-Protected Claim */}
                        <div className="pt-1.5 border-t border-border-grid/70 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1 text-ink-muted">
                            <User className="w-3 h-3 shrink-0" />
                            {deal.owner ? (
                              <span className={isMyDeal ? "font-bold text-ink" : "text-ink"}>
                                {deal.owner.name} {isMyDeal && "(You)"}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleClaim(deal)}
                                disabled={claimingDealId === deal.id}
                                className="bg-signal-amber text-ink font-bold px-2 py-0.5 border border-ink hover:bg-amber-400 transition-colors"
                              >
                                {claimingDealId === deal.id ? "Claiming..." : "Claim Deal"}
                              </button>
                            )}
                          </div>

                          {/* Stage Move Trigger Button */}
                          <button
                            type="button"
                            onClick={() => setActiveStageModalDeal(deal)}
                            className="p-1 hover:bg-canvas text-ink-muted hover:text-ink border border-transparent hover:border-border-grid"
                            title="Advance stage"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Claim Error Display */}
                        {claimError[deal.id] && (
                          <div className="p-1.5 bg-red-50 border border-signal-red text-signal-red text-[10px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{claimError[deal.id]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Modal */}
      {activeWhatsAppDeal && (
        <WhatsAppModal
          isOpen={!!activeWhatsAppDeal}
          onClose={() => setActiveWhatsAppDeal(null)}
          dealId={activeWhatsAppDeal.id}
          contactName={activeWhatsAppDeal.organization.contacts[0]?.name || "Sir/Ma'am"}
          contactPhone={activeWhatsAppDeal.organization.contacts[0]?.phone || ""}
          companyName={activeWhatsAppDeal.organization.name}
          campaignName={campaignName}
          senderName={currentUser.name}
        />
      )}

      {/* Stage Change Modal */}
      {activeStageModalDeal && (
        <StageChangeModal
          isOpen={!!activeStageModalDeal}
          onClose={() => setActiveStageModalDeal(null)}
          dealId={activeStageModalDeal.id}
          companyName={activeStageModalDeal.organization.name}
          currentStage={activeStageModalDeal.stage}
          currentTier={activeStageModalDeal.tier}
          currentValueINR={activeStageModalDeal.valueINR}
          currentDealType={activeStageModalDeal.dealType as any}
        />
      )}
    </div>
  );
}
