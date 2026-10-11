import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        member: true,
      },
    });

    return NextResponse.json({
      user: {
        id: fullUser?.id,
        email: fullUser?.email,
        displayName: fullUser?.displayName,
        memberId: fullUser?.memberId,
        member: fullUser?.member,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
