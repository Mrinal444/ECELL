import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from './domain/policy';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-prod';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  id: string;
  role: Role;
  email: string;
  name: string;
  expiresAt: Date;
}

export async function encrypt(payload: Omit<SessionPayload, 'expiresAt'> & { expiresAt: Date }) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1w')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
  const session = await encrypt({ ...payload, expiresAt });

  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export function deleteSession() {
  cookies().delete('session');
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

/**
 * Validates the session and returns user if authenticated.
 * Used heavily in server actions / API routes.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
