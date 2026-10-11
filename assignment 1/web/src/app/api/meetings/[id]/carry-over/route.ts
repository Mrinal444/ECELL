import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentMeeting = await prisma.meeting.findUnique({
      where: { id: params.id },
    });

    if (!currentMeeting) {
      return NextResponse.json({ error: 'Current meeting not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    let sourceMeetingId = body?.fromMeetingId;

    // If not specified, find the previous meeting before this one
    if (!sourceMeetingId) {
      const previousMeeting = await prisma.meeting.findFirst({
        where: {
          id: { not: currentMeeting.id },
          startsAt: { lte: currentMeeting.startsAt },
        },
        orderBy: { startsAt: 'desc' },
      });

      if (!previousMeeting) {
        return NextResponse.json(
          { error: 'No previous meeting found to carry over actions from' },
          { status: 400 }
        );
      }
      sourceMeetingId = previousMeeting.id;
    }

    // Find unfinished actions from the source meeting
    const openActions = await prisma.actionItem.findMany({
      where: {
        meetingId: sourceMeetingId,
        status: { in: ['open', 'in_progress'] },
      },
    });

    if (openActions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No open actions found in the previous meeting to carry over',
        carriedCount: 0,
        actions: [],
      });
    }

    // Clone into current meeting with carriedFromId
    const createdActions = [];
    for (const action of openActions) {
      // Check if already carried over into this meeting
      const alreadyExists = await prisma.actionItem.findFirst({
        where: {
          meetingId: currentMeeting.id,
          carriedFromId: action.id,
        },
      });

      if (!alreadyExists) {
        const cloned = await prisma.actionItem.create({
          data: {
            meetingId: currentMeeting.id,
            title: `[Carried Over] ${action.title.replace(/^\[Carried Over\]\s*/, '')}`,
            assigneeId: action.assigneeId,
            dueDate: action.dueDate,
            status: action.status,
            carriedFromId: action.id,
            origin: action.origin,
          },
          include: {
            assignee: true,
          },
        });
        createdActions.push(cloned);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully carried over ${createdActions.length} open actions`,
      carriedCount: createdActions.length,
      actions: createdActions,
    });
  } catch (error: any) {
    console.error('Carry over error:', error);
    return NextResponse.json({ error: 'Failed to carry over actions' }, { status: 500 });
  }
}
