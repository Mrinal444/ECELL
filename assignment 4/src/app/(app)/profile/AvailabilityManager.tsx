"use client";

import { useActionState, useTransition } from "react";
import { addAvailabilitySlot, deleteAvailabilitySlot } from "@/lib/actions/profile";
import { Trash2, Plus, Clock } from "lucide-react";

interface Slot {
  id: string;
  weekday: number;
  startMin: number;
  endMin: number;
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? "00" : m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

export default function AvailabilityManager({ slots }: { slots: Slot[] }) {
  const [state, formAction, isPending] = useActionState(addAvailabilitySlot, null);
  const [isDeleting, startTransition] = useTransition();

  const sortedSlots = [...slots].sort((a, b) => {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return a.startMin - b.startMin;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Weekly Availability Rules</h3>
          <p className="text-xs text-[var(--foreground)]/60">
            Bookable 60-minute slots are generated for the next 14 days based on these recurring windows (Asia/Kolkata IST).
          </p>
        </div>
      </div>

      {sortedSlots.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-[var(--foreground)]/15 rounded-xl text-sm text-[var(--foreground)]/60">
          No recurring availability configured. Add your first window below.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {sortedSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-[var(--background)] border border-[var(--foreground)]/10 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{weekdays[slot.weekday]}</p>
                  <p className="text-xs text-[var(--foreground)]/70">
                    {formatMinutes(slot.startMin)} - {formatMinutes(slot.endMin)} IST
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  startTransition(async () => {
                    await deleteAvailabilitySlot(slot.id);
                  });
                }}
                className="text-[var(--foreground)]/40 hover:text-red-500 p-1.5 rounded transition-colors"
                title="Remove slot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Slot Form */}
      <div className="border border-[var(--foreground)]/10 rounded-xl p-5 bg-[var(--foreground)]/[0.02]">
        <h4 className="text-sm font-semibold mb-3">Add Recurring Window</h4>
        {state?.error && (
          <div className="bg-red-500/10 text-red-500 p-2 rounded text-xs mb-3">{state.error}</div>
        )}
        <form action={formAction} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Day</label>
            <select
              name="weekday"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
              <option value="0">Sunday</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Start Time (IST)</label>
            <select
              name="startMin"
              defaultValue="600"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              {Array.from({ length: 24 }).map((_, h) => {
                const min = h * 60;
                return (
                  <option key={min} value={min}>
                    {formatMinutes(min)}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">End Time (IST)</label>
            <select
              name="endMin"
              defaultValue="660"
              required
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              {Array.from({ length: 24 }).map((_, h) => {
                const min = (h + 1) * 60;
                return (
                  <option key={min} value={min}>
                    {formatMinutes(min)}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 bg-[var(--foreground)] text-[var(--background)] py-2 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Window
          </button>
        </form>
      </div>
    </div>
  );
}