import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId, text } = await request.json();

    if (!meetingId || !text || !text.trim()) {
      return NextResponse.json({ error: 'Meeting ID and decision text are required' }, { status: 400 });
    }

    const decision = await prisma.decision.create({
      data: {
        meetingId,
        text: text.trim(),
      },
    });

    return NextResponse.json({ success: true, decision }, { status: 201 });
  } catch (error: any) {
    console.error('Create decision error:', error);
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 });
  }
}
