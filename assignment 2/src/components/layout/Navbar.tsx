"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Table,
  Clock,
  UploadCloud,
  Users,
  Plus,
  LogOut,
  ChevronDown,
  Building2,
  Bell,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { SessionUser } from "@/types";
import { RoleBadge } from "@/components/ui/Badge";
import { logoutAction } from "@/actions/auth";

interface NavbarProps {
  user: SessionUser;
  campaigns: { id: string; name: string; year: number }[];
  currentCampaignId: string;
  overdueCount: number;
  myOverdueCount: number;
  staleCount: number;
}

export function Navbar({
  user,
  campaigns,
  currentCampaignId,
  overdueCount,
  myOverdueCount,
  staleCount,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLead = user.role === "LEAD";
  const displayOverdue = isLead ? overdueCount : myOverdueCount;

  const handleCampaignChange = (campaignId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("campaign", campaignId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  const navLinks = [
    {
      href: `/?campaign=${currentCampaignId}`,
      label: "Pipeline",
      icon: Layers,
      active: pathname === "/",
    },
    {
      href: `/deals?campaign=${currentCampaignId}`,
      label: "Deals",
      icon: Table,
      active: pathname.startsWith("/deals") && pathname !== "/deals/new",
    },
    {
      href: `/follow-ups?campaign=${currentCampaignId}`,
      label: "Follow-ups",
      icon: Clock,
      active: pathname.startsWith("/follow-ups"),
      badge: displayOverdue > 0 ? displayOverdue : null,
    },
    {
      href: `/import?campaign=${currentCampaignId}`,
      label: "CSV Import",
      icon: UploadCloud,
      active: pathname.startsWith("/import"),
    },
    ...(isLead
      ? [
          {
            href: "/team",
            label: "Team Ops",
            icon: Users,
            active: pathname.startsWith("/team"),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b-2 border-border-grid">
      {/* Top Banner / System Bar */}
      <div className="bg-ink text-canvas px-4 py-1.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold tracking-widest uppercase">
            <span className="w-2 h-2 bg-signal-amber inline-block" />
            E-Cell Outreach Core v1.0
          </span>
          <span className="hidden md:inline text-canvas-muted">|</span>
          <span className="hidden md:inline text-canvas-muted">
            Campus Sponsorship & Deal Pipeline
          </span>
        </div>

        <div className="flex items-center gap-4">
          {displayOverdue > 0 && (
            <Link
              href={`/follow-ups?campaign=${currentCampaignId}&filter=overdue`}
              className="flex items-center gap-1.5 bg-signal-red text-white px-2 py-0.5 text-[11px] font-bold hover:bg-red-700 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {displayOverdue} OVERDUE ACTION{displayOverdue > 1 ? "S" : ""}
            </Link>
          )}

          {staleCount > 0 && isLead && (
            <Link
              href={`/deals?campaign=${currentCampaignId}&stale=true`}
              className="hidden sm:flex items-center gap-1 text-signal-amber font-mono text-[11px] hover:underline"
            >
              <span>{staleCount} Stale Deal{staleCount > 1 ? "s" : ""}</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-ink-muted/50">
            <span className="text-canvas-muted hidden sm:inline">Logged in as</span>
            <span className="font-semibold text-canvas">{user.name}</span>
            <RoleBadge role={user.role} />
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Campaign Picker */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-ink text-canvas flex items-center justify-center font-bold text-sm border border-ink shadow-sharp-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              EC
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-ink text-base uppercase leading-none font-sans">
                Outreach CRM
              </div>
              <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mt-0.5">
                IIT E-Cell Edition
              </div>
            </div>
          </Link>

          {/* Campaign Selector Dropdown */}
          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-border-grid">
            <span className="text-xs font-mono text-ink-muted uppercase">Campaign:</span>
            <select
              value={currentCampaignId}
              onChange={(e) => handleCampaignChange(e.target.value)}
              className="text-xs font-mono font-bold bg-canvas border border-border-grid px-2.5 py-1 text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.year})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium transition-all border ${
                  link.active
                    ? "bg-ink text-canvas border-ink shadow-sharp-sm"
                    : "text-ink hover:bg-surface-muted hover:border-border-grid border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
                {link.badge !== null && link.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-sm ${
                      link.active
                        ? "bg-signal-red text-white"
                        : "bg-signal-red text-white"
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/deals/new?campaign=${currentCampaignId}`}
            className="flex items-center gap-1.5 bg-signal-amber text-ink border border-ink px-3 py-1.5 text-xs font-mono font-bold shadow-sharp-sm hover:bg-amber-400 hover:translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Deal</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign out"
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-canvas border border-transparent hover:border-border-grid transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-border-grid bg-surface-muted px-2 py-1.5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-mono ${
                link.active ? "text-ink font-bold" : "text-ink-muted"
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {link.badge !== null && link.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-signal-red text-white text-[9px] px-1 rounded-full font-bold">
                    {link.badge}
                  </span>
                )}
              </div>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
