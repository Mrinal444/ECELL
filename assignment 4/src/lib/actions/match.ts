"use server";

import { prisma, requireUser } from "../auth";
import { Role, MatchStatus } from "@prisma/client";

export async function createMatchRequest(_prevState: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.FOUNDER || !user.founder) {
    return { error: "Only founders can send requests" };
  }

  const mentorId = formData.get("mentorId") as string;
  const score = parseInt(formData.get("score") as string, 10);
  const reason = formData.get("reason") as string;

  const existing = await prisma.matchRequest.findUnique({
    where: {
      founderId_mentorId: {
        founderId: user.founder.id,
        mentorId,
      }
    }
  });

  if (existing) {
    if (existing.status === MatchStatus.DECLINED) {
      const cooldownDays = 14;
      const daysSinceDecline = (Date.now() - existing.respondedAt!.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDecline < cooldownDays) {
        return { error: `Cannot re-request. Cooldown active for ${Math.ceil(cooldownDays - daysSinceDecline)} more days.` };
      }
      await prisma.matchRequest.update({
        where: { id: existing.id },
        data: {
          status: MatchStatus.PENDING,
          score,
          reason,
          message: "Re-requesting connection",
          respondedAt: null,
        }
      });
    } else {
      return { error: "Request already exists (PENDING or ACCEPTED)" };
    }
  } else {
    await prisma.matchRequest.create({
      data: {
        founderId: user.founder.id,
        mentorId,
        score,
        reason,
        message: "I'd like to connect!",
      }
    });
  }

  return { success: true };
}

export async function updateMatchRequestStatus(_prevState: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can respond" };
  }

  const requestId = formData.get("requestId") as string;
  const status = formData.get("status") as MatchStatus;

  await prisma.matchRequest.update({
    where: {
      id: requestId,
      mentorId: user.mentor.id
    },
    data: {
      status,
      respondedAt: new Date(),
    }
  });

  return { success: true };
}