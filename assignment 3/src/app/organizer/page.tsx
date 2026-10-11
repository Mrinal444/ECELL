import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import Link from 'next/link';

export default async function OrganizerDashboard() {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contests = await prisma.contest.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif text-vault-navy">Contests</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => (
          <Link
            key={contest.id}
            href={`/organizer/contest/${contest.id}`}
            className="block bg-white archival-border rounded-lg p-6 hover:shadow-md transition archival-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-medium text-vault-navy">{contest.title}</h2>
              <span className="text-xs uppercase bg-vault-card px-2 py-1 rounded font-mono text-vault-muted border border-vault-border">
                {contest.status}
              </span>
            </div>
            <p className="text-sm text-vault-muted line-clamp-2 mb-4 h-10">
              {contest.description}
            </p>
            <div className="text-xs text-vault-muted">
              Deadline: {new Date(contest.submissionDeadline).toLocaleString('en-US', { timeZoneName: 'short' })}
            </div>
          </Link>
        ))}
        {contests.length === 0 && (
          <div className="col-span-full py-12 text-center text-vault-muted bg-white archival-border rounded-lg">
            No contests found in the vault.
          </div>
        )}
      </div>
    </div>
  );
}
