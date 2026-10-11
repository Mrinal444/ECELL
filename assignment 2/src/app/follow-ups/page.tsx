import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FollowUpTriageView } from "@/components/deals/FollowUpTriageView";
import { DealStage, SponsorshipTier } from "@/types";

export default async function FollowUpsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all active deals
  const dealsRaw = await prisma.deal.findMany({
    where: {
      stage: { notIn: ["CONFIRMED", "LOST"] },
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
    },
    orderBy: [{ nextFollowUpAt: "asc" }, { lastActivityAt: "desc" }],
  });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { year: "desc" },
    select: { id: true, name: true, year: true },
  });

  const teamMembers = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const deals = dealsRaw.map((d) => ({
    id: d.id,
    stage: d.stage as DealStage,
    tier: d.tier as SponsorshipTier | null,
    valueINR: d.valueINR,
    nextFollowUpAt: d.nextFollowUpAt ? d.nextFollowUpAt.toISOString() : null,
    lastActivityAt: d.lastActivityAt.toISOString(),
    organization: {
      id: d.organization.id,
      name: d.organization.name,
      domain: d.organization.domain,
      city: d.organization.city,
      contacts: d.organization.contacts.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        title: c.title,
      })),
    },
    owner: d.owner,
    campaign: d.campaign,
  }));

  return (
    <FollowUpTriageView
      deals={deals}
      currentUser={session}
      campaigns={campaigns}
      teamMembers={teamMembers}
    />
  );
}
