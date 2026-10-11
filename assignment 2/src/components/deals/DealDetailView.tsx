"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  AlertCircle,
  Plus,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  Flame,
} from "lucide-react";
import {
  StageBadge,
  TierBadge,
  OverdueBadge,
  StaleBadge,
  LostReasonBadge,
  RoleBadge,
} from "@/components/ui/Badge";
import { WhatsAppModal } from "@/components/deals/WhatsAppModal";
import { StageChangeModal } from "@/components/deals/StageChangeModal";
import { ReassignModal } from "@/components/deals/ReassignModal";
import { ActivityTimeline } from "@/components/deals/ActivityTimeline";
import {
  claimDealAction,
  snoozeFollowUpAction,
  reclaimStaleDealAction,
} from "@/actions/deals";
import { addContactAction } from "@/actions/organizations";
import { DEAL_STAGES, STAGE_CONFIG, STALE_DAYS_WARNING } from "@/lib/constants";
import { DealStage, SponsorshipTier, LostReason, PaymentStatus, DealType, SessionUser } from "@/types";

interface DealDetailViewProps {
  deal: {
    id: string;
    stage: DealStage;
    tier?: SponsorshipTier | null;
    valueINR?: number | null;
    dealType?: string | null;
    paymentStatus?: string | null;
    nextFollowUpAt?: string | null;
    lastActivityAt: string;
    version: number;
    lostReason?: LostReason | null;
    createdAt: string;
    organization: {
      id: string;
      name: string;
      normalizedName: string;
      domain?: string | null;
      type: string;
      city?: string | null;
      notes?: string | null;
      contacts: {
        id: string;
        name: string;
        title?: string | null;
        phone?: string | null;
        email?: string | null;
      }[];
    };
    owner?: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    campaign: {
      id: string;
      name: string;
      year: number;
    };
    activities: {
      id: string;
      type: string;
      body: string;
      createdAt: string;
      metadata?: string | null;
      user: {
        id: string;
        name: string;
        role: string;
      };
    }[];
  };
  currentUser: SessionUser;
  teamMembers: { id: string; name: string; email: string; role: string; active: boolean }[];
}

