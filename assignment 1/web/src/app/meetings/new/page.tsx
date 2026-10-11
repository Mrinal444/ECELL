import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NewMeetingForm from './NewMeetingForm';

export const dynamic = 'force-dynamic';

export default async function NewMeetingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const members = await prisma.member.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <NewMeetingForm members={members} />
    </div>
  );
}
