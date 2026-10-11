import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BoardClient from './BoardClient';

export const dynamic = 'force-dynamic';

export default async function BoardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [actions, members, meetings] = await Promise.all([
    prisma.actionItem.findMany({
      include: {
        assignee: true,
        meeting: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            source: true,
          },
        },
        carriedFrom: {
          include: {
            meeting: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.member.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.meeting.findMany({
      orderBy: { startsAt: 'desc' },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <BoardClient
        initialActions={actions}
        members={members}
        meetings={meetings}
        currentUser={user}
      />
    </div>
  );
}
