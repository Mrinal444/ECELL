import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatScore } from '@/lib/domain/scoring';
import { rankSubmissions, SubmissionData, CriterionInfo } from '@/lib/domain/ranking';
import DownloadCsvButton from './DownloadCsvButton';

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contest = await prisma.contest.findUnique({
    where: { id: params.id },
    include: {
      criteria: { orderBy: { position: 'asc' } },
      judges: true,
      submissions: {
        include: {
          team: true,
          recusals: true,
          reviews: {
            include: { scores: true }
          }
        }
      }
    }
  });

  if (!contest) notFound();

  // Map to SubmissionData for Ranking engine
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
    anonymizedBios: sub.anonymizedBios,
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
        value: s.value,
        comment: s.comment
      }))
    }))
  }));

  const rankingResult = rankSubmissions(submissionData, criteria, assignedJudgeIds);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/organizer/contest/${contest.id}`} className="text-sm text-vault-muted hover:text-vault-navy transition">
            &larr; Back to Contest
          </Link>
          <h1 className="text-3xl font-serif text-vault-navy mt-4">Results</h1>
        </div>
        <div>
          <DownloadCsvButton contestId={contest.id} />
        </div>
      </div>

      <div className="bg-white rounded-lg archival-border archival-shadow overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-vault-card border-b border-vault-border text-vault-navy">
            <tr>
              <th className="px-6 py-4 font-medium text-xs uppercase w-16">Rank</th>
              <th className="px-6 py-4 font-medium text-xs uppercase">Team</th>
              <th className="px-6 py-4 font-medium text-xs uppercase text-right border-x border-vault-border">Total Score</th>
              {criteria.map(c => (
                <th key={c.id} className="px-6 py-4 font-medium text-xs uppercase text-right border-r border-vault-border" title={c.label}>
                  <div className="truncate w-24 ml-auto text-vault-muted">{c.label} ({c.weight}%)</div>
                </th>
              ))}
              <th className="px-6 py-4 font-medium text-xs uppercase">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vault-border text-vault-ink">
            {rankingResult.all.map((sub, index) => {
              return (
                <tr key={sub.submissionId} className={`hover:bg-vault-canvas/50 ${sub.isProvisional ? 'opacity-70 bg-vault-card/30' : ''}`}>
                  <td className="px-6 py-4 font-serif text-lg font-medium text-vault-copper text-center">
                    {sub.rank ? sub.rank : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-vault-navy">{sub.teamName}</div>
                    <div className="text-xs text-vault-muted mt-1">{sub.title}</div>
                    <div className="text-xs mt-2">
                       <Link href={`/organizer/contest/${contest.id}/submissions/${sub.submissionId}/anonymize`} className="text-vault-copper hover:underline font-medium">Anonymize Bios &rarr;</Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-vault-navy border-x border-vault-border">
                    {formatScore(sub.totalScore)}
                  </td>
                  {criteria.map(c => (
                    <td key={c.id} className="px-6 py-4 text-right font-mono text-vault-muted border-r border-vault-border">
                      {formatScore(sub.criterionAverages[c.id] || 0)}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    {sub.isProvisional ? (
                      <span className="px-2 py-1 bg-vault-ruby-faint text-vault-ruby text-xs rounded border border-vault-ruby/20">
                        Provisional ({sub.submittedReviewsCount}/{sub.expectedReviewersCount})
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-vault-emerald-faint text-vault-emerald text-xs rounded border border-vault-emerald/20">
                        Complete ({sub.submittedReviewsCount}/{sub.expectedReviewersCount})
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}

            {rankingResult.all.length === 0 && (
              <tr>
                <td colSpan={criteria.length + 4} className="px-6 py-8 text-center text-vault-muted italic">
                  No submissions evaluated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
