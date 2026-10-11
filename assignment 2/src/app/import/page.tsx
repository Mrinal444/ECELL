import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CsvWizard } from "@/components/import/CsvWizard";

interface ImportPageProps {
  searchParams: {
    campaign?: string;
  };
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
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
        <h2 className="text-sm font-bold text-ink uppercase">No Active Campaigns</h2>
        <p className="text-xs text-ink-muted mt-1">Please create a campaign first before importing prospects.</p>
      </div>
    );
  }

  const selectedCampaignId = searchParams.campaign || campaigns[0].id;
  const currentCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-mono text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deals Pipeline</span>
        </Link>
        <span className="text-[10px] text-ink-muted uppercase">
          Target Campaign: {currentCampaign.name} ({currentCampaign.year})
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-black uppercase text-ink tracking-wide flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-ink" />
          <span>Ingest Sponsor Data from Excel / CSV</span>
        </h1>
        <p className="text-xs text-ink-muted">
          Batch import corporate leads with flexible column mapping, live duplicate screening, and execution audit reporting.
        </p>
      </div>

      {/* CSV Wizard */}
      <CsvWizard
        campaignId={currentCampaign.id}
        campaignName={currentCampaign.name}
      />
    </div>
  );
}
