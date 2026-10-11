"use server";

import { prisma, requireUser } from "../auth";
import { Role, MatchStatus, SessionStatus } from "@prisma/client";
import { getBookableSlots } from "../availability";

export async function requestSession(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.FOUNDER || !user.founder) {
    return { error: "Only founders can request sessions" };
  }

  const matchRequestId = formData.get("matchRequestId") as string;
  const startsAtStr = formData.get("startsAt") as string;
  const topic = (formData.get("topic") as string) || "Session";

  const match = await prisma.matchRequest.findUnique({
    where: { id: matchRequestId },
  });
  if (!match || match.founderId !== user.founder.id) {
    return { error: "Match not found" };
  }
  if (match.status !== MatchStatus.ACCEPTED) {
    return { error: "Match must be ACCEPTED before booking a session" };
  }

  const startsAt = new Date(startsAtStr);
  if (isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    return { error: "Invalid session time" };
  }
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  // Re-run the overlap check at confirm time.
  const conflict = await prisma.session.findFirst({
    where: {
      matchRequestId: match.id,
      status: { in: [SessionStatus.REQUESTED, SessionStatus.CONFIRMED] },
      AND: [
        { startsAt: { lt: endsAt } },
        { endsAt: { gt: startsAt } },
      ],
    },
  });
  if (conflict) {
    return { error: "Slot already taken. Please pick another." };
  }

  await prisma.session.create({
    data: {
      matchRequestId: match.id,
      founderId: user.founder.id,
      mentorId: match.mentorId,
      startsAt,
      endsAt,
      status: SessionStatus.REQUESTED,
      topic,
    },
  });

  return { success: true };
}

export async function confirmSession(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can confirm sessions" };
  }

  const sessionId = formData.get("sessionId") as string;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.mentorId !== user.mentor.id) {
    return { error: "Session not found" };
  }
  if (session.status !== SessionStatus.REQUESTED) {
    return { error: "Session is not in REQUESTED state" };
  }

  const conflict = await prisma.session.findFirst({
    where: {
      id: { not: session.id },
      mentorId: user.mentor.id,
      status: { in: [SessionStatus.REQUESTED, SessionStatus.CONFIRMED] },
      AND: [
        { startsAt: { lt: session.endsAt } },
        { endsAt: { gt: session.startsAt } },
      ],
    },
  });
  if (conflict) {
    return { error: "Slot conflict with another session" };
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { status: SessionStatus.CONFIRMED },
  });

  return { success: true };
}

export async function cancelSession(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  const sessionId = formData.get("sessionId") as string;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return { error: "Session not found" };
  if (session.founderId !== user.id && session.mentorId !== (user.mentor?.id || user.founder?.id)) {
    return { error: "Not allowed" };
  }
  if (session.status === SessionStatus.COMPLETED) {
    return { error: "Cannot cancel a completed session" };
  }

  const cancelledBy = user.role === Role.FOUNDER ? "founder" : "mentor";

  await prisma.session.update({
    where: { id: session.id },
    data: { status: SessionStatus.CANCELLED, cancelledBy },
  });

  return { success: true };
}

export async function completeSession(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  const sessionId = formData.get("sessionId") as string;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return { error: "Session not found" };
  if (session.founderId !== user.id && session.mentorId !== (user.mentor?.id || user.founder?.id)) {
    return { error: "Not allowed" };
  }
  if (session.status !== SessionStatus.CONFIRMED) {
    return { error: "Session must be CONFIRMED before completing" };
  }
  if (new Date() < new Date(session.startsAt)) {
    return { error: "Session hasn't happened yet" };
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { status: SessionStatus.COMPLETED },
  });

  return { success: true };
}

export async function addFounderNotes(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.FOUNDER || !user.founder) {
    return { error: "Only founders can add notes" };
  }

  const sessionId = formData.get("sessionId") as string;
  const notes = (formData.get("notes") as string) || "";

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.founderId !== user.founder.id) {
    return { error: "Session not found" };
  }
  if (session.status !== SessionStatus.COMPLETED) {
    return { error: "Notes can only be added to completed sessions" };
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { founderNotes: notes },
  });

  return { success: true };
}

export async function addMentorNotes(_prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can add notes" };
  }

  const sessionId = formData.get("sessionId") as string;
  const notes = (formData.get("notes") as string) || "";

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.mentorId !== user.mentor.id) {
    return { error: "Session not found" };
  }
  if (session.status !== SessionStatus.COMPLETED) {
    return { error: "Notes can only be added to completed sessions" };
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { mentorNotes: notes },
  });

  return { success: true };
}

export async function getBookableSlotsForMentor(mentorId: string) {
  return getBookableSlots(mentorId);
}