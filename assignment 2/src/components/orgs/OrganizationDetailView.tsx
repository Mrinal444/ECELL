"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ExternalLink,
  Calendar,
  Layers,
  ArrowRight,
  GitMerge,
  AlertCircle,
  Phone,
  Mail,
  User,
  Plus,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { StageBadge, TierBadge, RoleBadge } from "@/components/ui/Badge";
import { mergeOrganizationsAction, addContactAction } from "@/actions/organizations";
import { DealStage, SponsorshipTier, SessionUser } from "@/types";

interface OrgDetailProps {
  organization: {
    id: string;
    name: string;
    normalizedName: string;
    domain?: string | null;
    type: string;
    city?: string | null;
    notes?: string | null;
    createdAt: string;
    contacts: {
      id: string;
      name: string;
      title?: string | null;
      phone?: string | null;
      email?: string | null;
      createdAt: string;
    }[];
    deals: {
      id: string;
      stage: string;
      tier?: string | null;
      valueINR?: number | null;
      dealType?: string | null;
      paymentStatus?: string | null;
      createdAt: string;
      lastActivityAt: string;
      campaign: {
        id: string;
        name: string;
        year: number;
      };
      owner?: {
        id: string;
        name: string;
        email: string;
      } | null;
    }[];
  };
  currentUser: SessionUser;
  allOrganizations: {
    id: string;
    name: string;
    domain?: string | null;
    normalizedName: string;
  }[];
}

