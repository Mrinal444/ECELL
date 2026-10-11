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
    const q = searchParams.get('q')?.trim() || '';
    const source = searchParams.get('source');
    const memberId = searchParams.get('memberId');

    const whereClause: any = {};

    if (source && source !== 'all') {
      whereClause.source = source;
    }

    if (memberId) {
      whereClause.attendees = {
        some: { memberId },
      };
    }

    if (q) {
      whereClause.OR = [
        { title: { contains: q } },
        { notes: { contains: q } },
        { agenda: { contains: q } },
        { rawText: { contains: q } },
        {
          decisions: {
            some: {
              text: { contains: q },
            },
          },
        },
        {
          actionItems: {
            some: {
              title: { contains: q },
            },
          },
        },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, displayName: true, email: true },
        },
        attendees: {
          include: {
            member: true,
          },
        },
        decisions: {
          orderBy: { createdAt: 'asc' },
        },
        actionItems: {
          include: {
            assignee: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startsAt: 'desc' },
    });

    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error('Fetch meetings error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      startsAt,
      agenda,
      notes,
      rawText,
      source = 'manual',
      attendeeIds = [],
      decisions = [],
      actionItems = [],
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 });
    }

    const meetingDate = startsAt ? new Date(startsAt) : new Date();

    const meeting = await prisma.meeting.create({
      data: {
        title: title.trim(),
        startsAt: meetingDate,
        agenda: agenda?.trim() || null,
        notes: notes?.trim() || null,
        rawText: rawText?.trim() || null,
        source,
        createdById: user.id,
        attendees: {
          create: (attendeeIds || []).map((mId: string) => ({
            memberId: mId,
          })),
        },
        decisions: {
          create: (decisions || [])
            .map((d: any) => ({ text: typeof d === 'string' ? d : d.text }))
            .filter((d: any) => d.text && d.text.trim().length > 0),
        },
        actionItems: {
          create: (actionItems || [])
            .filter((a: any) => a.title && a.title.trim().length > 0)
            .map((a: any) => ({
              title: a.title.trim(),
              assigneeId: a.assigneeId || null,
              dueDate: a.dueDate ? new Date(a.dueDate) : null,
              status: a.status || 'open',
              origin: a.origin || 'manual',
            })),
        },
      },
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
    });

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    return NextResponse.json({ error: 'Failed to create meeting', details: error?.message }, { status: 500 });
  }
}
