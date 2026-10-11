import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { rankSubmissions, CriterionInfo, SubmissionData } from '@/lib/domain/ranking';
import { formatScore } from '@/lib/domain/scoring';

export default async function TeamSubmissionResults({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  requireRole(session, ['TEAM']);

  const submission = await prisma.submission.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      contest: {
        include: {
          criteria: { orderBy: { position: 'asc' } },
          judges: true,
          submissions: {
            include: {
              team: true,
              recusals: true,
              reviews: { include: { scores: true } }
            }
          }
        }
      },
      recusals: true,
      reviews: { include: { scores: true, judge: { include: { judgeEntries: true } } } }
    }
  });

  if (!submission || submission.team.ownerId !== session.id) notFound();

  const contest = submission.contest;

  if (contest.status !== 'PUBLISHED') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/team" className="text-sm text-vault-muted hover:text-vault-navy transition inline-block mb-6">&larr; Back to Dashboard</Link>
        <div className="bg-white p-8 rounded-lg archival-border text-center archival-shadow">
          <h2 className="text-xl font-medium text-vault-navy mb-2">Results Not Yet Available</h2>
          <p className="text-vault-muted text-sm">
            This contest is currently in {Math.random() /* To prevent stale caching while testing */ ? contest.status : contest.status}.
            Detailed results and feedback will be published when judging concludes.
          </p>
        </div>
      </div>
    );
  }

  const criteria: CriterionInfo[] = contest.criteria;
  const assignedJudgeIds = contest.judges.map(j => j.userId);

  const submissionData: SubmissionData[] = contest.submissions.map(sub => ({
    id: sub.id,
    teamId: sub.teamId,
    teamName: sub.team.name,
    title: sub.title,
    problem: sub.problem,
    solution: sub.solution,
    market: sub.market,
    traction: sub.traction,
    teamBios: sub.teamBios,
    deckUrl: sub.deckUrl,
    submittedAt: sub.submittedAt,
    recusedJudgeIds: sub.recusals.map(r => r.judgeId),
    reviews: sub.reviews.map(r => ({
      id: r.id,
      judgeId: r.judgeId,
      submittedAt: r.submittedAt,
      overallComment: r.overallComment,
      scores: r.scores.map(s => ({
        criterionId: s.criterionId,
        value: s.value
      }))
    }))
  }));

  const rankingResult = rankSubmissions(submissionData, criteria, assignedJudgeIds);
  const myEval = rankingResult.all.find(r => r.submissionId === submission.id);

  if (!myEval) notFound();

  // Filter reviews to show Judge feedback safely without exposing Identity
  const submittedReviews = submission.reviews.filter(r => r.submittedAt !== null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full">
      <Link href="/team" className="text-sm text-vault-muted hover:text-vault-navy transition inline-block mb-6">&larr; Back to Dashboard</Link>

      <div className="bg-white p-8 rounded-lg archival-border mb-8 flex justify-between items-center archival-shadow">
        <div>
          <h1 className="text-3xl font-serif text-vault-navy mb-1">{submission.title}</h1>
          <p className="text-vault-muted font-medium">{contest.title}</p>
        </div>

        <div className="flex gap-8 text-right">
          <div>
            <div className="text-xs uppercase tracking-wider text-vault-muted font-medium mb-1">Rank</div>
            <div className="text-3xl font-serif text-vault-copper">
              {myEval.rank ? `#${myEval.rank}` : <span className="text-lg">Provisional</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-vault-muted font-medium mb-1">Total Score</div>
            <div className="text-3xl font-mono text-vault-navy">
              {formatScore(myEval.totalScore)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-xl font-serif text-vault-navy mb-6">Criterion Breakdowns</h2>
          <div className="space-y-4">
            {criteria.map(c => {
              const avg = myEval.criterionAverages[c.id] || 0;
              return (
                <div key={c.id} className="flex justify-between items-center border-b border-vault-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-vault-navy">{c.label}</div>
                    <div className="text-xs text-vault-muted">Weight: {c.weight}%</div>
                  </div>
                  <div className="font-mono text-lg text-vault-ink">
                    {formatScore(avg)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-xl font-serif text-vault-navy mb-6">Judge Feedback</h2>
          <div className="space-y-6">
            {submittedReviews.length === 0 && (
              <p className="text-vault-muted text-sm italic">No feedback provided.</p>
            )}

            {submittedReviews.map(r => {
              // Find the judge label for this specific contest
              const judgeEntry = r.judge.judgeEntries.find(j => j.contestId === contest.id);
              const label = judgeEntry ? judgeEntry.label : 'Judge';

              return (
                <div key={r.id} className="p-4 bg-vault-canvas rounded border border-vault-border">
                  <h3 className="font-medium text-vault-navy mb-3 pb-2 border-b border-vault-border text-sm">
                    {label}
                  </h3>

                  {r.overallComment && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-vault-muted uppercase mb-1">Overall</div>
                      <p className="text-sm text-vault-ink italic whitespace-pre-wrap">{r.overallComment}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {r.scores.filter(s => s.comment).map(s => {
                      const crit = criteria.find(c => c.id === s.criterionId);
                      if (!crit) return null;
                      return (
                        <div key={s.id}>
                          <div className="text-xs font-semibold text-vault-muted uppercase mb-1">{crit.label}</div>
                          <p className="text-sm text-vault-ink whitespace-pre-wrap">{s.comment}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
