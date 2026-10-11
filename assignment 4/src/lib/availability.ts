import { prisma } from "./auth";
import { SessionStatus, MatchStatus } from "@prisma/client";

const SLOT_LENGTH_MIN = 60;
const LOOKAHEAD_DAYS = 14;

// IST offset is fixed +05:30 with no DST.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface BookableSlot {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Generate bookable 60-minute slots for a mentor for the next 14 days.
 *
 * Weekly availability rules are stored as IST minutes-from-midnight. We walk
 * the next 14 calendar days, intersect each rule with the mentor's day, and
 * emit 60-minute slots. Slots already taken by REQUESTED or CONFIRMED sessions
 * are subtracted.
 */
export async function getBookableSlots(mentorId: string): Promise<BookableSlot[]> {
  const now = new Date();
  const slots: BookableSlot[] = [];

  const rules = await prisma.availabilitySlot.findMany({ where: { mentorId } });
  if (rules.length === 0) return slots;

  // IST "now" in minutes from midnight
  const nowIst = new Date(now.getTime() + IST_OFFSET_MS);
  const currentIstMin = nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes();

  const taken = await prisma.session.findMany({
    where: {
      mentorId,
      status: { in: [SessionStatus.REQUESTED, SessionStatus.CONFIRMED] },
    },
  });

  for (let dayOffset = 0; dayOffset < LOOKAHEAD_DAYS; dayOffset++) {
    const dayStartIst = new Date(nowIst);
    dayStartIst.setUTCDate(dayStartIst.getUTCDate() + dayOffset);
    dayStartIst.setUTCHours(0, 0, 0, 0);
    const weekday = dayStartIst.getUTCDay();

    const dayRules = rules.filter(r => r.weekday === weekday);
    if (dayRules.length === 0) continue;

    for (const rule of dayRules) {
      // Skip a rule entirely if it ended before the current time today.
      if (dayOffset === 0 && rule.endMin <= currentIstMin) continue;

      const slotStartIstMin = Math.max(rule.startMin, dayOffset === 0 ? currentIstMin : rule.startMin);
      for (let m = slotStartIstMin; m + SLOT_LENGTH_MIN <= rule.endMin; m += SLOT_LENGTH_MIN) {
        const slotStartIst = new Date(dayStartIst);
        slotStartIst.setUTCMinutes(m, 0, 0);
        const slotEndIst = new Date(slotStartIst.getTime() + SLOT_LENGTH_MIN * 60 * 1000);

        // Convert back to UTC for storage/comparison.
        const slotStart = new Date(slotStartIst.getTime() - IST_OFFSET_MS);
        const slotEnd = new Date(slotEndIst.getTime() - IST_OFFSET_MS);

        if (slotStart <= now) continue;

        const overlaps = taken.some(t => slotStart < new Date(t.endsAt) && slotEnd > new Date(t.startsAt));
        if (overlaps) continue;

        slots.push({
          start: slotStart,
          end: slotEnd,
          label: formatSlotLabel(slotStart),
        });
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function formatSlotLabel(d: Date): string {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const datePart = ist.toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
  const timePart = ist.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC",
  });
  return `${datePart} · ${timePart} IST`;
}