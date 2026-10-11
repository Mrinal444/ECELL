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

    const body = await request.json();
    const { title, assigneeId, dueDate, status } = body;

    const existing = await prisma.actionItem.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'done') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updated = await prisma.actionItem.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: true,
        meeting: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ success: true, action: updated });
  } catch (error: any) {
    console.error('Update action error:', error);
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
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

    const existing = await prisma.actionItem.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    await prisma.actionItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Action item deleted successfully' });
  } catch (error: any) {
    console.error('Delete action error:', error);
    return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 });
  }
}
