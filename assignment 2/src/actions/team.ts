"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireLead, hashPassword } from "@/lib/auth";
import { UserRole } from "@/types";

export async function createUserAction(data: {
  name: string;
  email: string;
  role: UserRole;
  initialPassword?: string;
  temporaryPassword?: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  await requireLead();

  const email = data.email.toLowerCase().trim();
  if (!email || !data.name.trim()) {
    return { success: false, error: "Name and email are required." };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return { success: false, error: `A user with email "${email}" already exists.` };
  }

  const tempPass = data.initialPassword || data.temporaryPassword || "Welcome2026!";
  const passwordHash = await hashPassword(tempPass);

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      role: data.role || "MEMBER",
      active: true,
      mustChangePassword: true, // Requires password change on first login
    },
  });

  revalidatePath("/team");
  return { success: true, userId: newUser.id };
}

export async function toggleUserActiveAction(
  userId: string,
  active?: boolean
): Promise<{ success: boolean; error?: string }> {
  const leadUser = await requireLead();

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { success: false, error: "User not found." };
  }

  const newActiveState = typeof active === "boolean" ? active : !target.active;

  if (userId === leadUser.id && !newActiveState) {
    return { success: false, error: "You cannot deactivate your own lead account." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active: newActiveState },
  });

  revalidatePath("/team");
  revalidatePath("/deals");
  return { success: true };
}

export async function resetUserPasswordAction(
  userId: string,
  temporaryPassword?: string
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  await requireLead();

  const tempPass = temporaryPassword || "Reset2026!";
  const passwordHash = await hashPassword(tempPass);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  revalidatePath("/team");
  return { success: true, tempPassword: tempPass };
}

export async function bulkReassignUserDealsAction(
  fromUserId: string,
  toUserId: string | null
): Promise<{ success: boolean; count?: number; error?: string }> {
  const leadUser = await requireLead();

  const fromUser = await prisma.user.findUnique({ where: { id: fromUserId } });
  if (!fromUser) {
    return { success: false, error: "Source user not found." };
  }

  let toUser: { id: string; name: string } | null = null;
  if (toUserId) {
    toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) {
      return { success: false, error: "Target user not found." };
    }
  }

  const dealsToReassign = await prisma.deal.findMany({
    where: {
      ownerId: fromUserId,
      stage: { notIn: ["CONFIRMED", "LOST"] },
    },
  });

  if (dealsToReassign.length === 0) {
    return { success: true, count: 0 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.deal.updateMany({
      where: {
        ownerId: fromUserId,
        stage: { notIn: ["CONFIRMED", "LOST"] },
      },
      data: {
        ownerId: toUserId,
        lastActivityAt: new Date(),
        version: { increment: 1 },
      },
    });

    const targetName = toUser ? toUser.name : "Open Queue (Unassigned)";
    for (const deal of dealsToReassign) {
      await tx.activity.create({
        data: {
          dealId: deal.id,
          userId: leadUser.id,
          type: "ASSIGNMENT",
          body: `Bulk reassigned from ${fromUser.name} to ${targetName} by Lead.`,
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/deals");
  revalidatePath("/team");
  return { success: true, count: dealsToReassign.length };
}

export async function bulkReassignDealsAction(
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; reassignedCount?: number; error?: string }> {
  const res = await bulkReassignUserDealsAction(fromUserId, toUserId);
  return { success: res.success, reassignedCount: res.count, error: res.error };
}

export async function createCampaignAction(data: {
  name: string;
  year: number;
  goalINR?: number;
}): Promise<{ success: boolean; error?: string; campaignId?: string }> {
  await requireLead();

  if (!data.name.trim() || !data.year) {
    return { success: false, error: "Campaign name and edition year are required." };
  }

  const existing = await prisma.campaign.findFirst({
    where: { name: data.name.trim() },
  });

  if (existing) {
    return { success: false, error: `Campaign "${data.name}" already exists.` };
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name.trim(),
      year: Number(data.year),
      goalINR: data.goalINR ? Number(data.goalINR) : null,
      active: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/deals");
  return { success: true, campaignId: campaign.id };
}
