"use client";

import { useActionState } from "react";
import { updateMatchRequestStatus } from "@/lib/actions/match";
import { MatchStatus } from "@prisma/client";

interface Request {
  id: string;
  score: number;
  reason: string;
  message: string | null;
}

interface Props {
  req: Request;
  otherParty: string;
  isFounder: boolean;
}

export default function RequestCard({ req, otherParty, isFounder }: Props) {
  const [state, formAction] = useActionState<{ error?: string; success?: boolean } | null, FormData>(updateMatchRequestStatus, null);

  return (
    <div key={req.id} className="bg-[var(--background)] border border-[var(--foreground)]/10 p-4 rounded-xl flex items-center justify-between">
      <div>
        <h4 className="font-bold">{otherParty}</h4>
        <p className="text-xs text-[var(--foreground)]/60">Match Score: {req.score}% · {req.reason}</p>
        {req.message && <p className="text-sm mt-2 p-2 bg-[var(--foreground)]/5 rounded italic">"{req.message}"</p>}
      </div>
      {!isFounder ? (
        <div className="flex gap-2 shrink-0 ml-4">
          <form action={formAction}>
            <input type="hidden" name="requestId" value={req.id} />
            <input type="hidden" name="status" value={MatchStatus.DECLINED} />
            {state?.error && <p className="text-red-600 text-xs mb-2">{state.error}</p>}
            <button type="submit" className="px-4 py-2 border border-[var(--foreground)]/20 rounded-md text-sm font-medium hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/20 transition-colors">
              Decline
            </button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="requestId" value={req.id} />
            <input type="hidden" name="status" value={MatchStatus.ACCEPTED} />
            <button type="submit" className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Accept
            </button>
          </form>
        </div>
      ) : (
        <div className="text-sm border border-[var(--foreground)]/10 px-3 py-1 bg-[var(--foreground)]/5 rounded-full text-[var(--foreground)]/60 font-medium">Awaiting response</div>
      )}
    </div>
  );
}