export function OrganizationDetailView({
  organization,
  currentUser,
  allOrganizations,
}: OrgDetailProps) {
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [secondaryOrgId, setSecondaryOrgId] = useState("");
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  // Add Contact State
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", title: "", phone: "", email: "" });
  const [addingContact, setAddingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const isLead = currentUser.role === "LEAD";
  const otherOrgs = allOrganizations.filter((o) => o.id !== organization.id);

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondaryOrgId) {
      setMergeError("Please select an organization to merge into this primary record.");
      return;
    }

    if (!confirm(
      `CONFIRM ORG MERGE:\nAll deals, contacts, and activity logs from the selected organization will be permanently reparented to "${organization.name}". This action cannot be undone.\n\nProceed?`
    )) {
      return;
    }

    setMerging(true);
    setMergeError(null);

    try {
      const res = await mergeOrganizationsAction(organization.id, secondaryOrgId);
      if (!res.success) {
        setMergeError(res.error || "Merge failed.");
      } else {
        setIsMergeModalOpen(false);
        window.location.reload();
      }
    } catch (err: any) {
      setMergeError(err.message || "An unexpected error occurred during merge.");
    } finally {
      setMerging(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim()) return;

    setAddingContact(true);
    setContactError(null);

    try {
      const res = await addContactAction(organization.id, {
        name: newContact.name.trim(),
        title: newContact.title.trim() || undefined,
        phone: newContact.phone.trim() || undefined,
        email: newContact.email.trim() || undefined,
      });

      if (!res.success) {
        setContactError(res.error || "Failed to add contact.");
      } else {
        setIsAddContactOpen(false);
        setNewContact({ name: "", title: "", phone: "", email: "" });
        window.location.reload();
      }
    } catch (err: any) {
      setContactError(err.message || "An error occurred.");
    } finally {
      setAddingContact(false);
    }
  };

  const totalLifetimeValue = organization.deals.reduce(
    (acc, d) => acc + (d.valueINR || 0),
    0
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Card */}
      <div className="bg-surface border-2 border-border-grid p-6 shadow-sharp space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-canvas border border-border-grid text-ink uppercase">
                {organization.type}
              </span>
              <span className="text-[10px] text-ink-muted">
                Created on {new Date(organization.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>

            <h1 className="text-xl font-black text-ink tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-ink" />
              <span>{organization.name}</span>
              {organization.domain && (
                <a
                  href={`https://${organization.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-0.5 font-normal"
                >
                  <span>({organization.domain})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </h1>

            <div className="text-ink-muted text-[11px] space-y-0.5">
              <div>
                Normalized Hash:{" "}
                <code className="bg-canvas px-1.5 py-0.5 text-[10px] border border-border-grid text-ink">
                  {organization.normalizedName}
                </code>
              </div>
              {organization.city && <div>Headquarters: {organization.city}</div>}
              {organization.notes && (
                <div className="text-stone-700 italic pt-1">
                  &ldquo;{organization.notes}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Action & Stats Strip */}
          <div className="flex flex-col sm:items-end gap-2">
            <div className="p-3 bg-canvas border border-border-grid text-right space-y-0.5">
              <div className="text-[10px] text-ink-muted uppercase font-bold">
                Lifetime Deal Value
              </div>
              <div className="text-base font-extrabold text-ink">
                ₹{totalLifetimeValue > 0 ? (totalLifetimeValue / 100000).toFixed(1) + "L" : "0"}
              </div>
              <div className="text-[10px] text-ink-muted">
                {organization.deals.length} Campaign Portfolio Deal(s)
              </div>
            </div>

            {/* Lead Merge Tool Button */}
            {isLead && (
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(true)}
                className="flex items-center gap-1.5 bg-canvas border border-border-grid text-ink px-3 py-1.5 font-bold hover:bg-surface-muted transition-colors shadow-sharp-sm"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Merge Duplicate Org (Lead Tool)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cross-Campaign Deals History Table */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <h2 className="text-sm font-bold text-ink uppercase flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Cross-Campaign Deals History ({organization.deals.length})</span>
          </h2>
          <span className="text-ink-muted text-[11px]">
            Comprehensive multi-year outreach history &amp; relationships
          </span>
        </div>

        {organization.deals.length === 0 ? (
          <div className="p-6 text-center text-ink-muted">
            No outreach deals recorded for this organization yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ink text-canvas uppercase text-[10px]">
                <th className="p-2.5 border border-ink">Campaign / Year</th>
                <th className="p-2.5 border border-ink">Stage &amp; Tier</th>
                <th className="p-2.5 border border-ink">Amount (₹)</th>
                <th className="p-2.5 border border-ink">Deal Owner</th>
                <th className="p-2.5 border border-ink">Last Touch</th>
                <th className="p-2.5 border border-ink text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-grid">
              {organization.deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-canvas transition-colors">
                  <td className="p-2.5 border-r border-border-grid font-bold text-ink">
                    <div>{deal.campaign.name}</div>
                    <div className="text-[10px] text-ink-muted">{deal.campaign.year} Edition</div>
                  </td>

                  <td className="p-2.5 border-r border-border-grid space-y-1">
                    <StageBadge stage={deal.stage as DealStage} />
                    {deal.tier && <TierBadge tier={deal.tier as SponsorshipTier} />}
                  </td>

                  <td className="p-2.5 border-r border-border-grid font-bold text-ink">
                    {deal.valueINR ? `₹${deal.valueINR.toLocaleString("en-IN")}` : "—"}
                  </td>

                  <td className="p-2.5 border-r border-border-grid">
                    {deal.owner ? (
                      <span className="font-semibold text-ink">{deal.owner.name}</span>
                    ) : (
                      <span className="text-signal-amber font-bold">Unassigned</span>
                    )}
                  </td>

                  <td className="p-2.5 border-r border-border-grid text-ink-muted text-[11px]">
                    {new Date(deal.lastActivityAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  <td className="p-2.5 text-right">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="inline-flex items-center gap-1 bg-ink text-canvas px-2.5 py-1 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
                    >
                      <span>Open Deal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contacts Directory Section */}
      <div className="bg-surface border-2 border-border-grid shadow-sharp p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <h2 className="text-sm font-bold text-ink uppercase flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Organization Contacts ({organization.contacts.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setIsAddContactOpen(!isAddContactOpen)}
            className="flex items-center gap-1 bg-canvas border border-border-grid px-3 py-1 font-bold hover:bg-surface-muted transition-colors shadow-sharp-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddContactOpen ? "Cancel" : "Add Contact"}</span>
          </button>
        </div>

        {contactError && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{contactError}</span>
          </div>
        )}

        {/* Add Contact Form */}
        {isAddContactOpen && (
          <form
            onSubmit={handleAddContact}
            className="p-4 bg-canvas border border-border-grid space-y-3"
          >
            <div className="font-bold text-ink uppercase text-[11px]">
              Add New Organizational POC:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name*"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="bg-white border border-border-grid p-2 text-xs font-mono"
              />
              <input
                type="text"
                placeholder="Title (e.g. Head of Sponsorship)"
                value={newContact.title}
                onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                className="bg-white border border-border-grid p-2 text-xs font-mono"
              />
              <input
                type="tel"
                placeholder="Phone / WhatsApp"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="bg-white border border-border-grid p-2 text-xs font-mono"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="bg-white border border-border-grid p-2 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={addingContact}
              className="bg-ink text-canvas px-4 py-2 font-bold hover:bg-stone-800 shadow-sharp-sm"
            >
              {addingContact ? "Saving..." : "Save Contact"}
            </button>
          </form>
        )}

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {organization.contacts.length === 0 ? (
            <div className="col-span-full p-4 text-center text-ink-muted">
              No contacts recorded for this organization.
            </div>
          ) : (
            organization.contacts.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-canvas border border-border-grid space-y-2 shadow-sharp-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-ink text-sm">{c.name}</div>
                  {c.title && (
                    <span className="text-[10px] text-ink-muted">{c.title}</span>
                  )}
                </div>

                <div className="space-y-1 text-ink-muted text-[11px]">
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-ink" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-ink" />
                      <a href={`mailto:${c.email}`} className="hover:underline text-ink">
                        {c.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LEAD MERGE MODAL */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-surface border-2 border-border-grid w-full max-w-xl p-6 shadow-sharp space-y-4">
            <div className="flex items-center justify-between border-b border-border-grid pb-2">
              <h3 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-signal-amber" />
                <span>Organization Merge Tool (Lead Only)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(false)}
                className="text-ink-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-signal-amber text-amber-900 text-xs space-y-1">
              <div className="font-bold">Merging into Primary Record:</div>
              <div>
                <strong>Primary (Target):</strong> {organization.name} ({organization.domain || "No domain"})
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Select the duplicate organization below. All deals, contacts, and activity logs from that organization will be moved into this record, and the duplicate organization will be deleted.
              </p>
            </div>

            {mergeError && (
              <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mergeError}</span>
              </div>
            )}

            <form onSubmit={handleMerge} className="space-y-4">
              <div>
                <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                  Select Duplicate Organization to Absorb:
                </label>
                <select
                  value={secondaryOrgId}
                  onChange={(e) => setSecondaryOrgId(e.target.value)}
                  required
                  className="w-full bg-canvas border border-border-grid p-2.5 text-xs font-mono font-semibold"
                >
                  <option value="">-- Choose duplicate organization --</option>
                  {otherOrgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} {o.domain ? `(${o.domain})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-grid">
                <button
                  type="button"
                  onClick={() => setIsMergeModalOpen(false)}
                  className="px-4 py-2 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={merging || !secondaryOrgId}
                  className="bg-signal-amber text-ink font-bold px-4 py-2 border border-ink hover:bg-amber-400 shadow-sharp-sm flex items-center gap-1.5"
                >
                  {merging ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Merging Records...</span>
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Execute Lead Merge</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
