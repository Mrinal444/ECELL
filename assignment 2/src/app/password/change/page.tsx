"use client";

import React, { useState } from "react";
import { Lock, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";
import { changePasswordAction } from "@/actions/auth";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePasswordAction(null, formData);
      if (res && !res.success) {
        setError(res.error || "Failed to update password.");
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("NEXT_REDIRECT")) {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-surface border-2 border-border-grid p-6 sm:p-8 shadow-sharp space-y-6">
        <div className="space-y-1.5 border-b border-border-grid pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-signal-amber" />
            <h1 className="text-base font-extrabold tracking-wider uppercase text-ink">
              Update Password
            </h1>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            For security compliance, please set a strong personal password before proceeding to the CRM.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Current / Temporary Password:
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-canvas border border-border-grid p-2.5 text-ink font-mono focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              New Password (min. 6 chars):
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-canvas border border-border-grid p-2.5 text-ink font-mono focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Confirm New Password:
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-canvas border border-border-grid p-2.5 text-ink font-mono focus:outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-canvas py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
          >
            <span>{loading ? "Updating Password..." : "Save & Enter CRM"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
