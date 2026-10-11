import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [members, tokens] = await Promise.all([
    prisma.member.findMany({
      include: {
        _count: {
          select: {
            assignedActions: true,
            attendedMeetings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <SettingsClient
        currentUser={user}
        members={members}
        initialTokens={tokens}
      />
    </div>
  );
}
