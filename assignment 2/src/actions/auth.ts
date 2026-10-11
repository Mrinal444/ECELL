"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  requireAuth,
} from "@/lib/auth";

export async function loginAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.active) {
    return { success: false, error: "Invalid email credentials or account is deactivated." };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid email credentials or password." };
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as any,
    mustChangePassword: user.mustChangePassword,
  });

  if (user.mustChangePassword) {
    redirect("/password/change");
  }

  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function changePasswordAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New password and confirmation do not match." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    return { success: false, error: "User not found." };
  }

  // If not in forced change mode, verify current password
  if (!dbUser.mustChangePassword && currentPassword) {
    const isCurrentValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  await setSessionCookie({
    ...user,
    mustChangePassword: false,
  });

  revalidatePath("/");
  redirect("/");
}
