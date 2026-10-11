'use client';

import { useState } from 'react';
import { saveReview } from '@/app/actions/judge';
import { calculateReviewTotal } from '@/lib/domain/scoring';
import { useFormStatus } from 'react-dom';

function SubmitButtons({ isReadOnly, allCriteriaScored }: { isReadOnly: boolean, allCriteriaScored: boolean }) {
  const { pending } = useFormStatus();

  if (isReadOnly) {
    return (
      <div className="p-3 bg-vault-card rounded text-center text-vault-neutral font-medium text-sm border border-vault-border">
        Review Submitted
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <button
        type="submit"
        name="actionType"
        value="DRAFT"
        disabled={pending}
        className="flex-1 bg-white text-vault-navy border border-vault-border px-4 py-3 rounded-md font-medium hover:bg-vault-card transition disabled:opacity-50 text-sm archival-shadow"
      >
        Save Draft
      </button>
      <button
        type="submit"
        name="actionType"
        value="SUBMIT"
        disabled={pending || !allCriteriaScored}
        className="flex-1 bg-vault-copper text-white px-4 py-3 rounded-md font-medium hover:bg-vault-copper-dark transition disabled:opacity-50 text-sm archival-shadow"
      >
        Submit Review
      </button>
    </div>
  );
}

export default function ScoreSheetClient({
  submissionId,
  criteria,
  existingReview,
  isReadOnly
}: {
  submissionId: string;
  criteria: any[];
  existingReview: any;
  isReadOnly: boolean;
}) {
  const getInitialScore = (critId: string) => {
    if (!existingReview) return 0;
    const s = existingReview.scores.find((s: any) => s.criterionId === critId);
    return s ? s.value : 0;
  };

  const getInitialComment = (critId: string) => {
    if (!existingReview) return '';
    const s = existingReview.scores.find((s: any) => s.criterionId === critId);
    return s ? s.comment || '' : '';
  };

  const [scores, setScores] = useState<Record<string, number>>(
    criteria.reduce((acc, c) => ({ ...acc, [c.id]: getInitialScore(c.id) }), {})
  );

  const [comments, setComments] = useState<Record<string, string>>(
    criteria.reduce((acc, c) => ({ ...acc, [c.id]: getInitialComment(c.id) }), {})
  );

  const [overallComment, setOverallComment] = useState(existingReview?.overallComment || '');
  const [error, setError] = useState<string | null>(null);

  const handleScoreChange = (critId: string, val: number) => {
    if (isReadOnly) return;
    setScores(prev => ({ ...prev, [critId]: val }));
  };

  const handleCommentChange = (critId: string, val: string) => {
    if (isReadOnly) return;
    setComments(prev => ({ ...prev, [critId]: val }));
  };

  const allCriteriaScored = criteria.every(c => scores[c.id] > 0);

  // Calculate live total
  const scoreInputs = criteria.map(c => ({
    criterionId: c.id,
    weight: c.weight,
    value: scores[c.id] || 0
  }));
  const currentTotal = calculateReviewTotal(scoreInputs);

  const handleSubmit = async (formData: FormData) => {
    if (isReadOnly) return;
    const actionType = formData.get('actionType') as string;

    const payload = {
      overallComment,
      scores: criteria.map(c => ({
        criterionId: c.id,
        value: scores[c.id] || 0,
        comment: comments[c.id] || ''
      }))
    };

    const res = await saveReview(submissionId, actionType, payload);
    if (res?.error) {
      setError(res.error);
    } else {
      setError(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg archival-border archival-shadow">
      <div className="flex justify-between items-end border-b border-vault-border pb-4 mb-6">
        <h2 className="text-2xl font-serif text-vault-navy">Scoring Sheet</h2>
        <div className="text-right">
          <div className="text-xs text-vault-muted uppercase tracking-wider mb-1">Total Score</div>
          <div className="text-3xl font-mono text-vault-copper font-medium">{currentTotal.toFixed(2)}</div>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-8">
        {criteria.map((c) => (
          <div key={c.id} className="space-y-3 pb-6 border-b border-vault-border last:border-0 last:pb-0">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-vault-navy">{c.label}</h3>
                <p className="text-xs text-vault-muted">{c.description} (Weight: {c.weight}%)</p>
              </div>
              <div className="font-mono text-lg bg-vault-card px-3 py-1 rounded border border-vault-border min-w-[3rem] text-center">
                {scores[c.id] || '-'}
              </div>
            </div>

            <input
              type="range"
              min="0" max="10" step="1"
              value={scores[c.id]}
              onChange={(e) => handleScoreChange(c.id, parseInt(e.target.value))}
              disabled={isReadOnly}
              className="w-full accent-vault-copper"
            />

            <textarea
              placeholder={`Comments on ${c.label}...`}
              value={comments[c.id]}
              onChange={(e) => handleCommentChange(c.id, e.target.value)}
              readOnly={isReadOnly}
              className="w-full px-3 py-2 text-sm border border-vault-border rounded-md resize-none h-20 focus:outline-none focus:border-vault-copper focus:ring-1 focus:ring-vault-copper"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-vault-border">
          <h3 className="font-medium text-vault-navy mb-2">Overall Feedback</h3>
          <textarea
            placeholder="Constructive feedback for the team..."
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            readOnly={isReadOnly}
            className="w-full px-3 py-2 text-sm border border-vault-border rounded-md resize-y h-32 focus:outline-none focus:border-vault-copper focus:ring-1 focus:ring-vault-copper"
          />
        </div>

        {error && (
          <div className="p-3 bg-vault-ruby-faint text-vault-ruby text-sm rounded border border-vault-ruby/20">
            {error}
          </div>
        )}

        <SubmitButtons isReadOnly={isReadOnly} allCriteriaScored={allCriteriaScored} />
      </form>
    </div>
  );
}
