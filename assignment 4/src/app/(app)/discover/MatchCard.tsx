"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { createMatchRequest } from "@/lib/actions/match";

interface Match {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  match: { score: number; reason: string };
  skills?: string[];
  needs?: string[];
}

export default function MatchCard({ match, isFounder }: { match: Match; isFounder: boolean }) {
  const [state, formAction] = useActionState<{ error?: string; success?: boolean } | null, FormData>(createMatchRequest, null);

  return (
    <div className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl p-5 hover:border-[var(--accent)] transition-colors flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div>
          <h3 className="font-bold text-lg leading-tight mb-1">{match.name}</h3>
          <p className="text-sm text-[var(--foreground)]/60 line-clamp-2">{match.headline}</p>
        </div>
        <div className="bg-[var(--foreground)]/5 p-2 rounded-lg flex flex-col items-center shrink-0 min-w-16">
          <span className="text-[10px] font-bold text-[var(--foreground)]/50 uppercase tracking-widest mb-1">Match</span>
          <span className="font-bold text-lg text-[var(--accent)] leading-none">{match.match.score}%</span>
        </div>
      </div>

      <p className="text-xs text-[var(--foreground)]/70 italic border-l-2 border-[var(--accent)] pl-2 mb-4 bg-[var(--foreground)]/5 p-2 rounded-r">
        {match.match.reason}
      </p>

      {match.bio && <p className="text-sm mb-4 line-clamp-3 text-[var(--foreground)]/80 flex-1">{match.bio}</p>}

      <div className="flex flex-wrap gap-2 mb-6 mt-auto">
        {(match.skills || match.needs || []).slice(0, 3).map((tag) => (
          <span key={tag} className="text-[10px] uppercase font-bold bg-[var(--foreground)]/5 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
        {(match.skills || match.needs || []).length > 3 && (
          <span className="text-[10px] uppercase font-bold text-[var(--foreground)]/50">+{(match.skills || match.needs || []).length - 3}</span>
        )}
      </div>

      {isFounder ? (
        <form action={formAction}>
          <input type="hidden" name="mentorId" value={match.id} />
          <input type="hidden" name="score" value={match.match.score} />
          <input type="hidden" name="reason" value={match.match.reason} />
          {state?.error && <p className="text-red-600 text-xs mb-2">{state.error}</p>}
          <button type="submit" className="w-full bg-[var(--foreground)] text-[var(--background)] py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Send Request
          </button>
        </form>
      ) : (
        <div className="bg-[var(--accent)]/10 text-[var(--foreground)] p-2 text-center rounded-md text-sm font-medium border border-[var(--accent)]/20">
          Waiting for founder request
        </div>
      )}
    </div>
  );
}