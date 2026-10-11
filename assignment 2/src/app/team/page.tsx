import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamManagementView } from "@/components/team/TeamManagementView";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Lead-only view
  if (session.role !== "LEAD") {
    redirect("/");
  }

  const usersRaw = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          deals: {
            where: {
              stage: { notIn: ["CONFIRMED", "LOST"] },
            },
          },
          activities: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const campaignsRaw = await prisma.campaign.findMany({
    include: {
      _count: {
        select: {
          deals: true,
        },
      },
    },
    orderBy: { year: "desc" },
  });

  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt.toISOString(),
    _count: u._count,
  }));

  const campaigns = campaignsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    goalINR: c.goalINR,
    _count: c._count,
  }));

  return (
    <TeamManagementView
      currentUser={session}
      users={users}
      campaigns={campaigns}
    />
  );
}
