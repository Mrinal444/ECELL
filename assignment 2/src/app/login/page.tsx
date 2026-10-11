"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await loginAction(null, formData);
      if (res && !res.success) {
        setError(res.error || "Failed to login. Check credentials.");
      }
    } catch (err: any) {
      if (err.message && !err.message.includes("NEXT_REDIRECT")) {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-surface border-2 border-border-grid p-6 sm:p-8 shadow-sharp space-y-6">
        {/* Header */}
        <div className="space-y-1.5 border-b border-border-grid pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ink text-canvas flex items-center justify-center font-bold text-sm">
              E
            </div>
            <h1 className="text-base font-extrabold tracking-wider uppercase text-ink">
              E-Cell Outreach CRM
            </h1>
          </div>
          <p className="text-xs text-ink-muted">
            Sign in to access sponsorship pipeline and outreach logs.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-signal-red text-signal-red text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Email Address:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aditi.lead@ecell.org"
                className="w-full bg-canvas border border-border-grid p-2.5 pl-8 text-ink font-mono focus:outline-none focus:border-ink"
              />
              <Mail className="w-4 h-4 text-ink-muted absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1 uppercase">
              Password:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-canvas border border-border-grid p-2.5 pl-8 text-ink font-mono focus:outline-none focus:border-ink"
              />
              <Lock className="w-4 h-4 text-ink-muted absolute left-2.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-canvas py-3 font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to CRM"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins for Fast Verification */}
        <div className="pt-4 border-t border-border-grid space-y-2.5 text-[11px]">
          <div className="font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-ink" />
            <span>Developer Seed Accounts:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("aditi@ecell.org")}
              className="p-2 bg-canvas border border-border-grid hover:border-ink text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-ink">Aditi (Lead)</div>
              <div className="text-[10px] text-signal-amber font-semibold">aditi@ecell.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("rahul@ecell.org")}
              className="p-2 bg-canvas border border-border-grid hover:border-ink text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-ink">Rahul (Member)</div>
              <div className="text-[10px] text-ink-muted font-semibold">rahul@ecell.org</div>
            </button>
          </div>
          <div className="text-[10px] text-ink-muted text-center pt-1">
            Default seed password: <code className="font-bold text-ink bg-surface-muted px-1.5 py-0.5 border border-border-grid">password123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
