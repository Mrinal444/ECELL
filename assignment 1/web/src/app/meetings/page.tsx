import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import MeetingsClient from './MeetingsClient';

export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [meetings, members] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { startsAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, displayName: true, email: true },
        },
        attendees: {
          include: { member: true },
        },
        decisions: true,
        actionItems: {
          include: { assignee: true },
        },
      },
    }),
    prisma.member.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <MeetingsClient initialMeetings={meetings} members={members} />
    </div>
  );
}
