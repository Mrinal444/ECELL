import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'ecell-super-secret-key-meeting-notetaker-2026';
const COOKIE_NAME = 'ecell_session';

export interface AuthSessionUser {
  id: string;
  email: string;
  displayName: string;
  memberId: string | null;
  role?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifySessionToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from cookie or Authorization header
 */
export async function getCurrentUser(request?: NextRequest): Promise<AuthSessionUser | null> {
  // 1. Check Authorization header (Bearer token from extension or API)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const tokenString = authHeader.substring(7).trim();

      // Look up in ApiToken table
      const apiToken = await prisma.apiToken.findUnique({
        where: { token: tokenString },
        include: {
          user: {
            include: {
              member: true,
            },
          },
        },
      });

      if (apiToken && !apiToken.revokedAt) {
        // Update lastUsedAt in background
        prisma.apiToken.update({
          where: { id: apiToken.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});

        return {
          id: apiToken.user.id,
          email: apiToken.user.email,
          displayName: apiToken.user.displayName,
          memberId: apiToken.user.memberId,
          role: apiToken.user.member?.role,
        };
      }

      // Check if it's a JWT directly
      const decoded = verifySessionToken(tokenString);
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { member: true },
        });
        if (user) {
          return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            memberId: user.memberId,
            role: user.member?.role,
          };
        }
      }
    }
  }

  // 2. Check Cookie (Web Session)
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const decoded = verifySessionToken(sessionCookie.value);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { member: true },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      memberId: user.memberId,
      role: user.member?.role,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
