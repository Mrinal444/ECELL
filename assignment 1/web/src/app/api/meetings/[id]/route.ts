import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findUnique({
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
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error: any) {
    console.error('Get meeting error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, startsAt, agenda, notes, rawText, source, attendeeIds } = body;

    const existing = await prisma.meeting.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Update attendees if provided
    if (Array.isArray(attendeeIds)) {
      await prisma.meetingAttendee.deleteMany({
        where: { meetingId: params.id },
      });
      await prisma.meetingAttendee.createMany({
        data: attendeeIds.map((memberId: string) => ({
          meetingId: params.id,
          memberId,
        })),
      });
    }

    const updated = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        title: title ? title.trim() : existing.title,
        startsAt: startsAt ? new Date(startsAt) : existing.startsAt,
        agenda: agenda !== undefined ? agenda : existing.agenda,
        notes: notes !== undefined ? notes : existing.notes,
        rawText: rawText !== undefined ? rawText : existing.rawText,
        source: source || existing.source,
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

    return NextResponse.json({ success: true, meeting: updated });
  } catch (error: any) {
    console.error('Update meeting error:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.meeting.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    await prisma.meeting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    console.error('Delete meeting error:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
