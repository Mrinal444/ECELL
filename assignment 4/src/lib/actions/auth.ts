"use server";

import { z } from "zod";
import { prisma, createSession } from "../auth";
import { hash, compare } from "bcryptjs";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid credentials" };

  const valid = await compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  await createSession(user.id, user.role);
  redirect("/discover");
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email already taken" };

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      ...(role === Role.FOUNDER ? { founder: { create: {} } } : {}),
      ...(role === Role.MENTOR ? { mentor: { create: {} } } : {}),
    },
  });

  await createSession(user.id, user.role);
  redirect("/onboarding");
}

export async function logout() {
  const { destroySession } = await import("../auth");
  await destroySession();
  redirect("/");
}
