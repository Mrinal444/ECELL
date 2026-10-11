import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { PrismaClient, Role, User } from "@prisma/client";
import { redirect } from "next/navigation";

// Singleton Prisma client for server
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const getSecret = () => {
  const secret = process.env.JWT_SECRET || "super-secret-jwt-key-change-me";
  return new TextEncoder().encode(secret);
};

export type SessionPayload = {
  userId: string;
  role: Role;
};

export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const c = await cookies();
  c.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const c = await cookies();
  const session = c.get("session")?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function requireUser() {
  const payload = await getSessionPayload();
  if (!payload) {
    redirect("/login");
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { founder: true, mentor: true },
  });
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(expectedRole: Role) {
  const user = await requireUser();
  if (user.role !== expectedRole) {
    redirect("/discover");
  }
  return user;
}

export async function destroySession() {
  const c = await cookies();
  c.delete("session");
}
