import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MeetingDetailClient from './MeetingDetailClient';

export const dynamic = 'force-dynamic';

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [meeting, allMembers, allMeetings] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, displayName: true, email: true },
        },
        attendees: {
          include: { member: true },
        },
        decisions: {
          orderBy: { createdAt: 'asc' },
        },
        actionItems: {
          include: {
            assignee: true,
            carriedFrom: {
              include: {
                meeting: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.member.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.meeting.findMany({
      where: { id: { not: params.id } },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        title: true,
        startsAt: true,
        actionItems: {
          where: { status: { in: ['open', 'in_progress'] } },
          include: { assignee: true },
        },
      },
    }),
  ]);

  if (!meeting) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-12">
      <MeetingDetailClient
        initialMeeting={meeting}
        members={allMembers}
        otherMeetings={allMeetings}
        currentUser={user}
      />
    </div>
  );
}
