import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const meetingId = searchParams.get('meetingId');
    const myWorkOnly = searchParams.get('myWork') === 'true';

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (meetingId) {
      whereClause.meetingId = meetingId;
    }

    if (myWorkOnly) {
      if (!user.memberId) {
        return NextResponse.json({ actions: [] });
      }
      whereClause.assigneeId = user.memberId;
    } else if (assigneeId) {
      if (assigneeId === 'unassigned') {
        whereClause.assigneeId = null;
      } else if (assigneeId !== 'all') {
        whereClause.assigneeId = assigneeId;
      }
    }

    const actions = await prisma.actionItem.findMany({
      where: whereClause,
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
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error('Fetch actions error:', error);
    return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { meetingId, title, assigneeId, dueDate, status = 'open', origin = 'manual' } = body;

    if (!meetingId || !title) {
      return NextResponse.json({ error: 'Meeting ID and action title are required' }, { status: 400 });
    }

    const action = await prisma.actionItem.create({
      data: {
        meetingId,
        title: title.trim(),
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        origin,
      },
      include: {
        assignee: true,
        meeting: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ success: true, action }, { status: 201 });
  } catch (error: any) {
    console.error('Create action error:', error);
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
}
