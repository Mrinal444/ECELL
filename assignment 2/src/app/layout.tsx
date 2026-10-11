import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { STALE_DAYS_WARNING } from "@/lib/constants";

export const metadata: Metadata = {
  title: "E-Cell Outreach CRM | Sponsorship & Corporate Relations",
  description: "Enterprise sponsorship, speaker, and partner outreach CRM for IIT/Campus E-Cells.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  let campaigns: { id: string; name: string; year: number }[] = [];
  let overdueCount = 0;
  let myOverdueCount = 0;
  let staleCount = 0;

  if (session) {
    campaigns = await prisma.campaign.findMany({
      orderBy: { year: "desc" },
      select: { id: true, name: true, year: true },
    });

    const now = new Date();
    const staleDate = new Date(now.getTime() - STALE_DAYS_WARNING * 24 * 60 * 60 * 1000);

    // Overdue count (Active deals where nextFollowUpAt < now)
    const overdueDeals = await prisma.deal.findMany({
      where: {
        stage: { notIn: ["CONFIRMED", "LOST"] },
        nextFollowUpAt: { lt: now },
      },
      select: { id: true, ownerId: true },
    });

    overdueCount = overdueDeals.length;
    myOverdueCount = overdueDeals.filter((d) => d.ownerId === session.id).length;

    // Stale count (Owned active deals with lastActivityAt < staleDate)
    staleCount = await prisma.deal.count({
      where: {
        stage: { notIn: ["CONFIRMED", "LOST"] },
        ownerId: { not: null },
        lastActivityAt: { lt: staleDate },
      },
    });
  }

  return (
    <html lang="en">
      <body className="bg-canvas text-ink min-h-[100dvh] flex flex-col font-sans selection:bg-signal-amber selection:text-ink">
        {session && (
          <Navbar
            user={session}
            campaigns={campaigns}
            currentCampaignId={campaigns[0]?.id}
            overdueCount={overdueCount}
            myOverdueCount={myOverdueCount}
            staleCount={staleCount}
          />
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4">
          {children}
        </main>

        <footer className="border-t border-border-grid py-4 px-6 text-center text-xs font-mono text-ink-muted bg-surface mt-auto">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <span>E-Cell Sponsorship &amp; Outreach CRM v1.0</span>
            <span className="text-[11px]">Designed for high-velocity campus outreach &bull; Zero duplicate outreach</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
