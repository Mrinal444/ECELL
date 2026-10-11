'use client';

import { updateContestStatus } from '@/app/actions/organizer';
import { useFormStatus } from 'react-dom';
import { ContestStatus } from '@/lib/domain/lifecycle';

function SubmitButton({ label, disabled, reason }: { label: string, disabled: boolean, reason?: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="relative group w-full">
      <button
        type="submit"
        disabled={pending || disabled}
        className="w-full bg-vault-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-vault-ink transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Processing...' : label}
      </button>
      {disabled && reason && (
        <div className="absolute hidden group-hover:block z-10 w-full mb-2 bottom-full left-0 bg-vault-ink text-white text-xs p-2 rounded shadow-lg">
          {reason}
        </div>
      )}
    </div>
  );
}

export default function StatusForm({
  contestId,
  currentStatus,
  toOpenResult,
  toJudgingResult,
}: {
  contestId: string;
  currentStatus: ContestStatus;
  toOpenResult: { success: boolean; reason?: string };
  toJudgingResult: { success: boolean; reason?: string };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-vault-muted">Current:</span>
        <span className="text-sm font-mono font-medium px-2 py-1 bg-vault-card rounded border border-vault-border">
          {currentStatus}
        </span>
      </div>

      <div className="space-y-2">
        {currentStatus === 'DRAFT' && (
          <form action={updateContestStatus.bind(null, contestId, 'OPEN') as unknown as (payload: FormData) => void}>
            <SubmitButton
              label="Open Submissions"
              disabled={!toOpenResult.success}
              reason={toOpenResult.reason}
            />
          </form>
        )}

        {currentStatus === 'OPEN' && (
          <form action={updateContestStatus.bind(null, contestId, 'JUDGING') as unknown as (payload: FormData) => void}>
            <SubmitButton
              label="Start Judging"
              disabled={!toJudgingResult.success}
              reason={toJudgingResult.reason}
            />
          </form>
        )}

        {currentStatus === 'JUDGING' && (
          <form action={updateContestStatus.bind(null, contestId, 'PUBLISHED') as unknown as (payload: FormData) => void}>
            <SubmitButton
              label="Publish Results (Override)"
              disabled={false}
              reason={"This will force-publish even if provisional."}
            />
          </form>
        )}

        {currentStatus === 'PUBLISHED' && (
          <p className="text-sm text-vault-emerald p-3 bg-vault-emerald-faint rounded border border-vault-emerald/20 text-center">
            Results Published
          </p>
        )}
      </div>
    </div>
  );
}
