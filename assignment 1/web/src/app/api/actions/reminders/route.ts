import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, addDays, isBefore, isToday } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startToday = startOfDay(now);
    const endToday = endOfDay(now);
    const in48Hours = endOfDay(addDays(now, 2));

    // Get all open/in_progress actions
    const allActiveActions = await prisma.actionItem.findMany({
      where: {
        status: { in: ['open', 'in_progress'] },
      },
      include: {
        assignee: true,
        meeting: {
          select: { id: true, title: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const overdueItems: any[] = [];
    const todayItems: any[] = [];
    const dueSoonItems: any[] = [];
    let myOpenCount = 0;

    for (const item of allActiveActions) {
      if (user.memberId && item.assigneeId === user.memberId) {
        myOpenCount++;
      }

      if (!item.dueDate) continue;

      const d = new Date(item.dueDate);
      if (isBefore(d, startToday)) {
        const daysOverdue = Math.max(1, Math.floor((startToday.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
        overdueItems.push({
          id: item.id,
          title: item.title,
          dueDate: item.dueDate,
          daysOverdue,
          assigneeName: item.assignee?.name || 'Unassigned',
          meetingTitle: item.meeting.title,
          meetingId: item.meetingId,
          isMine: user.memberId ? item.assigneeId === user.memberId : false,
        });
      } else if (isToday(d) || (isAfter(d, startToday) && isBefore(d, endToday))) {
        todayItems.push({
          id: item.id,
          title: item.title,
          dueDate: item.dueDate,
          assigneeName: item.assignee?.name || 'Unassigned',
          meetingTitle: item.meeting.title,
          meetingId: item.meetingId,
          isMine: user.memberId ? item.assigneeId === user.memberId : false,
        });
      } else if (isBefore(d, in48Hours)) {
        dueSoonItems.push({
          id: item.id,
          title: item.title,
          dueDate: item.dueDate,
          assigneeName: item.assignee?.name || 'Unassigned',
          meetingTitle: item.meeting.title,
          meetingId: item.meetingId,
          isMine: user.memberId ? item.assigneeId === user.memberId : false,
        });
      }
    }

    // Fingerprint for deduplication
    const fingerprint = `${overdueItems.length}-${todayItems.length}-${dueSoonItems.length}-${allActiveActions.map((a) => a.id).join(',')}`;

    return NextResponse.json({
      timestamp: now.toISOString(),
      fingerprint,
      summary: {
        overdueCount: overdueItems.length,
        todayCount: todayItems.length,
        dueSoonCount: dueSoonItems.length,
        totalActiveCount: allActiveActions.length,
        myOpenCount,
      },
      overdueItems,
      todayItems,
      dueSoonItems,
    });
  } catch (error: any) {
    console.error('Reminders API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

function isAfter(date1: Date, date2: Date) {
  return date1.getTime() > date2.getTime();
}
