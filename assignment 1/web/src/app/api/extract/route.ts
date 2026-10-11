import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractMeetingData } from '@/lib/ai-extractor';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, baseDate } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text content is required for extraction' }, { status: 400 });
    }

    // Fetch all members for alias and name matching
    const members = await prisma.member.findMany({
      orderBy: { name: 'asc' },
    });

    const parsedBaseDate = baseDate ? new Date(baseDate) : new Date();

    const result = await extractMeetingData(text, members, parsedBaseDate);

    return NextResponse.json({
      success: true,
      data: result,
      members,
    });
  } catch (error: any) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract meeting data',
        details: error?.message || 'Unknown extraction error',
      },
      { status: 500 }
    );
  }
}
