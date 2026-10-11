import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ProgressBoard({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contest = await prisma.contest.findUnique({
    where: { id: params.id },
    include: {
      judges: { include: { user: true }, orderBy: { label: 'asc' } },
      submissions: {
        include: {
          team: true,
          reviews: true,
          recusals: true
        }
      }
    }
  });

  if (!contest) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="mb-6">
        <Link href={`/organizer/contest/${contest.id}`} className="text-sm text-vault-muted hover:text-vault-navy transition">
          &larr; Back to Contest
        </Link>
        <h1 className="text-3xl font-serif text-vault-navy mt-4">Progress Board</h1>
      </div>

      <div className="bg-white rounded-lg archival-border archival-shadow overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-vault-card border-b border-vault-border text-vault-navy">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-xs">Submission / Team</th>
              {contest.judges.map(j => (
                <th key={j.id} className="px-6 py-4 font-medium uppercase text-xs border-l border-vault-border">
                  {j.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vault-border text-vault-ink">
            {contest.submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-vault-canvas/50">
                <td className="px-6 py-4">
                  <div className="font-medium text-vault-navy">{sub.title}</div>
                  <div className="text-xs text-vault-muted mt-1">{sub.team.name}</div>
                </td>

                {contest.judges.map(j => {
                  const isRecused = sub.recusals.some(r => r.judgeId === j.userId);
                  const review = sub.reviews.find(r => r.judgeId === j.userId);

                  let statusLabel = 'Not Started';
                  let statusClass = 'bg-vault-card text-vault-muted';

                  if (isRecused) {
                    statusLabel = 'Recused';
                    statusClass = 'bg-transparent text-vault-muted italic';
                  } else if (review) {
                    if (review.submittedAt) {
                      statusLabel = 'Submitted';
                      statusClass = 'text-vault-emerald font-medium';
                    } else {
                      statusLabel = 'Draft';
                      statusClass = 'text-vault-copper';
                    }
                  }

                  return (
                    <td key={j.id} className="px-6 py-4 border-l border-vault-border">
                      <span className={`px-2 py-1 rounded text-xs tracking-wide ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}

            {contest.submissions.length === 0 && (
              <tr>
                <td colSpan={contest.judges.length + 1} className="px-6 py-8 text-center text-vault-muted italic">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