export function DealDetailView({ deal, currentUser, teamMembers }: DealDetailViewProps) {
  // Modal States
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Quick Action States
  const [snoozing, setSnoozing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [reclaiming, setReclaiming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Contact State
  const [newContact, setNewContact] = useState({ name: "", title: "", phone: "", email: "" });
  const [addingContact, setAddingContact] = useState(false);

  // Permissions
  const isOwner = deal.owner?.id === currentUser.id;
  const isLead = currentUser.role === "LEAD";
  const isOwnerOrLead = isOwner || isLead;

  const now = new Date();
  const isClosed = deal.stage === "CONFIRMED" || deal.stage === "LOST";

  let isOverdue = false;
  let overdueDays = 0;
  if (!isClosed && deal.nextFollowUpAt) {
    const fDate = new Date(deal.nextFollowUpAt);
    if (fDate < now) {
      isOverdue = true;
      overdueDays = Math.max(
        1,
        Math.floor((now.getTime() - fDate.getTime()) / (1000 * 60 * 60 * 24))
      );
    }
  }

  const lastAct = new Date(deal.lastActivityAt);
  const inactiveDays = Math.floor((now.getTime() - lastAct.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = !isClosed && deal.owner && inactiveDays >= STALE_DAYS_WARNING;
  const canReclaim = isLead && deal.owner && inactiveDays >= 20;

  const handleClaim = async () => {
    setClaiming(true);
    setActionError(null);
    try {
      const res = await claimDealAction(deal.id, deal.version);
      if (!res.success) {
        setActionError(res.error || "Claim failed. Deal may have been modified by another teammate.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to claim deal.");
    } finally {
      setClaiming(false);
    }
  };

  const handleSnooze = async (days: number) => {
    setSnoozing(true);
    setActionError(null);
    try {
      const res = await snoozeFollowUpAction(deal.id, days);
      if (!res.success) {
        setActionError(res.error || "Failed to reschedule follow-up.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to snooze follow-up.");
    } finally {
      setSnoozing(false);
    }
  };

  const handleReclaim = async () => {
    if (!confirm("Are you sure you want to reclaim this stale deal into the Open Queue?")) return;
    setReclaiming(true);
    setActionError(null);
    try {
      const res = await reclaimStaleDealAction(deal.id);
      if (!res.success) {
        setActionError(res.error || "Failed to reclaim deal.");
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to reclaim deal.");
    } finally {
      setReclaiming(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;
    setAddingContact(true);
    setActionError(null);

    try {
      const res = await addContactAction(deal.organization.id, {
        name: newContact.name.trim(),
        title: newContact.title.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        email: newContact.email.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || "Failed to add contact.");
      } else {
        setIsAddContactOpen(false);
        setNewContact({ name: "", title: "", phone: "", email: "" });
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to add contact.");
    } finally {
      setAddingContact(false);
    }
  };

  const primaryContact = deal.organization.contacts[0];

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header Card */}
      <div className="bg-surface border-2 border-border-grid p-6 shadow-sharp space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 bg-canvas border border-border-grid text-ink uppercase">
                {deal.campaign.name} ({deal.campaign.year})
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-canvas border border-border-grid text-ink uppercase">
                {deal.organization.type}
              </span>
            </div>

            <h1 className="text-xl font-black text-ink tracking-tight flex items-center gap-2">
              <span>{deal.organization.name}</span>
              {deal.organization.domain && (
                <a
                  href={`https://${deal.organization.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-0.5 font-normal"
                >
                  <span>({deal.organization.domain})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </h1>

            <div className="text-ink-muted flex items-center gap-3 text-[11px]">
              {deal.organization.city && <span>City: {deal.organization.city}</span>}
              <span>&bull;</span>
              <Link
                href={`/orgs/${deal.organization.id}`}
                className="text-ink hover:underline font-bold inline-flex items-center gap-1"
              >
                <span>View Company Profile Across All Years</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Badges & Quick Action Triggers */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <StageBadge stage={deal.stage} />
              {deal.tier && <TierBadge tier={deal.tier} />}
              {deal.lostReason && <LostReasonBadge reason={deal.lostReason} />}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* WhatsApp Quick Launcher */}
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="flex items-center gap-1.5 bg-green-700 text-white px-3.5 py-1.5 font-bold hover:bg-green-800 transition-colors shadow-sharp-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Outreach</span>
              </button>

              {/* Advance Stage Trigger */}
              {isOwnerOrLead ? (
                <button
                  type="button"
                  onClick={() => setIsStageModalOpen(true)}
                  className="flex items-center gap-1.5 bg-ink text-canvas px-3.5 py-1.5 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Advance Stage</span>
                </button>
              ) : null}

              {/* Reassign Trigger */}
              {isLead || isOwner ? (
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(true)}
                  className="flex items-center gap-1.5 bg-canvas border border-border-grid text-ink px-3 py-1.5 font-bold hover:bg-surface-muted transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Error Notice */}
        {actionError && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Warning Banners (Overdue / Stale / Unclaimed) */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-grid">
          {isOverdue && (
            <div className="p-2 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2 w-full">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                <strong>Follow-Up Overdue:</strong> Scheduled touch was due {overdueDays} day(s) ago. Please message or log activity.
              </span>
            </div>
          )}

          {isStale && (
            <div className="p-2 bg-stone-100 border border-ink border-dashed text-ink flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Stale Outreach Warning:</strong> No activity logged for {inactiveDays} days.
                </span>
              </div>
              {canReclaim && (
                <button
                  type="button"
                  onClick={handleReclaim}
                  disabled={reclaiming}
                  className="bg-signal-red text-white px-2.5 py-1 font-bold text-[11px] hover:bg-red-700"
                >
                  {reclaiming ? "Reclaiming..." : "Lead Reclaim (Move to Open Queue)"}
                </button>
              )}
            </div>
          )}

          {!deal.owner && (
            <div className="p-3 bg-amber-50 border border-signal-amber text-amber-900 flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-signal-amber" />
                <span>
                  <strong>Unassigned Prospect:</strong> This company is in the Open Queue. Claim exclusive ownership to start outreach.
                </span>
              </div>
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="bg-signal-amber text-ink font-bold px-4 py-1.5 border border-ink hover:bg-amber-400 transition-colors shadow-sharp-sm"
              >
                {claiming ? "Claiming..." : "Claim This Deal"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Details, Right Column Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PARAMETERS & CONTACTS */}
        <div className="lg:col-span-1 space-y-6">
          {/* Financial & Deal Terms */}
          <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3">
            <h3 className="font-bold text-ink uppercase text-[11px] flex items-center gap-1.5 border-b border-border-grid pb-2">
              <DollarSign className="w-4 h-4" />
              <span>Deal Parameters &amp; Terms</span>
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Committed / Target:</span>
                <span className="font-bold text-ink text-sm">
                  {deal.valueINR ? `₹${deal.valueINR.toLocaleString("en-IN")}` : "Not finalized"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Sponsorship Tier:</span>
                <span className="font-bold text-ink">
                  {deal.tier ? deal.tier.replace("_", " ") : "Flexible"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Deal Structure:</span>
                <span className="font-bold text-ink uppercase">
                  {deal.dealType || "CASH"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Payment Status:</span>
                <span className="font-bold text-ink uppercase">
                  {deal.paymentStatus || "PLEDGED"}
                </span>
              </div>
            </div>
          </div>

          {/* Follow-Up Schedule & Snooze */}
          <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3">
            <h3 className="font-bold text-ink uppercase text-[11px] flex items-center gap-1.5 border-b border-border-grid pb-2">
              <Clock className="w-4 h-4" />
              <span>Follow-Up Cadence</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Next Scheduled Touch:</span>
                <span className={`font-bold ${isOverdue ? "text-signal-red" : "text-ink"}`}>
                  {deal.nextFollowUpAt
                    ? new Date(deal.nextFollowUpAt).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "None Scheduled"}
                </span>
              </div>

              {/* Quick Snooze Bar */}
              {isOwnerOrLead && !isClosed && (
                <div className="pt-2 border-t border-border-grid space-y-1.5">
                  <div className="text-[10px] text-ink-muted uppercase font-bold">
                    Quick Snooze Follow-Up:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={snoozing}
                      onClick={() => handleSnooze(1)}
                      className="p-1.5 bg-canvas border border-border-grid text-ink font-bold hover:bg-surface-muted text-center"
                    >
                      +1 Day
                    </button>
                    <button
                      type="button"
                      disabled={snoozing}
                      onClick={() => handleSnooze(3)}
                      className="p-1.5 bg-canvas border border-border-grid text-ink font-bold hover:bg-surface-muted text-center"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      disabled={snoozing}
                      onClick={() => handleSnooze(7)}
                      className="p-1.5 bg-canvas border border-border-grid text-ink font-bold hover:bg-surface-muted text-center"
                    >
                      +7 Days
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deal Ownership */}
          <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3">
            <h3 className="font-bold text-ink uppercase text-[11px] flex items-center gap-1.5 border-b border-border-grid pb-2">
              <User className="w-4 h-4" />
              <span>Deal Ownership</span>
            </h3>

            {deal.owner ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-sm">{deal.owner.name}</span>
                  <RoleBadge role={deal.owner.role} />
                </div>
                <div className="text-ink-muted text-[11px]">{deal.owner.email}</div>
                {isOwner && (
                  <div className="text-[10px] text-green-800 font-bold bg-green-50 p-1 border border-green-200 mt-1">
                    ✓ You are the exclusive owner of this pipeline deal
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-signal-amber font-bold">Unassigned (Open Queue)</div>
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full bg-signal-amber text-ink font-bold py-2 border border-ink hover:bg-amber-400 shadow-sharp-sm"
                >
                  {claiming ? "Claiming..." : "Claim Deal Now"}
                </button>
              </div>
            )}
          </div>

          {/* Contacts List with Quick Add */}
          <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border-grid pb-2">
              <h3 className="font-bold text-ink uppercase text-[11px] flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>Contact Persons ({deal.organization.contacts.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(!isAddContactOpen)}
                className="text-[10px] bg-canvas border border-border-grid px-2 py-0.5 font-bold hover:bg-surface-muted"
              >
                {isAddContactOpen ? "Cancel" : "+ Add Contact"}
              </button>
            </div>

            {/* Inline Add Contact Form */}
            {isAddContactOpen && (
              <form
                onSubmit={handleAddContact}
                className="p-3 bg-canvas border border-border-grid space-y-2"
              >
                <div className="font-bold text-ink uppercase text-[10px]">
                  Add New Contact:
                </div>
                <input
                  type="text"
                  required
                  placeholder="Full Name*"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full bg-white border border-border-grid p-1.5 text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Title / Role (e.g. CMO)"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  className="w-full bg-white border border-border-grid p-1.5 text-xs font-mono"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full bg-white border border-border-grid p-1.5 text-xs font-mono"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full bg-white border border-border-grid p-1.5 text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={addingContact}
                  className="w-full bg-ink text-canvas py-1.5 font-bold hover:bg-stone-800 text-xs shadow-sharp-sm"
                >
                  {addingContact ? "Adding..." : "Save Contact"}
                </button>
              </form>
            )}

            {/* Existing Contacts */}
            <div className="space-y-2.5">
              {deal.organization.contacts.length === 0 ? (
                <div className="text-ink-muted text-center py-2">
                  No contact persons added yet.
                </div>
              ) : (
                deal.organization.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-canvas border border-border-grid space-y-1"
                  >
                    <div className="font-bold text-ink text-xs flex items-center justify-between">
                      <span>{c.name}</span>
                      {c.title && (
                        <span className="text-[10px] text-ink-muted font-normal">
                          {c.title}
                        </span>
                      )}
                    </div>

                    {c.phone && (
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{c.phone}</span>
                        <button
                          type="button"
                          onClick={() => setIsWhatsAppOpen(true)}
                          className="text-green-700 hover:text-green-900 font-bold inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    )}

                    {c.email && (
                      <div className="text-[11px] text-ink-muted">
                        <a
                          href={`mailto:${c.email}`}
                          className="hover:underline text-ink"
                        >
                          {c.email}
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: APPEND-ONLY ACTIVITY AUDIT TRAIL */}
        <div className="lg:col-span-2 space-y-4">
          <ActivityTimeline
            dealId={deal.id}
            activities={deal.activities}
            currentUser={currentUser}
            isOwnerOrLead={isOwnerOrLead}
            onActivityAdded={() => {
              // Activity timeline automatically refetches/revalidates
            }}
          />
        </div>
      </div>

      {/* Modals */}
      {isWhatsAppOpen && primaryContact && (
        <WhatsAppModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          dealId={deal.id}
          contactName={primaryContact.name}
          contactPhone={primaryContact.phone || ""}
          companyName={deal.organization.name}
          campaignName={deal.campaign.name}
          senderName={currentUser.name}
        />
      )}

      {isStageModalOpen && (
        <StageChangeModal
          isOpen={isStageModalOpen}
          onClose={() => setIsStageModalOpen(false)}
          dealId={deal.id}
          companyName={deal.organization.name}
          currentStage={deal.stage}
          currentTier={deal.tier}
          currentValueINR={deal.valueINR}
          currentDealType={deal.dealType as any}
          currentPaymentStatus={deal.paymentStatus as any}
        />
      )}

      {isReassignModalOpen && (
        <ReassignModal
          isOpen={isReassignModalOpen}
          onClose={() => setIsReassignModalOpen(false)}
          dealId={deal.id}
          companyName={deal.organization.name}
          currentOwnerName={deal.owner?.name}
          currentOwnerId={deal.owner?.id}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
