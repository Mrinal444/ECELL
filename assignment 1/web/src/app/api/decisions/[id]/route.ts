import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Decision text is required' }, { status: 400 });
    }

    const updated = await prisma.decision.update({
      where: { id: params.id },
      data: { text: text.trim() },
    });

    return NextResponse.json({ success: true, decision: updated });
  } catch (error: any) {
    console.error('Update decision error:', error);
    return NextResponse.json({ error: 'Failed to update decision' }, { status: 500 });
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

    await prisma.decision.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Decision deleted successfully' });
  } catch (error: any) {
    console.error('Delete decision error:', error);
    return NextResponse.json({ error: 'Failed to delete decision' }, { status: 500 });
  }
}
