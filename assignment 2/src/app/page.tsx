import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  Upload,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  PhoneCall,
  CalendarCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard, KanbanDeal } from "@/components/deals/KanbanBoard";
import { DEAL_STAGES, STAGE_CONFIG, STALE_DAYS_WARNING } from "@/lib/constants";
import { DealStage, SponsorshipTier, LostReason } from "@/types";

interface PageProps {
  searchParams: {
    campaign?: string;
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/password/change");
  }

  // Get current active campaign
  const campaigns = await prisma.campaign.findMany({
    orderBy: { year: "desc" },
  });

  const selectedCampaignId = searchParams.campaign || campaigns[0]?.id;
  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center bg-surface border-2 border-border-grid font-mono">
        <h2 className="text-sm font-bold text-ink uppercase">No Active Campaigns Found</h2>
        <p className="text-xs text-ink-muted mt-1">Please seed or create a campaign to start outreach.</p>
      </div>
    );
  }

  // Fetch all deals for this campaign
  const dealsRaw = await prisma.deal.findMany({
    where: {
      campaignId: currentCampaign.id,
    },
    include: {
      organization: {
        include: {
          contacts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          activities: true,
        },
      },
    },
    orderBy: [{ nextFollowUpAt: "asc" }, { lastActivityAt: "desc" }],
  });

  // Fetch all active team members
  const teamMembers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: { name: "asc" },
  });

  // Transform deals for Kanban
  const deals: KanbanDeal[] = dealsRaw.map((d) => ({
    id: d.id,
    stage: d.stage as DealStage,
    tier: d.tier as SponsorshipTier | null,
    valueINR: d.valueINR,
    dealType: d.dealType,
    nextFollowUpAt: d.nextFollowUpAt ? d.nextFollowUpAt.toISOString() : null,
    lastActivityAt: d.lastActivityAt.toISOString(),
    version: d.version,
    lostReason: d.lostReason as LostReason | null,
    organization: {
      id: d.organization.id,
      name: d.organization.name,
      city: d.organization.city,
      type: d.organization.type,
      domain: d.organization.domain,
      contacts: d.organization.contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        title: c.title,
      })),
    },
    owner: d.owner,
    campaign: d.campaign,
    _count: d._count,
  }));

  // Calculations for Metrics
  const now = new Date();
  const staleDate = new Date(now.getTime() - STALE_DAYS_WARNING * 24 * 60 * 60 * 1000);

  const totalValue = deals.reduce((acc, d) => acc + (d.valueINR || 0), 0);
  const confirmedDeals = deals.filter((d) => d.stage === "CONFIRMED");
  const confirmedValue = confirmedDeals.reduce((acc, d) => acc + (d.valueINR || 0), 0);

  const overdueDeals = deals.filter(
    (d) =>
      d.stage !== "CONFIRMED" &&
      d.stage !== "LOST" &&
      d.nextFollowUpAt &&
      new Date(d.nextFollowUpAt) < now
  );

  const staleDeals = deals.filter(
    (d) =>
      d.stage !== "CONFIRMED" &&
      d.stage !== "LOST" &&
      d.owner &&
      new Date(d.lastActivityAt) < staleDate
  );

  const unassignedDeals = deals.filter((d) => !d.owner);
  const myDeals = deals.filter((d) => d.owner?.id === session.id);
  const myOverdue = overdueDeals.filter((d) => d.owner?.id === session.id);

  // Goal percentage
  const goalPercentage = currentCampaign.goalINR
    ? Math.min(100, Math.round((confirmedValue / currentCampaign.goalINR) * 100))
    : 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner: Quick Actions & Campaign Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border-2 border-border-grid p-4 shadow-sharp">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-signal-green rounded-full inline-block" />
            <h1 className="text-base font-black uppercase text-ink tracking-wide">
              {currentCampaign.name} Pipeline Board
            </h1>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Single-owner deal pipeline with automated duplicate locks and follow-up discipline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/deals/new"
            className="flex items-center gap-1.5 bg-ink text-canvas px-4 py-2 text-xs font-bold hover:bg-stone-800 transition-all shadow-sharp-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Prospect (Dup-Check)</span>
          </Link>

          <Link
            href={`/import?campaign=${currentCampaign.id}`}
            className="flex items-center gap-1.5 bg-canvas border border-border-grid text-ink px-3.5 py-2 text-xs font-bold hover:bg-surface-muted transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </Link>

          <Link
            href="/follow-ups"
            className="flex items-center gap-1.5 bg-canvas border border-border-grid text-ink px-3.5 py-2 text-xs font-bold hover:bg-surface-muted transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Follow-Up Triage</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Target */}
        <div className="bg-surface border-2 border-border-grid p-3 shadow-sharp-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Pipeline Value</div>
          <div className="text-lg font-extrabold text-ink">
            ₹{(totalValue / 100000).toFixed(1)}L
          </div>
          <div className="text-[10px] text-ink-muted">{deals.length} total companies</div>
        </div>

        {/* Confirmed Revenue */}
        <div className="bg-surface border-2 border-border-grid p-3 shadow-sharp-sm space-y-1 bg-green-50/50">
          <div className="text-[10px] uppercase font-bold text-green-800">Confirmed (Closed)</div>
          <div className="text-lg font-extrabold text-green-900">
            ₹{(confirmedValue / 100000).toFixed(1)}L
          </div>
          <div className="text-[10px] text-green-800 font-semibold">
            {currentCampaign.goalINR ? `${goalPercentage}% of ₹${(currentCampaign.goalINR/100000).toFixed(0)}L Goal` : `${confirmedDeals.length} deals closed`}
          </div>
        </div>

        {/* My Assigned Deals */}
        <div className="bg-surface border-2 border-border-grid p-3 shadow-sharp-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-ink-muted">My Active Deals</div>
          <div className="text-lg font-extrabold text-ink">
            {myDeals.length}
          </div>
          <div className="text-[10px] text-ink-muted">
            {myOverdue.length > 0 ? (
              <span className="text-signal-red font-bold">{myOverdue.length} follow-up overdue</span>
            ) : (
              "All up to date"
            )}
          </div>
        </div>

        {/* Open Queue / Unassigned */}
        <div className="bg-surface border-2 border-border-grid p-3 shadow-sharp-sm space-y-1">
          <div className="text-[10px] uppercase font-bold text-ink-muted">Open Queue</div>
          <div className="text-lg font-extrabold text-ink">
            {unassignedDeals.length}
          </div>
          <div className="text-[10px] text-signal-amber font-semibold">
            Ready to claim
          </div>
        </div>

        {/* Overdue Deals Warning */}
        <div
          className={`border-2 p-3 shadow-sharp-sm space-y-1 ${
            overdueDeals.length > 0
              ? "bg-red-50 border-signal-red text-signal-red"
              : "bg-surface border-border-grid text-ink"
          }`}
        >
          <div className="text-[10px] uppercase font-bold">Overdue Actions</div>
          <div className="text-lg font-extrabold">
            {overdueDeals.length}
          </div>
          <div className="text-[10px] font-semibold">
            {overdueDeals.length > 0 ? "Requires contact today" : "Zero overdue backlog"}
          </div>
        </div>

        {/* Stale Warning */}
        <div
          className={`border-2 p-3 shadow-sharp-sm space-y-1 ${
            staleDeals.length > 0
              ? "bg-stone-100 border-ink border-dashed text-ink"
              : "bg-surface border-border-grid text-ink"
          }`}
        >
          <div className="text-[10px] uppercase font-bold">Stale Pipeline (10d+)</div>
          <div className="text-lg font-extrabold">
            {staleDeals.length}
          </div>
          <div className="text-[10px] text-ink-muted">
            {staleDeals.length > 0 ? "Needs touch or reclaim" : "Fresh engagement"}
          </div>
        </div>
      </div>

      {/* Main Kanban Board with Live Filter Controls */}
      <div className="space-y-2">
        <KanbanBoard
          deals={deals}
          currentUser={session}
          campaignName={currentCampaign.name}
          campaignId={currentCampaign.id}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
