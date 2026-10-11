import { ContestStatus } from './lifecycle';

export type Role = "ORGANIZER" | "TEAM" | "JUDGE";

export interface UserContext {
  id: string;
  role: Role;
}

export function hasRole(user: UserContext | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function requireRole(user: UserContext | null, roles: Role[]): void {
  if (!hasRole(user, roles)) {
    throw new Error('Forbidden: insufficient permissions');
  }
}

/**
 * Checks if a judge can review a given submission.
 * - Contest must be in JUDGING state.
 * - Judge must be assigned to the contest.
 * - Judge must not be recused for this submission.
 */
export function canJudgeReview(
  contestStatus: ContestStatus,
  isJudgeAssignedToContest: boolean,
  isRecused: boolean,
): boolean {
  return contestStatus === 'JUDGING' && isJudgeAssignedToContest && !isRecused;
}

/**
 * Checks if a team can edit their submission.
 * - Contest must be OPEN.
 * - Current time must be before the submission deadline (UTC).
 * - User must be the team owner.
 */
export function canTeamEditSubmission(
  contestStatus: ContestStatus,
  submissionDeadline: Date | string,
  now: Date,
  isTeamOwner: boolean
): boolean {
  if (contestStatus !== 'OPEN') return false;
  if (!isTeamOwner) return false;

  const deadline = new Date(submissionDeadline);
  return now < deadline;
}

/**
 * Checks whether the team name and team bios should be hidden from the viewer.
 * - Blind review masks team identity ONLY for Judges.
 * - Organizers always see full details.
 * - Teams always see their own details.
 */
export function shouldApplyBlindReview(
  viewerRole: Role,
  contestBlindReview: boolean
): boolean {
  if (viewerRole === 'JUDGE' && contestBlindReview) {
    return true;
  }
  return false;
}

/**
 * Determines if the public/team leaderboard is visible.
 * - Organizers can always see results (progress board / results).
 * - Judges and Teams can see results only if contest is PUBLISHED.
 * - External (not signed in) can see results if contest is PUBLISHED AND publicLeaderboard is true.
 */
export function canViewLeaderboard(
  viewerRole: Role | null,
  contestStatus: ContestStatus,
  publicLeaderboard: boolean
): boolean {
  if (viewerRole === 'ORGANIZER') return true;

  if (contestStatus !== 'PUBLISHED') return false;

  if (viewerRole === 'TEAM' || viewerRole === 'JUDGE') return true;

  // Unauthenticated visitors
  return publicLeaderboard;
}
