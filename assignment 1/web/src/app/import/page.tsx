import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ImportClient from './ImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const members = await prisma.member.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <ImportClient members={members} />
    </div>
  );
}
