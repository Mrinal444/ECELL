import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { canTransitionToJudging, canTransitionToOpen, validateStateTransition, ContestStatus } from '@/lib/domain/lifecycle';
import RubricEditor from './RubricEditor';
import StatusForm from './StatusForm';

export default async function ContestDetail({ params }: { params: { id: string } }) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contest = await prisma.contest.findUnique({
    where: { id: params.id },
    include: {
      criteria: { orderBy: { position: 'asc' } },
      judges: { include: { user: true } },
      _count: { select: { submissions: true } }
    }
  });

  if (!contest) notFound();

  // Validate Next Steps
  const weightSum = contest.criteria.reduce((sum, c) => sum + c.weight, 0);

  const toOpen = canTransitionToOpen(contest.criteria, contest.submissionDeadline, new Date());
  const toJudging = canTransitionToJudging(contest.judges.length, contest._count.submissions);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full flex gap-8 flex-col lg:flex-row">
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl font-serif text-vault-navy mb-2">{contest.title}</h1>
          <p className="text-vault-muted">{contest.description}</p>
        </div>

        {/* Rubric Editor (Client Component) */}
        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-xl font-serif text-vault-navy mb-4">Rubric</h2>
          <RubricEditor
            contestId={contest.id}
            initialCriteria={contest.criteria}
            isEditable={contest.status === 'DRAFT' || contest.status === 'OPEN'}
          />
        </div>

        {/* Navigation to Progress & Results */}
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/organizer/contest/${contest.id}/progress`} className="bg-white p-4 archival-border rounded-lg archival-shadow flex items-center justify-between hover:bg-vault-card transition">
            <span className="font-medium text-vault-navy">Progress Board</span>
            <span className="text-vault-muted text-sm">&rarr;</span>
          </Link>
          <Link href={`/organizer/contest/${contest.id}/results`} className="bg-white p-4 archival-border rounded-lg archival-shadow flex items-center justify-between hover:bg-vault-card transition">
            <span className="font-medium text-vault-navy">Results & Export</span>
            <span className="text-vault-muted text-sm">&rarr;</span>
          </Link>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-lg font-serif text-vault-navy mb-4">Status</h2>
          <StatusForm
            contestId={contest.id}
            currentStatus={contest.status as ContestStatus}
            toOpenResult={toOpen}
            toJudgingResult={toJudging}
          />
        </div>

        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-lg font-serif text-vault-navy mb-4">Settings</h2>
          <div className="space-y-4 text-sm text-vault-ink">
            <div>
              <span className="text-vault-muted block mb-1">Deadline</span>
              {new Date(contest.submissionDeadline).toLocaleString('en-US', { timeZoneName: 'short' })}
            </div>
            <div>
              <span className="text-vault-muted block mb-1">Blind Review</span>
              {contest.blindReview ? 'Enabled' : 'Disabled'}
            </div>
            <div>
              <span className="text-vault-muted block mb-1">Public Leaderboard</span>
              {contest.publicLeaderboard ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-vault-navy">Judges</h2>
            <span className="text-xs bg-vault-card px-2 py-0.5 rounded border border-vault-border">{contest.judges.length}</span>
          </div>
          <ul className="space-y-3">
            {contest.judges.map(j => (
              <li key={j.id} className="text-sm">
                <span className="font-medium block">{j.label}</span>
                <span className="text-vault-muted text-xs">{j.user.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
