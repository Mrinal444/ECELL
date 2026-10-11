"use client";

import React, { useState } from "react";
import { UserCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { reassignDealAction } from "@/actions/deals";

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  companyName: string;
  currentOwnerName?: string | null;
  currentOwnerId?: string | null;
  teamMembers: { id: string; name: string; email: string; role: string; active: boolean }[];
  onSuccess?: () => void;
}

export function ReassignModal({
  isOpen,
  onClose,
  dealId,
  companyName,
  currentOwnerName,
  currentOwnerId,
  teamMembers,
  onSuccess,
}: ReassignModalProps) {
  const [targetUserId, setTargetUserId] = useState<string>(currentOwnerId || "");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await reassignDealAction(
        dealId,
        targetUserId ? targetUserId : null,
        reason.trim() || undefined
      );

      if (!res.success) {
        setError(res.error || "Failed to reassign deal.");
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

  const activeMembers = teamMembers.filter((m) => m.active);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Deal Owner"
      subtitle={`Company: ${companyName} · Current Owner: ${currentOwnerName || "Unassigned"}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-ink font-bold mb-1.5 uppercase">
            Select New Deal Owner:
          </label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full bg-surface border border-border-grid p-2 text-ink font-bold focus:outline-none focus:border-ink"
          >
            <option value="">-- Unassign (Move to Open Queue) --</option>
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role}) {member.id === currentOwnerId ? "— Current" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-ink font-bold mb-1.5 uppercase">
            Reassignment Reason / Note:
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Workload balancing, member leaving campus, POC shift..."
            className="w-full bg-surface border border-border-grid p-2 text-ink font-mono focus:outline-none focus:border-ink"
          />
        </div>

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
                <span>Reassigning...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Save Assignment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
