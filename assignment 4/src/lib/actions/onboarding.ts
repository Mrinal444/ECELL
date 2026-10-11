"use server";

import { z } from "zod";
import { prisma, requireUser } from "../auth";
import { Domain, Stage, Skill, Role } from "@prisma/client";
import { redirect } from "next/navigation";

export async function completeFounderOnboarding(_prevState: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.FOUNDER) return { error: "Not a founder" };

  const startupName = formData.get("startupName") as string;
  const pitch = formData.get("pitch") as string;
  const domain = formData.get("domain") as Domain;
  const stage = formData.get("stage") as Stage;
  const needs = formData.getAll("needs") as Skill[];

  await prisma.founderProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      startupName,
      pitch,
      domain,
      stage,
      onboarded: true,
      needs: {
        create: needs.map((skill) => ({ skill })),
      },
    },
    update: {
      startupName,
      pitch,
      domain,
      stage,
      onboarded: true,
      needs: {
        deleteMany: {},
        create: needs.map((skill) => ({ skill })),
      },
    },
  });

  redirect("/discover");
}

export async function completeMentorOnboarding(_prevState: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  if (user.role !== Role.MENTOR) return { error: "Not a mentor" };

  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const domains = formData.getAll("domains") as Domain[];
  const stages = formData.getAll("stages") as Stage[];
  const skills = formData.getAll("skills") as Skill[];

  // Weekday availability (simple default for now)
  const weekdays = [1, 2, 3, 4, 5]; // Mon-Fri
  const availability = weekdays.map((weekday) => ({
    weekday,
    startMin: 600, // 10:00 AM
    endMin: 660,   // 11:00 AM
  }));

  await prisma.mentorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      headline,
      bio,
      onboarded: true,
      domains: { create: domains.map((domain) => ({ domain })) },
      stages: { create: stages.map((stage) => ({ stage })) },
      skills: { create: skills.map((skill) => ({ skill })) },
      availability: { create: availability },
    },
    update: {
      headline,
      bio,
      onboarded: true,
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
      availability: {
        deleteMany: {},
        create: availability,
      },
    },
  });

  redirect("/discover");
}
