"use client";

import React, { useState } from "react";
import { ArrowRight, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { updateDealStageAction } from "@/actions/deals";
import {
  STAGE_CONFIG,
  TIERS_CONFIG,
  LOST_REASONS_CONFIG,
  DEAL_STAGES,
  DEFAULT_FOLLOW_UP_DAYS,
} from "@/lib/constants";
import { DealStage, LostReason, SponsorshipTier, PaymentStatus, DealType } from "@/types";

interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  companyName: string;
  currentStage: DealStage;
  currentTier?: SponsorshipTier | null;
  currentValueINR?: number | null;
  currentDealType?: DealType | null;
  currentPaymentStatus?: PaymentStatus | null;
  onSuccess?: () => void;
}

export function StageChangeModal({
  isOpen,
  onClose,
  dealId,
  companyName,
  currentStage,
  currentTier,
  currentValueINR,
  currentDealType,
  currentPaymentStatus,
  onSuccess,
}: StageChangeModalProps) {
  const [targetStage, setTargetStage] = useState<DealStage>(currentStage);
  const [lostReason, setLostReason] = useState<LostReason>("NO_RESPONSE");
  const [tier, setTier] = useState<SponsorshipTier>(currentTier || "SILVER");
  const [valueINR, setValueINR] = useState<number | "">(currentValueINR || 50000);
  const [dealType, setDealType] = useState<DealType>(currentDealType || "CASH");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    currentPaymentStatus || "PLEDGED"
  );
  const [followUpDays, setFollowUpDays] = useState<number>(DEFAULT_FOLLOW_UP_DAYS);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let nextFollowUpAt: string | null = null;
      if (targetStage !== "CONFIRMED" && targetStage !== "LOST") {
        nextFollowUpAt = new Date(
          Date.now() + followUpDays * 24 * 60 * 60 * 1000
        ).toISOString();
      }

      const res = await updateDealStageAction(dealId, targetStage, {
        lostReason: targetStage === "LOST" ? lostReason : undefined,
        tier: targetStage === "CONFIRMED" ? tier : undefined,
        valueINR:
          targetStage === "CONFIRMED"
            ? typeof valueINR === "number"
              ? valueINR
              : 0
            : undefined,
        dealType: targetStage === "CONFIRMED" ? dealType : undefined,
        paymentStatus: targetStage === "CONFIRMED" ? paymentStatus : undefined,
        nextFollowUpAt,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to update stage.");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Advance Pipeline Stage"
      subtitle={`Deal: ${companyName} · Current: ${STAGE_CONFIG[currentStage]?.label}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stage Selection */}
        <div>
          <label className="block text-ink font-bold mb-2 uppercase">
            Select Target Stage:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEAL_STAGES.map((stg) => {
              const cfg = STAGE_CONFIG[stg];
              const isCurrent = currentStage === stg;
              const isSelected = targetStage === stg;

              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setTargetStage(stg)}
                  className={`p-2.5 text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-ink text-canvas border-ink shadow-sharp-sm"
                      : "bg-surface text-ink hover:bg-surface-muted border-border-grid"
                  }`}
                >
                  <div>
                    <div className="font-bold">{cfg.label}</div>
                    {isCurrent && (
                      <span className="text-[10px] text-signal-amber font-semibold uppercase">
                        (Current Stage)
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-canvas" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONDITIONAL: LOST STAGE REQUIREMENTS */}
        {targetStage === "LOST" && (
          <div className="p-3 bg-stone-100 border-2 border-stone-400 space-y-3">
            <div className="font-bold text-stone-900 uppercase">
              Mandatory Lost Reason:
            </div>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value as LostReason)}
              className="w-full bg-white border border-border-grid p-2 text-ink font-bold"
            >
              {Object.entries(LOST_REASONS_CONFIG).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CONDITIONAL: CONFIRMED STAGE REQUIREMENTS */}
        {targetStage === "CONFIRMED" && (
          <div className="p-3 bg-green-50 border-2 border-green-600 space-y-3">
            <div className="font-bold text-green-950 uppercase">
              Mandatory Sponsorship Deal Terms:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-ink">
                  Sponsorship Tier:
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as SponsorshipTier)}
                  className="w-full bg-white border border-border-grid p-2 text-ink font-bold"
                >
                  {Object.entries(TIERS_CONFIG).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label} (₹{item.minAmount.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">
                  Value in INR (₹):
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={valueINR}
                  onChange={(e) =>
                    setValueINR(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full bg-white border border-border-grid p-2 text-ink font-bold"
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">
                  Deal Type:
                </label>
                <select
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value as DealType)}
                  className="w-full bg-white border border-border-grid p-2 text-ink font-bold"
                >
                  <option value="CASH">Cash Sponsorship</option>
                  <option value="IN_KIND">In-Kind (Goods/Services)</option>
                  <option value="HYBRID">Hybrid (Cash + In-Kind)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-ink">
                  Payment / Delivery Status:
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full bg-white border border-border-grid p-2 text-ink font-bold"
                >
                  <option value="PLEDGED">Pledged / Letter of Intent</option>
                  <option value="INVOICED">Invoiced / MOA Signed</option>
                  <option value="RECEIVED">Received in Bank</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Next Follow-Up (Only for active stages) */}
        {targetStage !== "CONFIRMED" && targetStage !== "LOST" && (
          <div>
            <label className="block text-ink font-bold mb-1 uppercase">
              Schedule Next Follow-Up Date:
            </label>
            <div className="flex items-center gap-2">
              <select
                value={followUpDays}
                onChange={(e) => setFollowUpDays(Number(e.target.value))}
                className="w-full bg-surface border border-border-grid p-2 text-ink font-bold"
              >
                <option value={1}>+1 day (Tomorrow / Urgent)</option>
                <option value={2}>+2 days</option>
                <option value={3}>+3 days (Standard Outreach Cadence)</option>
                <option value={5}>+5 days</option>
                <option value={7}>+7 days (1 Week)</option>
                <option value={10}>+10 days</option>
              </select>
            </div>
          </div>
        )}

        {/* Transition Note */}
        <div>
          <label className="block text-ink font-bold mb-1 uppercase">
            Stage Change Note (Recorded in Audit Log):
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Discussed with marketing VP, sent revised proposal..."
            className="w-full bg-surface border border-border-grid p-2 text-ink font-mono"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-grid">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-ink-muted hover:text-ink font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 bg-ink text-canvas px-5 py-2 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Update Stage</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
