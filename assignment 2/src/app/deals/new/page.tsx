import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Building2 } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateDealForm } from "@/components/deals/CreateDealForm";

export default async function NewDealPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { year: "desc" },
    select: { id: true, name: true, year: true },
  });

  if (campaigns.length === 0) {
    return (
      <div className="p-8 text-center bg-surface border-2 border-border-grid font-mono">
        <h2 className="text-sm font-bold text-ink uppercase">No Campaigns Configured</h2>
        <p className="text-xs text-ink-muted mt-1">Please create a campaign first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deals Pipeline</span>
        </Link>
        <span className="text-[10px] text-ink-muted uppercase">
          New Prospect Entry
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-black uppercase text-ink tracking-wide">
          Register New Outreach Prospect
        </h1>
        <p className="text-xs text-ink-muted">
          Create an organization record and campaign deal with real-time duplicate screening.
        </p>
      </div>

      <CreateDealForm
        campaigns={campaigns}
        defaultCampaignId={campaigns[0].id}
        currentUserId={session.id}
      />
    </div>
  );
}
