"use client";

import { useActionState } from "react";
import { updateMentorProfile } from "@/lib/actions/profile";
import { Domain, Stage, Skill } from "@prisma/client";

const domainsList: Domain[] = ["FinTech", "HealthTech", "EdTech", "AI", "Climate", "Consumer", "SaaS"];
const stagesList: Stage[] = ["Idea", "PreSeed", "Seed", "Growth"];
const skillsList: Skill[] = ["Fundraising", "GoToMarket", "Product", "Hiring", "TechArchitecture", "Pricing", "Sales", "Branding", "Legal", "Operations"];

interface Props {
  initial: {
    headline: string;
    bio: string;
    expertiseNote: string | null;
    domains: Domain[];
    stages: Stage[];
    skills: Skill[];
  };
}

export default function MentorProfileForm({ initial }: Props) {
  const [state, formAction, isPending] = useActionState(updateMentorProfile, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="bg-green-500/10 text-green-600 p-3 rounded-md text-sm">Profile updated successfully!</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Headline</label>
        <input
          name="headline"
          defaultValue={initial.headline}
          required
          placeholder="e.g. Ex-VP Product at EdTech Unicorn, Angel Investor"
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          name="bio"
          defaultValue={initial.bio}
          rows={3}
          required
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Expertise Note</label>
        <textarea
          name="expertiseNote"
          defaultValue={initial.expertiseNote || ""}
          rows={2}
          placeholder="Playbooks, frameworks, and specific areas where you can provide high leverage"
          className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-transparent focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Domains You Support</label>
          <p className="text-xs text-[var(--foreground)]/60 mb-2">Ctrl/Cmd+Click for multiple</p>
          <select
            name="domains"
            multiple
            defaultValue={initial.domains}
            required
            className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-[var(--background)] h-32 focus:outline-none focus:border-[var(--accent)]"
          >
            {domainsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stages You Support</label>
          <p className="text-xs text-[var(--foreground)]/60 mb-2">Ctrl/Cmd+Click for multiple</p>
          <select
            name="stages"
            multiple
            defaultValue={initial.stages}
            required
            className="w-full border border-[var(--foreground)]/20 p-2.5 rounded-md bg-[var(--background)] h-32 focus:outline-none focus:border-[var(--accent)]"
          >
            {stagesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Your Skills & Expertise</label>
        <p className="text-xs text-[var(--foreground)]/60 mb-2">Ctrl/Cmd+Click for multiple</p>
        <select
          name="skills"
          multiple
          defaultValue={initial.skills}
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