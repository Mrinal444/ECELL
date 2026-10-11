"use client";

import { useState } from "react";
import { useActionState } from "react";
import { requestSession } from "@/lib/actions/sessions";
import { BookableSlot } from "@/lib/availability";

interface ActionState {
  error?: string;
  success?: boolean;
}

interface Props {
  matchRequestId: string;
  slots: BookableSlot[];
}

export default function SlotPicker({ matchRequestId, slots }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState | null, FormData>(requestSession, null);
  const [topic, setTopic] = useState("Session");

  if (slots.length === 0) {
    return (
      <div className="px-4 py-2 bg-[var(--foreground)]/5 text-[var(--foreground)]/60 rounded-md text-sm font-medium border border-[var(--foreground)]/10">
        No open slots in the next 14 days
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 bg-[var(--accent)] text-[var(--background)] rounded-md text-sm font-medium transition-opacity hover:opacity-90"
      >
        {open ? "Cancel" : "Book Session"}
      </button>

      {open && (
        <div className="border border-[var(--foreground)]/10 rounded-xl p-4 bg-[var(--background)] space-y-3">
          <input
            name="topic"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Topic"
            className="w-full border p-2 rounded-md bg-transparent text-sm"
          />
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="matchRequestId" value={matchRequestId} />
            {state?.error && <p className="text-red-600 text-xs">{state.error}</p>}
            {state?.success && <p className="text-green-600 text-xs">Session requested!</p>}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
              {slots.map(s => (
                <button
                  key={s.start.toISOString()}
                  type="submit"
                  name="startsAt"
                  value={s.start.toISOString()}
                  className="w-full text-left px-3 py-2 rounded-md text-sm border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/5 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}