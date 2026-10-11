import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const members = await prisma.member.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            assignedActions: {
              where: { status: { in: ['open', 'in_progress'] } },
            },
            attendedMeetings: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, email, aliases } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Member name is required' }, { status: 400 });
    }

    let aliasesJson = '[]';
    if (Array.isArray(aliases)) {
      aliasesJson = JSON.stringify(aliases);
    } else if (typeof aliases === 'string') {
      const split = aliases.split(',').map((s) => s.trim()).filter(Boolean);
      aliasesJson = JSON.stringify(split);
    }

    const member = await prisma.member.create({
      data: {
        name: name.trim(),
        role: role?.trim() || 'Core Team',
        email: email?.trim() || null,
        aliases: aliasesJson,
      },
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error: any) {
    console.error('Create member error:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
