"use server";

import { prisma, requireUser } from "../auth";
import { Domain, Stage, Skill, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateFounderProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const user = await requireUser();
  if (user.role !== Role.FOUNDER || !user.founder) {
    return { error: "Only founders can update founder profile" };
  }

  const startupName = formData.get("startupName") as string;
  const pitch = formData.get("pitch") as string;
  const domain = formData.get("domain") as Domain;
  const stage = formData.get("stage") as Stage;
  const needsNote = (formData.get("needsNote") as string) || "";
  const needs = formData.getAll("needs") as Skill[];

  await prisma.founderProfile.update({
    where: { id: user.founder.id },
    data: {
      startupName,
      pitch,
      domain,
      stage,
      needsNote,
      needs: {
        deleteMany: {},
        create: needs.map((skill) => ({ skill })),
      },
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateMentorProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can update mentor profile" };
  }

  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const expertiseNote = (formData.get("expertiseNote") as string) || "";
  const domains = formData.getAll("domains") as Domain[];
  const stages = formData.getAll("stages") as Stage[];
  const skills = formData.getAll("skills") as Skill[];

  await prisma.mentorProfile.update({
    where: { id: user.mentor.id },
    data: {
      headline,
      bio,
      expertiseNote,
      domains: {
        deleteMany: {},
        create: domains.map((domain) => ({ domain })),
      },
      stages: {
        deleteMany: {},
        create: stages.map((stage) => ({ stage })),
      },
      skills: {
        deleteMany: {},
        create: skills.map((skill) => ({ skill })),
      },
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function addAvailabilitySlot(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can add availability" };
  }

  const weekday = parseInt(formData.get("weekday") as string, 10);
  const startMin = parseInt(formData.get("startMin") as string, 10);
  const endMin = parseInt(formData.get("endMin") as string, 10);

  if (isNaN(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Invalid day of week" };
  }
  if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) {
    return { error: "End time must be after start time" };
  }

  await prisma.availabilitySlot.create({
    data: {
      mentorId: user.mentor.id,
      weekday,
      startMin,
      endMin,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAvailabilitySlot(slotId: string) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR || !user.mentor) {
    return { error: "Only mentors can delete availability" };
  }

  await prisma.availabilitySlot.deleteMany({
    where: {
      id: slotId,
      mentorId: user.mentor.id,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}