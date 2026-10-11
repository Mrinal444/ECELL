"use client";

import { useActionState } from "react";
import { completeFounderOnboarding } from "@/lib/actions/onboarding";

interface Props {
  domainsList: string[];
  stagesList: string[];
  skillsList: string[];
}

export default function FounderForm({ domainsList, stagesList, skillsList }: Props) {
  const [state, formAction] = useActionState<{ error?: string } | null, FormData>(completeFounderOnboarding, null);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block font-medium mb-1">Startup Name</label>
        <input name="startupName" required className="w-full border p-2 rounded-md bg-transparent" />
      </div>
      <div>
        <label className="block font-medium mb-1">One-line Pitch</label>
        <input name="pitch" required className="w-full border p-2 rounded-md bg-transparent" />
      </div>
      <div>
        <label className="block font-medium mb-1">Domain</label>
        <select name="domain" required className="w-full border p-2 rounded-md bg-transparent">
          {domainsList.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Stage</label>
        <select name="stage" required className="w-full border p-2 rounded-md bg-transparent">
          {stagesList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Needs (select multiple)</label>
        <select name="needs" required multiple className="w-full border p-2 rounded-md bg-transparent h-32">
          {skillsList.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button type="submit" className="bg-[var(--foreground)] text-[var(--background)] px-6 py-2 rounded-md font-medium">Save & Continue</button>
    </form>
  );
}