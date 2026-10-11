import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MyWorkClient from './MyWorkClient';

export const dynamic = 'force-dynamic';

export default async function MyWorkPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const allMembers = await prisma.member.findMany({
    orderBy: { name: 'asc' },
  });

  // If user is linked to a member, fetch their actions
  let myActions: any[] = [];
  if (user.memberId) {
    myActions = await prisma.actionItem.findMany({
      where: { assigneeId: user.memberId },
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
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <MyWorkClient
        initialActions={myActions}
        currentUser={user}
        members={allMembers}
      />
    </div>
  );
}
