"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  Send,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { DuplicateChecker } from "@/components/deals/DuplicateChecker";
import { createDealAction } from "@/actions/deals";
import { DEAL_STAGES, STAGE_CONFIG, TIERS_CONFIG } from "@/lib/constants";
import { DealStage, SponsorshipTier, DealType } from "@/types";

interface CreateDealFormProps {
  campaigns: { id: string; name: string; year: number }[];
  defaultCampaignId: string;
  currentUserId: string;
}

export function CreateDealForm({
  campaigns,
  defaultCampaignId,
  currentUserId,
}: CreateDealFormProps) {
  const router = useRouter();

  const [campaignId, setCampaignId] = useState(defaultCampaignId);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [type, setType] = useState<"SPONSOR" | "SPEAKER" | "PARTNER">("SPONSOR");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  // Primary Contact
  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Deal Parameters
  const [stage, setStage] = useState<DealStage>("PROSPECT");
  const [tier, setTier] = useState<SponsorshipTier | "">("");
  const [valueINR, setValueINR] = useState<number | "">("");
  const [dealType, setDealType] = useState<DealType>("CASH");

  // Duplicate Check State
  const [hasExactDuplicate, setHasExactDuplicate] = useState(false);
  const [hasFuzzyDuplicate, setHasFuzzyDuplicate] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Company Name is required.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createDealAction({
        campaignId,
        companyName: companyName.trim(),
        domain: domain.trim() || undefined,
        type,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined,
        stage,
        tier: tier ? (tier as SponsorshipTier) : undefined,
        valueINR: typeof valueINR === "number" ? valueINR : undefined,
        dealType,
        contact: {
          name: contactName.trim() || "Main Contact",
          title: contactTitle.trim() || undefined,
          phone: contactPhone.trim() || undefined,
          email: contactEmail.trim() || undefined,
        },
      });

      if (!res.success) {
        setError(res.error || "Failed to create deal.");
      } else if (res.dealId) {
        router.push(`/deals/${res.dealId}`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-mono text-xs">
      {error && (
        <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Campaign Selector */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-2">
        <label className="block font-bold text-ink uppercase text-[11px]">
          Target Campaign*:
        </label>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="w-full bg-canvas border border-border-grid p-2.5 font-mono text-xs font-bold text-ink focus:border-ink"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.year})
            </option>
          ))}
        </select>
      </div>

      {/* Organization Identity & Real-Time Duplicate Checker */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4">
        <div className="border-b border-border-grid pb-2">
          <h3 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>Organization Profile (With Live Duplicate Engine)</span>
          </h3>
          <p className="text-ink-muted text-[11px] mt-0.5">
            Normalized string hashing and website domain checks run automatically as you type.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Company / Brand Name*:
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Tata Consultancy Services, Swiggy, Zerodha..."
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono font-bold focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Website / Canonical Domain:
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. tcs.com, swiggy.in, zerodha.com"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Organization Category:
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono font-semibold"
            >
              <option value="SPONSOR">Corporate Sponsor (Cash / In-Kind)</option>
              <option value="SPEAKER">Keynote Speaker / Panelist Org</option>
              <option value="PARTNER">Media / Community / Ecosystem Partner</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              City / Headquarters:
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru, Mumbai, Delhi NCR, Hyderabad..."
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>
        </div>

        {/* Live Duplicate Warning Widget */}
        <DuplicateChecker
          companyName={companyName}
          domain={domain}
          phone={contactPhone}
          onDuplicateStateChange={(hasExact, dups) => {
            setHasExactDuplicate(hasExact);
            setHasFuzzyDuplicate(dups.length > 0);
          }}
        />
      </div>

      {/* Primary Contact Person */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4">
        <div className="border-b border-border-grid pb-2">
          <h3 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>Primary Contact Person (POC)</span>
          </h3>
          <p className="text-ink-muted text-[11px] mt-0.5">
            Contact phone numbers are validated against existing records for cross-company overlaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Contact Full Name:
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Harshil Mathur"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Designation / Title:
            </label>
            <input
              type="text"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              placeholder="e.g. Head of University Relations, CMO, VP Brand"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Phone / WhatsApp Number:
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +91 9876543210 or 9876543210"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Email Address:
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. harshil@razorpay.com"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* Initial Deal Pipeline Parameters */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4">
        <div className="border-b border-border-grid pb-2">
          <h3 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span>Deal Pipeline Configuration</span>
          </h3>
          <p className="text-ink-muted text-[11px] mt-0.5">
            You will automatically become the exclusive owner of this newly created deal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Initial Pipeline Stage:
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as DealStage)}
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono font-bold focus:border-ink"
            >
              {DEAL_STAGES.filter((s) => s !== "CONFIRMED" && s !== "LOST").map(
                (s) => (
                  <option key={s} value={s}>
                    {STAGE_CONFIG[s]?.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Target Sponsorship Tier:
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as SponsorshipTier)}
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono font-semibold"
            >
              <option value="">-- Flexible / Not Specified Yet --</option>
              {Object.entries(TIERS_CONFIG).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label} (₹{item.minAmount.toLocaleString("en-IN")})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Target Amount in INR (₹):
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              value={valueINR}
              onChange={(e) =>
                setValueINR(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 250000"
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Deal Type:
            </label>
            <select
              value={dealType}
              onChange={(e) => setDealType(e.target.value as DealType)}
              className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono font-semibold"
            >
              <option value="CASH">Cash Sponsorship</option>
              <option value="IN_KIND">In-Kind (Products / Cloud Credits)</option>
              <option value="HYBRID">Hybrid (Cash + In-Kind)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-ink mb-1 uppercase">
            Initial Intelligence / Notes:
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. IIT alumnus founder, interested in student developer workshops, reached out on LinkedIn..."
            className="w-full bg-canvas border border-border-grid p-2.5 text-xs text-ink font-mono focus:border-ink"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || hasExactDuplicate}
          className={`flex items-center gap-2 px-6 py-3 font-bold uppercase tracking-wider text-xs transition-all shadow-sharp ${
            hasExactDuplicate
              ? "bg-stone-300 text-stone-600 cursor-not-allowed border border-stone-400"
              : "bg-ink text-canvas hover:bg-stone-800"
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking &amp; Creating...</span>
            </>
          ) : (
            <>
              <span>Create Deal &amp; Enter Pipeline</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
