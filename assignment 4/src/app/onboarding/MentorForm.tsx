"use client";

import { useActionState } from "react";
import { completeMentorOnboarding } from "@/lib/actions/onboarding";

interface Props {
  domainsList: string[];
  stagesList: string[];
  skillsList: string[];
}

export default function MentorForm({ domainsList, stagesList, skillsList }: Props) {
  const [state, formAction] = useActionState<{ error?: string } | null, FormData>(completeMentorOnboarding, null);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block font-medium mb-1">Headline</label>
        <input name="headline" required placeholder="e.g. CTO at FinTech Unicorn" className="w-full border p-2 rounded-md bg-transparent" />
      </div>
      <div>
        <label className="block font-medium mb-1">Bio</label>
        <textarea name="bio" required className="w-full border p-2 rounded-md bg-transparent" rows={3}></textarea>
      </div>
      <div>
        <label className="block font-medium mb-1">Domains you support</label>
        <select name="domains" required multiple className="w-full border p-2 rounded-md bg-transparent h-24">
          {domainsList.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Stages you support</label>
        <select name="stages" required multiple className="w-full border p-2 rounded-md bg-transparent h-20">
          {stagesList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Your Skills</label>
        <select name="skills" required multiple className="w-full border p-2 rounded-md bg-transparent h-32">
          {skillsList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button type="submit" className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2 rounded-md font-medium">Save & Continue</button>
    </form>
  );
}