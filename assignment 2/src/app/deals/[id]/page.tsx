import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DealDetailView } from "@/components/deals/DealDetailView";
import { DealStage, SponsorshipTier, LostReason } from "@/types";

interface DealPageProps {
  params: {
    id: string;
  };
}

export default async function DealDetailPage({ params }: DealPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const dealRaw = await prisma.deal.findUnique({
    where: { id: params.id },
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
          role: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          year: true,
        },
      },
      activities: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dealRaw) {
    notFound();
  }

  // Active team members for reassign modal
  const teamMembers = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
    orderBy: { name: "asc" },
  });

  const deal = {
    ...dealRaw,
    stage: dealRaw.stage as DealStage,
    tier: dealRaw.tier as SponsorshipTier | null,
    lostReason: dealRaw.lostReason as LostReason | null,
    nextFollowUpAt: dealRaw.nextFollowUpAt ? dealRaw.nextFollowUpAt.toISOString() : null,
    lastActivityAt: dealRaw.lastActivityAt.toISOString(),
    createdAt: dealRaw.createdAt.toISOString(),
    activities: dealRaw.activities.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deals Directory</span>
        </Link>
        <span className="text-[10px] text-ink-muted uppercase">
          Deal ID: {deal.id}
        </span>
      </div>

      <DealDetailView
        deal={deal}
        currentUser={session}
        teamMembers={teamMembers}
      />
    </div>
  );
}
