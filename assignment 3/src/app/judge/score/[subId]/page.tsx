import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole, canJudgeReview, shouldApplyBlindReview } from '@/lib/domain/policy';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import ScoreSheetClient from './ScoreSheetClient';
import { ContestStatus } from '@/lib/domain/lifecycle';

export default async function ScoreSubmissionPage({ params }: { params: { subId: string } }) {
  const session = await requireAuth();
  requireRole(session, ['JUDGE']);

  const submission = await prisma.submission.findUnique({
    where: { id: params.subId },
    include: {
      team: true,
      contest: {
        include: {
          criteria: { orderBy: { position: 'asc' } },
          judges: { where: { userId: session.id } },
        }
      },
      recusals: { where: { judgeId: session.id } },
      reviews: { where: { judgeId: session.id }, include: { scores: true } }
    }
  });

  if (!submission) notFound();

  const contest = submission.contest;
  const isAssigned = contest.judges.length > 0;
  const isRecused = submission.recusals.length > 0;

  // Judges can only REVIEW during JUDGING (or view during PUBLISHED)
  if (contest.status === 'DRAFT' || contest.status === 'OPEN') {
    return (
      <div className="p-8 text-center text-vault-ruby bg-vault-ruby-faint max-w-xl mx-auto rounded mt-12 border border-vault-ruby/20">
        This contest is not yet in the JUDGING phase.
      </div>
    );
  }

  if (!isAssigned) {
    return (
      <div className="p-8 text-center text-vault-ruby bg-vault-ruby-faint max-w-xl mx-auto rounded mt-12 border border-vault-ruby/20">
        You are not assigned to this contest.
      </div>
    );
  }

  if (isRecused) {
    return (
      <div className="p-8 text-center text-vault-ruby bg-vault-ruby-faint max-w-xl mx-auto rounded mt-12 border border-vault-ruby/20">
        You are recused from reviewing this submission.
      </div>
    );
  }

  const review = submission.reviews[0] || null;
  const isReadOnly = (review && review.submittedAt !== null) || contest.status === 'PUBLISHED';
  const applyBlind = shouldApplyBlindReview(session.role as any, contest.blindReview);

  const teamBiosDisplay = applyBlind
    ? (submission.anonymizedBios || 'not provided')
    : submission.teamBios;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-1/2 space-y-6">
        <div>
          <Link href="/judge" className="text-sm text-vault-muted hover:text-vault-navy transition mb-4 inline-block">
            &larr; Back to Queue
          </Link>
          <h1 className="text-3xl font-serif text-vault-navy mt-2">{submission.title}</h1>
          {!applyBlind && (
            <p className="text-vault-muted mt-2">Team: {submission.team.name}</p>
          )}
        </div>

        <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-lg font-serif mb-3 text-vault-navy">Problem</h2>
          <p className="text-sm text-vault-ink whitespace-pre-wrap leading-relaxed">{submission.problem}</p>
        </section>

        <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-lg font-serif mb-3 text-vault-navy">Solution</h2>
          <p className="text-sm text-vault-ink whitespace-pre-wrap leading-relaxed">{submission.solution}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
            <h2 className="text-lg font-serif mb-3 text-vault-navy">Market</h2>
            <p className="text-sm text-vault-ink whitespace-pre-wrap leading-relaxed">{submission.market}</p>
          </section>

          <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
            <h2 className="text-lg font-serif mb-3 text-vault-navy">Traction</h2>
            <p className="text-sm text-vault-ink whitespace-pre-wrap leading-relaxed">{submission.traction}</p>
          </section>
        </div>

        <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
          <h2 className="text-lg font-serif mb-3 text-vault-navy">Team Bios {applyBlind && <span className="text-xs bg-vault-card px-2 py-1 rounded ml-2 text-vault-muted font-sans font-medium uppercase border border-vault-border">Anonymized</span>}</h2>
          <p className="text-sm text-vault-ink whitespace-pre-wrap leading-relaxed italic">{teamBiosDisplay}</p>
        </section>

        {submission.deckUrl && (
          <section className="bg-white p-6 rounded-lg archival-border archival-shadow">
            <h2 className="text-lg font-serif mb-3 text-vault-navy">Pitch Deck</h2>
            <a href={submission.deckUrl} target="_blank" rel="noreferrer" className="text-vault-copper hover:underline text-sm font-medium">
              View External Pitch Deck &rarr;
            </a>
            {applyBlind && (
              <p className="text-xs text-vault-ruby mt-2 bg-vault-ruby-faint p-2 rounded inline-block border border-vault-ruby/20">
                Warning: External deck may identify the team.
              </p>
            )}
          </section>
        )}
      </div>

      <div className="w-full lg:w-1/2 lg:sticky lg:top-24">
        <ScoreSheetClient
          submissionId={submission.id}
          criteria={contest.criteria}
          existingReview={review}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
}
