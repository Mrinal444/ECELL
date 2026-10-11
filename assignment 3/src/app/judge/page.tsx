import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import Link from 'next/link';

export default async function JudgeDashboard() {
  const session = await requireAuth();
  requireRole(session, ['JUDGE']);

  const assignments = await prisma.contestJudge.findMany({
    where: { userId: session.id },
    include: {
      contest: {
        include: {
          submissions: {
            include: { recusals: true, reviews: { where: { judgeId: session.id } } }
          }
        }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-serif text-vault-navy mb-8">Judging Queue</h1>

      {assignments.length === 0 && (
        <div className="bg-white p-12 text-center rounded-lg archival-border text-vault-muted archival-shadow">
          You are not assigned to any contests.
        </div>
      )}

      <div className="space-y-12">
        {assignments.map(assignment => {
          const contest = assignment.contest;
          if (contest.status === 'DRAFT' || contest.status === 'OPEN') {
            return (
              <div key={contest.id} className="bg-white p-6 rounded-lg archival-border archival-shadow">
                <h2 className="text-xl font-medium text-vault-navy mb-2">{contest.title}</h2>
                <div className="text-sm text-vault-muted">
                  Contest is currently {contest.status.toLowerCase()}. Judging has not commenced yet.
                </div>
              </div>
            );
          }

          const activeSubmissions = contest.submissions.filter(s =>
            !s.recusals.some(r => r.judgeId === session.id)
          );

          const scoredCount = activeSubmissions.filter(s =>
            s.reviews.some(r => r.submittedAt !== null)
          ).length;

          const remainingCount = activeSubmissions.length - scoredCount;

          return (
            <div key={contest.id} className="bg-white p-6 rounded-lg archival-border archival-shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-vault-navy">{contest.title}</h2>
                {contest.status === 'PUBLISHED' && (
                  <span className="text-xs bg-vault-emerald-faint text-vault-emerald px-2 py-1 rounded border border-vault-emerald/20">PUBLISHED</span>
                )}
                {contest.status === 'JUDGING' && (
                  <span className="text-sm rounded bg-vault-card px-3 py-1 text-vault-muted font-medium border border-vault-border">
                    <span className="text-vault-navy">{scoredCount}</span> scored / <span className="text-vault-copper">{remainingCount}</span> remaining
                  </span>
                )}
              </div>

              {activeSubmissions.length === 0 ? (
                <div className="text-center p-6 bg-vault-canvas/50 rounded text-sm text-vault-muted">
                  No submissions to review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSubmissions.map(sub => {
                    const review = sub.reviews[0];
                    const isSubmitted = review?.submittedAt != null;
                    const isDraft = review && !review.submittedAt;

                    return (
                      <Link
                        key={sub.id}
                        href={`/judge/score/${sub.id}`}
                        className="block border border-vault-border rounded-lg p-5 hover:border-vault-copper transition group hover:shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-vault-navy line-clamp-1">{sub.title}</h3>
                          {isSubmitted ? (
                            <span className="text-xs text-vault-emerald font-medium ml-2">Done</span>
                          ) : isDraft ? (
                            <span className="text-xs text-vault-copper font-medium ml-2">Draft</span>
                          ) : (
                            <span className="text-xs text-vault-muted ml-2">Pending</span>
                          )}
                        </div>
                        <p className="text-xs text-vault-muted line-clamp-2 h-8">{sub.problem}</p>

                        <div className="mt-4 pt-4 border-t border-vault-border flex justify-between items-center text-xs">
                          <span className="text-vault-muted group-hover:text-vault-copper transition">
                            {isSubmitted ? 'View Review' : 'Start Review'}
                          </span>
                          <span className="text-vault-muted">&rarr;</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
