import { describe, it, expect } from "vitest";
import { MatchStatus, SessionStatus } from "@prisma/client";

// Simulation of the state machine rules to test transitions purely
function canTransitionSession(
  from: SessionStatus | "NEW",
  to: SessionStatus,
  role: "FOUNDER" | "MENTOR",
  context: { matchStatus: MatchStatus; hasSlotConflict: boolean; isPast: boolean }
): { allowed: boolean; reason?: string } {
  if (from === "NEW") {
    if (to !== SessionStatus.REQUESTED) return { allowed: false, reason: "New sessions must start as REQUESTED" };
    if (role !== "FOUNDER") return { allowed: false, reason: "Only founders can request sessions" };
    if (context.matchStatus !== MatchStatus.ACCEPTED) return { allowed: false, reason: "Match must be ACCEPTED" };
    if (context.hasSlotConflict) return { allowed: false, reason: "Slot already taken" };
    return { allowed: true };
  }

  if (from === SessionStatus.REQUESTED) {
    if (to === SessionStatus.CONFIRMED) {
      if (role !== "MENTOR") return { allowed: false, reason: "Only mentors can confirm sessions" };
      if (context.hasSlotConflict) return { allowed: false, reason: "Slot conflict" };
      return { allowed: true };
    }
    if (to === SessionStatus.CANCELLED) {
      return { allowed: true }; // either can cancel
    }
    return { allowed: false, reason: "Invalid transition from REQUESTED" };
  }

  if (from === SessionStatus.CONFIRMED) {
    if (to === SessionStatus.COMPLETED) {
      if (!context.isPast) return { allowed: false, reason: "Session hasn't happened yet" };
      return { allowed: true };
    }
    if (to === SessionStatus.CANCELLED) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Invalid transition from CONFIRMED" };
  }

  return { allowed: false, reason: "Terminal state" };
}

function canReRequestMatch(
  status: MatchStatus,
  respondedAt: Date | null,
  cooldownDays = 14
): { allowed: boolean; reason?: string } {
  if (status === MatchStatus.PENDING || status === MatchStatus.ACCEPTED) {
    return { allowed: false, reason: "Request already active" };
  }
  if (status === MatchStatus.DECLINED) {
    if (!respondedAt) return { allowed: false, reason: "Invalid state" };
    const daysSince = (Date.now() - respondedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < cooldownDays) {
      return { allowed: false, reason: "Cooldown active" };
    }
    return { allowed: true };
  }
  return { allowed: true };
}

describe("State Machine & Access Rules", () => {
  it("rejects booking without an accepted match", () => {
    const res = canTransitionSession("NEW", SessionStatus.REQUESTED, "FOUNDER", {
      matchStatus: MatchStatus.PENDING,
      hasSlotConflict: false,
      isPast: false,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Match must be ACCEPTED");
  });

  it("rejects booking by mentor", () => {
    const res = canTransitionSession("NEW", SessionStatus.REQUESTED, "MENTOR", {
      matchStatus: MatchStatus.ACCEPTED,
      hasSlotConflict: false,
      isPast: false,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Only founders can request sessions");
  });

  it("rejects double-booking / slot conflict", () => {
    const res = canTransitionSession("NEW", SessionStatus.REQUESTED, "FOUNDER", {
      matchStatus: MatchStatus.ACCEPTED,
      hasSlotConflict: true,
      isPast: false,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Slot already taken");
  });

  it("rejects marking completed before the session time passes", () => {
    const res = canTransitionSession(SessionStatus.CONFIRMED, SessionStatus.COMPLETED, "FOUNDER", {
      matchStatus: MatchStatus.ACCEPTED,
      hasSlotConflict: false,
      isPast: false,
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Session hasn't happened yet");
  });

  it("allows completing after session time passes", () => {
    const res = canTransitionSession(SessionStatus.CONFIRMED, SessionStatus.COMPLETED, "FOUNDER", {
      matchStatus: MatchStatus.ACCEPTED,
      hasSlotConflict: false,
      isPast: true,
    });
    expect(res.allowed).toBe(true);
  });

  it("rejects re-request inside 14-day cooldown", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const res = canReRequestMatch(MatchStatus.DECLINED, fiveDaysAgo);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("Cooldown active");
  });

  it("allows re-request after 14-day cooldown passes", () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const res = canReRequestMatch(MatchStatus.DECLINED, fifteenDaysAgo);
    expect(res.allowed).toBe(true);
  });
});
