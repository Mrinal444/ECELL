import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { rankSubmissions, SubmissionData, CriterionInfo } from '@/lib/domain/ranking';
import { generateCsv } from '@/lib/domain/csv';
import { formatScore } from '@/lib/domain/scoring';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return new NextResponse('Unauthorized', { status: 401 });
    requireRole(session, ['ORGANIZER']);

    const contestId = params.id;
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
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
    });

    if (!contest) return new NextResponse('Not found', { status: 404 });

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

    const ranking = rankSubmissions(submissionData, criteria, assignedJudgeIds);

    // Columns: rank, team, title, total, one column per criterion, review count, status
    const headers = [
      'Rank',
      'Team',
      'Title',
      'Total Score',
      ...criteria.map(c => `${c.label} (${c.weight}%)`),
      'Review Count',
      'Status'
    ];

    const rows = ranking.all.map(sub => [
      sub.rank || 'Provisional',
      sub.teamName,
      sub.title,
      formatScore(sub.totalScore),
      ...criteria.map(c => formatScore(sub.criterionAverages[c.id] || 0)),
      `${sub.submittedReviewsCount}/${sub.expectedReviewersCount}`,
      sub.isProvisional ? 'Provisional' : 'Complete'
    ]);

    const csvContent = generateCsv(headers, rows);

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contest-${contestId}-results.csv"`
      }
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
