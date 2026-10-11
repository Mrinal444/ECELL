import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationDetailView } from "@/components/orgs/OrganizationDetailView";

interface OrgPageProps {
  params: {
    id: string;
  };
}

export default async function OrgDetailPage({ params }: OrgPageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const organizationRaw = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      contacts: {
        orderBy: { createdAt: "asc" },
      },
      deals: {
        include: {
          campaign: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!organizationRaw) {
    notFound();
  }

  // Fetch all other organizations for Lead Merge Tool
  const allOrganizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
      normalizedName: true,
    },
    orderBy: { name: "asc" },
  });

  const organization = {
    ...organizationRaw,
    createdAt: organizationRaw.createdAt.toISOString(),
    contacts: organizationRaw.contacts.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    deals: organizationRaw.deals.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      lastActivityAt: d.lastActivityAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deals Pipeline</span>
        </Link>
        <span className="text-[10px] text-ink-muted uppercase">
          Organization ID: {organization.id}
        </span>
      </div>

      <OrganizationDetailView
        organization={organization}
        currentUser={session}
        allOrganizations={allOrganizations}
      />
    </div>
  );
}
