export type ContestStatus = "DRAFT" | "OPEN" | "JUDGING" | "PUBLISHED";

export interface LifecycleTransitionResult {
  success: boolean;
  reason?: string;
}

export function canTransitionToOpen(
  criteria: Array<{ weight: number }>,
  submissionDeadline: Date | string,
  now: Date
): LifecycleTransitionResult {
  if (!criteria || criteria.length === 0) {
    return { success: false, reason: "At least 1 criterion is required." };
  }

  const weightSum = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (weightSum !== 100) {
    return { success: false, reason: `Weights must total exactly 100%. Currently: ${weightSum}%` };
  }

  const deadline = new Date(submissionDeadline);
  if (deadline <= now) {
    return { success: false, reason: "Submission deadline must be in the future." };
  }

  return { success: true };
}

export function canTransitionToJudging(
  judgesCount: number,
  submissionsCount: number
): LifecycleTransitionResult {
  if (judgesCount < 1) {
    return { success: false, reason: "At least 1 judge must be assigned." };
  }
  if (submissionsCount < 1) {
    return { success: false, reason: "At least 1 submission is required." };
  }

  return { success: true };
}

export function canTransitionToPublished(
  submissionsComplete: boolean,
  provisionalOverride: boolean
): LifecycleTransitionResult {
  if (!submissionsComplete && !provisionalOverride) {
    return {
      success: false,
      reason: "All expected reviews must be submitted, or explicit organizer override is required."
    };
  }

  return { success: true };
}

export function validateStateTransition(
  currentStatus: ContestStatus,
  targetStatus: ContestStatus
): LifecycleTransitionResult {
  // Enforce forward-only flow
  const flow: Record<ContestStatus, number> = {
    DRAFT: 0,
    OPEN: 1,
    JUDGING: 2,
    PUBLISHED: 3,
  };

  const currentIdx = flow[currentStatus];
  const targetIdx = flow[targetStatus];

  if (targetIdx === undefined || currentIdx === undefined) {
    return { success: false, reason: "Invalid status value." };
  }

  if (targetIdx <= currentIdx) {
    return { success: false, reason: "Contest lifecycle is forward-only. Cannot reopen or downgrade status." };
  }

  if (targetIdx !== currentIdx + 1) {
    return { success: false, reason: "Must follow strict lifecycle order (DRAFT -> OPEN -> JUDGING -> PUBLISHED)." };
  }

  return { success: true };
}
