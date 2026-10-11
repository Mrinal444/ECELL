"use client";

import { useState } from "react";
import { useActionState } from "react";
import { format } from "date-fns";
import { Role, SessionStatus } from "@prisma/client";
import { confirmSession, cancelSession, completeSession, addFounderNotes, addMentorNotes } from "@/lib/actions/sessions";

interface Session {
  id: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  topic: string;
  founderNotes: string | null;
  mentorNotes: string | null;
  cancelledBy: string | null;
}

interface Props {
  session: Session;
  otherParty: string;
  isFounder: boolean;
}

interface ActionState {
  error?: string;
  success?: boolean;
}

export default function SessionRow({ session, otherParty, isFounder }: Props) {
  const [confirmState, confirmAction] = useActionState<ActionState | null, FormData>(confirmSession, null);
  const [cancelState, cancelAction] = useActionState<ActionState | null, FormData>(cancelSession, null);
  const [completeState, completeAction] = useActionState<ActionState | null, FormData>(completeSession, null);
  const [notesState, notesAction] = useActionState<ActionState | null, FormData>(isFounder ? addFounderNotes : addMentorNotes, null);
  const [notes, setNotes] = useState(isFounder ? (session.founderNotes || "") : (session.mentorNotes || ""));
  const [showNotes, setShowNotes] = useState(false);

  const isPast = new Date(session.endsAt) <= new Date();
  const canComplete = session.status === SessionStatus.CONFIRMED && isPast;
  const canEditNotes = session.status === SessionStatus.COMPLETED;

  return (
    <div className="border-l-4 border-[var(--accent)] bg-[var(--background)] shadow-sm border-y border-r border-[var(--foreground)]/10 p-4 rounded-r-xl space-y-3">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg">{session.topic}</h4>
        <span className="text-[10px] uppercase tracking-widest font-bold bg-[var(--foreground)]/10 px-2 py-1 rounded">
          {session.status}
        </span>
      </div>
      <p className="text-sm mb-1">With <span className="font-medium">{otherParty}</span></p>
      {session.cancelledBy && (
        <p className="text-xs text-[var(--foreground)]/50 italic">Cancelled by {session.cancelledBy}</p>
      )}

      <div className="flex items-center gap-4 text-sm font-medium bg-[var(--foreground)]/5 w-fit px-3 py-1.5 rounded-md">
        <span>{format(new Date(session.startsAt), "MMM d, yyyy")}</span>
        <span className="text-[var(--foreground)]/30">|</span>
        <span>{format(new Date(session.startsAt), "h:mm a")} - {format(new Date(session.endsAt), "h:mm a")}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {session.status === SessionStatus.REQUESTED && !isFounder && (
          <form action={confirmAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            {confirmState?.error && <p className="text-red-600 text-xs">{confirmState.error}</p>}
            <button type="submit" className="px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-md text-xs font-medium hover:opacity-90">Confirm</button>
          </form>
        )}
        {session.status !== SessionStatus.COMPLETED && session.status !== SessionStatus.CANCELLED && (
          <form action={cancelAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            {cancelState?.error && <p className="text-red-600 text-xs">{cancelState.error}</p>}
            <button type="submit" className="px-3 py-1.5 border border-[var(--foreground)]/20 rounded-md text-xs font-medium hover:bg-red-500/10 hover:text-red-600">Cancel</button>
          </form>
        )}
        {canComplete && (
          <form action={completeAction}>
            <input type="hidden" name="sessionId" value={session.id} />
            {completeState?.error && <p className="text-red-600 text-xs">{completeState.error}</p>}
            <button type="submit" className="px-3 py-1.5 bg-[var(--accent)] text-[var(--background)] rounded-md text-xs font-medium hover:opacity-90">Mark Complete</button>
          </form>
        )}
      </div>

      {canEditNotes && (
        showNotes ? (
          <form action={notesAction} className="space-y-2">
            <input type="hidden" name="sessionId" value={session.id} />
            <textarea
              name="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isFounder ? "Your private notes..." : "Your private notes..."}
              className="w-full border p-2 rounded-md bg-transparent text-sm"
              rows={3}
            />
            {notesState?.error && <p className="text-red-600 text-xs">{notesState.error}</p>}
            {notesState?.success && <p className="text-green-600 text-xs">Notes saved.</p>}
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded-md text-xs font-medium">Save Notes</button>
              <button type="button" onClick={() => setShowNotes(false)} className="px-3 py-1.5 border border-[var(--foreground)]/20 rounded-md text-xs font-medium">Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowNotes(true)} className="text-xs text-[var(--accent)] font-medium hover:underline">
            {isFounder ? (session.founderNotes ? "Edit notes" : "Add notes") : (session.mentorNotes ? "Edit notes" : "Add notes")}
          </button>
        )
      )}
    </div>
  );
}