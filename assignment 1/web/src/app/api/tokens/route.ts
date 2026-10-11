import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        token: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Fetch tokens error:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const label = body?.label?.trim() || 'Chrome Extension Token';

    const randomSecret = crypto.randomBytes(24).toString('hex');
    const tokenString = `ecell_ext_${randomSecret}`;

    const apiToken = await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: tokenString,
        label,
      },
    });

    return NextResponse.json({
      success: true,
      token: {
        id: apiToken.id,
        label: apiToken.label,
        token: apiToken.token,
        createdAt: apiToken.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('id');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const token = await prisma.apiToken.findFirst({
      where: { id: tokenId, userId: user.id },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Token revoked successfully' });
  } catch (error: any) {
    console.error('Revoke token error:', error);
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}
