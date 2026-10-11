'use server';

import { prisma } from '@/lib/db';
import { createSession, deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { compare } from 'bcryptjs';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: 'Invalid credentials' };
  }

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) {
    return { error: 'Invalid credentials' };
  }

  await createSession({
    id: user.id,
    role: user.role as any,
    email: user.email,
    name: user.name,
  });

  // Redirect based on role
  if (user.role === 'ORGANIZER') redirect('/organizer');
  if (user.role === 'TEAM') redirect('/team');
  if (user.role === 'JUDGE') redirect('/judge');

  redirect('/');
}

export async function logout() {
  deleteSession();
  redirect('/');
}
