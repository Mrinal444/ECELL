import { prisma, requireUser } from "@/lib/auth";
import { format } from "date-fns";
import { Role, MatchStatus, SessionStatus } from "@prisma/client";
import RequestCard from "./RequestCard";
import SessionRow from "./SessionRow";
import ActiveMatchCard from "./ActiveMatchCard";
import { getBookableSlots } from "@/lib/availability";

interface Result {
  id: string;
  name: string;
  headline: string;
  match: { score: number; reason: string };
}

export default async function SessionsPage() {
  const user = await requireUser();
  const isFounder = user.role === Role.FOUNDER;

  let pendingRequests: any[] = [];
  let acceptedMatches: any[] = [];
  let upcomingSessions: any[] = [];
  let pastSessions: any[] = [];

  const now = new Date();

  if (isFounder && user.founder) {
    const reqs = await prisma.matchRequest.findMany({
      where: { founderId: user.founder.id },
      include: { mentor: { include: { user: true } }, sessions: { orderBy: { startsAt: 'desc' } } }
    });

    pendingRequests = reqs.filter(r => r.status === MatchStatus.PENDING);
    acceptedMatches = reqs.filter(r => r.status === MatchStatus.ACCEPTED);

    const allSessions = await prisma.session.findMany({
      where: { founderId: user.founder.id },
      include: { mentor: { include: { user: true } } },
      orderBy: { startsAt: 'asc' }
    });
    upcomingSessions = allSessions.filter(s => new Date(s.endsAt) > now && s.status !== SessionStatus.CANCELLED);
    pastSessions = allSessions.filter(s => new Date(s.endsAt) <= now || s.status === SessionStatus.CANCELLED);

  } else if (!isFounder && user.mentor) {
    const reqs = await prisma.matchRequest.findMany({
      where: { mentorId: user.mentor.id },
      include: { founder: { include: { user: true } } }
    });

    pendingRequests = reqs.filter(r => r.status === MatchStatus.PENDING);
    acceptedMatches = reqs.filter(r => r.status === MatchStatus.ACCEPTED);

    const allSessions = await prisma.session.findMany({
      where: { mentorId: user.mentor.id },
      include: { founder: { include: { user: true } } },
      orderBy: { startsAt: 'asc' }
    });
    upcomingSessions = allSessions.filter(s => new Date(s.endsAt) > now && s.status !== SessionStatus.CANCELLED);
    pastSessions = allSessions.filter(s => new Date(s.endsAt) <= now || s.status === SessionStatus.CANCELLED);
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto w-full space-y-12">
      {/* Pending Requests */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-[var(--foreground)]/50 italic text-sm">No pending requests.</p>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map(req => {
              const otherParty = isFounder ? req.mentor.user.name : req.founder.user.name;
              return (
                <RequestCard key={req.id} req={req} otherParty={otherParty} isFounder={isFounder} />
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming Sessions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-[var(--foreground)]/50 italic text-sm">No upcoming sessions.</p>
        ) : (
          <div className="grid gap-4">
            {upcomingSessions.map(sess => {
              const otherParty = isFounder ? sess.mentor.user.name : sess.founder.user.name;
              return (
                <SessionRow key={sess.id} session={sess} otherParty={otherParty} isFounder={isFounder} />
              );
            })}
          </div>
        )}
      </section>

      {/* Active Matches (Accepted but no session yet) */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Your Matches</h2>
        <div className="grid gap-4">
          {acceptedMatches.map(req => {
            const hasUpcoming = upcomingSessions.some(s => s.matchRequestId === req.id);
            if (hasUpcoming) return null;

            const otherParty = isFounder ? req.mentor.user.name : req.founder.user.name;
            const mentorId = isFounder ? req.mentorId : req.founderId;
            const isMentor = !isFounder;
            return (
              <ActiveMatchCard
                key={req.id}
                req={req}
                otherParty={otherParty}
                isFounder={isFounder}
                mentorId={mentorId}
                isMentor={isMentor}
              />
            );
          })}
          {acceptedMatches.filter(req => !upcomingSessions.some(s => s.matchRequestId === req.id)).length === 0 && (
            <p className="text-[var(--foreground)]/50 italic text-sm">No active matches without a session yet.</p>
          )}
        </div>
      </section>

      {/* Past Sessions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Past Sessions</h2>
        {pastSessions.length === 0 ? (
          <p className="text-[var(--foreground)]/50 italic text-sm">No past sessions.</p>
        ) : (
          <div className="grid gap-4">
            {pastSessions.map(sess => {
              const otherParty = isFounder ? sess.mentor.user.name : sess.founder.user.name;
              return (
                <SessionRow key={sess.id} session={sess} otherParty={otherParty} isFounder={isFounder} />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}