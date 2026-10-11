"use client";

import { useActionState } from "react";
import { updateFounderProfile } from "@/lib/actions/profile";
import { Domain, Stage, Skill } from "@prisma/client";

const domainsList: Domain[] = ["FinTech", "HealthTech", "EdTech", "AI", "Climate", "Consumer", "SaaS"];
const stagesList: Stage[] = ["Idea", "PreSeed", "Seed", "Growth"];
const skillsList: Skill[] = ["Fundraising", "GoToMarket", "Product", "Hiring", "TechArchitecture", "Pricing", "Sales", "Branding", "Legal", "Operations"];

interface Props {
  initial: {
    startupName: string;
    pitch: string;
    domain: Domain;
    stage: Stage;
    needsNote: string | null;
    needs: Skill[];
  };
}

export default function FounderProfileForm({ initial }: Props) {
  const [state, formAction, isPending] = useActionState(updateFounderProfile, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">Profile updated successfully!</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Startup Name</label>
        <input
          name="startupName"
          defaultValue={initial.startupName}
          required
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">One-line Pitch</label>
        <input
          name="pitch"
          defaultValue={initial.pitch}
          required
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <select
            name="domain"
            defaultValue={initial.domain}
            required
            className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-[var(--background)] focus:outline-none focus:border-[var(--accent)]"
          >
            {domainsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stage</label>
          <select
            name="stage"
            defaultValue={initial.stage}
            required
            className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-[var(--background)] focus:outline-none focus:border-[var(--accent)]"
          >
            {stagesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Needs Note (Context for mentors)</label>
        <textarea
          name="needsNote"
          defaultValue={initial.needsNote || ""}
          rows={3}
          placeholder="What specific challenges are you looking to tackle with mentorship?"
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Areas of Need (Select all that apply)</label>
        <p className="text-xs text-[var(--foreground)]/60 mb-2">Hold Ctrl/Cmd to select multiple</p>
        <select
          name="needs"
          multiple
          defaultValue={initial.needs}
          required
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-[var(--background)] h-36 focus:outline-none focus:border-[var(--accent)]"
        >
          {skillsList.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}