import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Clock,
  Building2,
  User,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEAL_STAGES, STAGE_CONFIG, STALE_DAYS_WARNING } from "@/lib/constants";
import {
  StageBadge,
  TierBadge,
  OverdueBadge,
  StaleBadge,
  LostReasonBadge,
} from "@/components/ui/Badge";
import { DealStage, SponsorshipTier, LostReason } from "@/types";

interface DealsPageProps {
  searchParams: {
    q?: string;
    campaign?: string;
    stage?: string;
    owner?: string;
    stale?: string;
    overdue?: string;
  };
}

export default async function DealsListPage({ searchParams }: DealsPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { year: "desc" },
  });

  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const staleDate = new Date(now.getTime() - STALE_DAYS_WARNING * 24 * 60 * 60 * 1000);

  // Build Prisma where query
  const where: any = {};

  if (searchParams.campaign) {
    where.campaignId = searchParams.campaign;
  }

  if (searchParams.stage && searchParams.stage !== "ALL") {
    where.stage = searchParams.stage;
  }

  if (searchParams.owner) {
    if (searchParams.owner === "MINE") {
      where.ownerId = session.id;
    } else if (searchParams.owner === "UNCLAIMED") {
      where.ownerId = null;
    } else if (searchParams.owner !== "ALL") {
      where.ownerId = searchParams.owner;
    }
  }

  if (searchParams.stale === "true") {
    where.stage = { notIn: ["CONFIRMED", "LOST"] };
    where.ownerId = { not: null };
    where.lastActivityAt = { lt: staleDate };
  }

  if (searchParams.overdue === "true") {
    where.stage = { notIn: ["CONFIRMED", "LOST"] };
    where.nextFollowUpAt = { lt: now };
  }

  if (searchParams.q) {
    const q = searchParams.q.trim();
    where.OR = [
      { organization: { name: { contains: q } } },
      { organization: { domain: { contains: q } } },
      { organization: { city: { contains: q } } },
      { organization: { contacts: { some: { name: { contains: q } } } } },
      { organization: { contacts: { some: { phone: { contains: q } } } } },
    ];
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      organization: {
        include: {
          contacts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
      campaign: {
        select: { id: true, name: true },
      },
      _count: {
        select: { activities: true },
      },
    },
    orderBy: [{ nextFollowUpAt: "asc" }, { lastActivityAt: "desc" }],
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border-2 border-border-grid p-4 shadow-sharp">
        <div>
          <h1 className="text-base font-extrabold uppercase tracking-wide text-ink">
            Master Deals Directory
          </h1>
          <p className="text-ink-muted text-xs mt-0.5">
            Search, filter, and audit all outreach deals across campaigns and team owners.
          </p>
        </div>

        <Link
          href="/deals/new"
          className="flex items-center gap-1.5 bg-ink text-canvas px-4 py-2 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Prospect (Dup-Check)</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <form
        method="GET"
        className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
              Search Keywords:
            </label>
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Company, domain, contact, phone..."
                className="w-full bg-canvas border border-border-grid p-2 pl-7 text-xs font-mono text-ink focus:border-ink"
              />
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2 top-2.5" />
            </div>
          </div>

          {/* Campaign Filter */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
              Campaign:
            </label>
            <select
              name="campaign"
              defaultValue={searchParams.campaign || ""}
              className="w-full bg-canvas border border-border-grid p-2 text-xs font-mono text-ink font-semibold"
            >
              <option value="">-- All Campaigns --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
              Stage:
            </label>
            <select
              name="stage"
              defaultValue={searchParams.stage || ""}
              className="w-full bg-canvas border border-border-grid p-2 text-xs font-mono text-ink font-semibold"
            >
              <option value="">-- All Stages --</option>
              {DEAL_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_CONFIG[s]?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ownership Filter */}
          <div>
            <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
              Owner:
            </label>
            <select
              name="owner"
              defaultValue={searchParams.owner || ""}
              className="w-full bg-canvas border border-border-grid p-2 text-xs font-mono text-ink font-semibold"
            >
              <option value="">-- All Owners --</option>
              <option value="MINE">My Deals (Assigned to Me)</option>
              <option value="UNCLAIMED">Open Queue (Unclaimed)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-grid">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="overdue"
                value="true"
                defaultChecked={searchParams.overdue === "true"}
                className="accent-signal-red w-3.5 h-3.5"
              />
              <span className="font-bold text-signal-red text-xs">
                Overdue Follow-Ups Only
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="stale"
                value="true"
                defaultChecked={searchParams.stale === "true"}
                className="accent-ink w-3.5 h-3.5"
              />
              <span className="font-bold text-ink text-xs">
                Stale Inactive (10d+) Only
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/deals"
              className="px-3 py-1.5 border border-border-grid bg-canvas text-ink hover:bg-surface-muted"
            >
              Reset Filters
            </Link>
            <button
              type="submit"
              className="px-4 py-1.5 bg-ink text-canvas font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="font-bold text-ink uppercase">
          Matching Deals ({deals.length})
        </span>
        <span className="text-ink-muted">
          Total Value: ₹
          {(deals.reduce((a, b) => a + (b.valueINR || 0), 0) / 100000).toFixed(1)}L
        </span>
      </div>

      {/* Deals Table */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp overflow-x-auto">
        {deals.length === 0 ? (
          <div className="p-8 text-center text-ink-muted space-y-2">
            <div>No matching deals found with current filters.</div>
            <Link href="/deals" className="text-ink underline font-bold">
              Clear filters to view all records
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ink text-canvas uppercase text-[10px]">
                <th className="p-3 border border-ink">Organization / Campaign</th>
                <th className="p-3 border border-ink">Stage &amp; Tier</th>
                <th className="p-3 border border-ink">Value (₹)</th>
                <th className="p-3 border border-ink">Primary Contact</th>
                <th className="p-3 border border-ink">Owner</th>
                <th className="p-3 border border-ink">Follow-Up Date</th>
                <th className="p-3 border border-ink">Last Touch</th>
                <th className="p-3 border border-ink text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-grid">
              {deals.map((deal) => {
                const primaryContact = deal.organization.contacts[0];
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
                const inactiveDays = Math.floor(
                  (now.getTime() - lastAct.getTime()) / (1000 * 60 * 60 * 24)
                );
                const isStale =
                  !isClosed && deal.owner && inactiveDays >= STALE_DAYS_WARNING;

                return (
                  <tr
                    key={deal.id}
                    className={`hover:bg-canvas transition-colors ${
                      isOverdue ? "bg-red-50/40" : isStale ? "bg-stone-50/50" : ""
                    }`}
                  >
                    {/* Organization & Campaign */}
                    <td className="p-3 border-r border-border-grid">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="font-bold text-sm text-ink hover:underline block"
                      >
                        {deal.organization.name}
                      </Link>
                      <div className="text-[10px] text-ink-muted flex items-center gap-2 mt-0.5">
                        <span>{deal.campaign.name}</span>
                        {deal.organization.domain && (
                          <span className="text-stone-500">
                            • {deal.organization.domain}
                          </span>
                        )}
                        {deal.organization.city && (
                          <span className="text-stone-500">
                            • {deal.organization.city}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stage & Tier */}
                    <td className="p-3 border-r border-border-grid space-y-1">
                      <StageBadge stage={deal.stage as DealStage} />
                      {deal.tier && <TierBadge tier={deal.tier as SponsorshipTier} />}
                      {deal.lostReason && (
                        <LostReasonBadge reason={deal.lostReason as LostReason} />
                      )}
                    </td>

                    {/* Financial Value */}
                    <td className="p-3 border-r border-border-grid font-bold text-ink">
                      {deal.valueINR ? (
                        <span>₹{deal.valueINR.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="text-ink-muted font-normal">—</span>
                      )}
                    </td>

                    {/* Primary Contact */}
                    <td className="p-3 border-r border-border-grid text-[11px]">
                      {primaryContact ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-ink">
                            {primaryContact.name}
                            {primaryContact.title && (
                              <span className="text-[10px] text-ink-muted font-normal ml-1">
                                ({primaryContact.title})
                              </span>
                            )}
                          </div>
                          {primaryContact.phone && (
                            <div className="text-ink-muted flex items-center gap-1">
                              <span>{primaryContact.phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted">No contacts listed</span>
                      )}
                    </td>

                    {/* Deal Owner */}
                    <td className="p-3 border-r border-border-grid font-semibold">
                      {deal.owner ? (
                        <span
                          className={
                            deal.owner.id === session.id
                              ? "font-bold text-ink"
                              : "text-ink"
                          }
                        >
                          {deal.owner.name} {deal.owner.id === session.id && "(You)"}
                        </span>
                      ) : (
                        <span className="text-signal-amber font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-300">
                          Open Queue
                        </span>
                      )}
                    </td>

                    {/* Next Follow-Up */}
                    <td className="p-3 border-r border-border-grid">
                      {isClosed ? (
                        <span className="text-ink-muted">—</span>
                      ) : deal.nextFollowUpAt ? (
                        <div className="space-y-1">
                          <div className="text-ink">
                            {new Date(deal.nextFollowUpAt).toLocaleDateString(
                              "en-IN",
                              { month: "short", day: "numeric" }
                            )}
                          </div>
                          {isOverdue && <OverdueBadge days={overdueDays} />}
                        </div>
                      ) : (
                        <span className="text-signal-amber font-bold">Unscheduled</span>
                      )}
                    </td>

                    {/* Last Touch / Activity */}
                    <td className="p-3 border-r border-border-grid text-[11px]">
                      <div className="text-ink-muted">
                        {new Date(deal.lastActivityAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-ink-muted">
                        {deal._count.activities} logs
                      </div>
                      {isStale && <StaleBadge days={inactiveDays} />}
                    </td>

                    {/* View Action */}
                    <td className="p-3 text-right">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="inline-flex items-center gap-1 bg-ink text-canvas px-2.5 py-1 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
