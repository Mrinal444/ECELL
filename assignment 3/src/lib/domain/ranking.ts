import { calculateReviewTotal, calculateSubmissionTotal, calculateCriterionAverages } from './scoring';

export interface CriterionInfo {
  id: string;
  label: string;
  weight: number;
  position: number;
}

export interface ReviewData {
  id: string;
  judgeId: string;
  submittedAt: Date | string | null;
  overallComment?: string | null;
  scores: Array<{
    criterionId: string;
    value: number;
    comment?: string | null;
  }>;
}

export interface SubmissionData {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  problem: string;
  solution: string;
  market: string;
  traction: string;
  teamBios: string;
  anonymizedBios?: string | null;
  deckUrl: string;
  submittedAt: Date | string;
  reviews: ReviewData[];
  recusedJudgeIds: string[]; // Judges recused for this submission
}

export interface SubmissionEvaluation {
  submissionId: string;
  teamId: string;
  teamName: string;
  title: string;
  isComplete: boolean;
  expectedReviewersCount: number;
  submittedReviewsCount: number;
  totalScore: number; // full precision
  criterionAverages: Record<string, number>;
  reviews: Array<{
    judgeId: string;
    judgeLabel?: string;
    reviewTotal: number;
    overallComment?: string | null;
    scores: Array<{
      criterionId: string;
      value: number;
      comment?: string | null;
    }>;
  }>;
  rank: number | null; // null if provisional
  isProvisional: boolean;
}

export interface RankingResult {
  ranked: SubmissionEvaluation[];
  provisional: SubmissionEvaluation[];
  all: SubmissionEvaluation[];
}

/**
 * Calculates submission completion status, totals, and ranks according to PitchVault rules.
 *
 * @param submissions List of submissions with their reviews and recused judge IDs
 * @param criteria List of criteria with weights
 * @param assignedJudgeIds List of all judge user IDs assigned to the contest
 */
export function rankSubmissions(
  submissions: SubmissionData[],
  criteria: CriterionInfo[],
  assignedJudgeIds: string[]
): RankingResult {
  // Sort criteria to find highest weight criterion for tiebreaking
  const sortedCriteriaByWeight = [...criteria].sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.position - b.position;
  });

  const evaluations: SubmissionEvaluation[] = submissions.map((sub) => {
    const nonRecusedJudges = assignedJudgeIds.filter(
      (jId) => !sub.recusedJudgeIds.includes(jId)
    );
    const expectedCount = nonRecusedJudges.length;

    // Filter to submitted reviews only (drafts do not count)
    const validSubmittedReviews = sub.reviews.filter(
      (r) => r.submittedAt !== null && nonRecusedJudges.includes(r.judgeId)
    );
    const submittedCount = validSubmittedReviews.length;

    const isComplete = expectedCount > 0 && submittedCount === expectedCount;

    // Calculate each review's weighted total
    const reviewDetails = validSubmittedReviews.map((r) => {
      const scoreInputs = r.scores.map((s) => {
        const crit = criteria.find((c) => c.id === s.criterionId);
        return {
          criterionId: s.criterionId,
          weight: crit ? crit.weight : 0,
          value: s.value,
        };
      });

      return {
        judgeId: r.judgeId,
        reviewTotal: calculateReviewTotal(scoreInputs),
        overallComment: r.overallComment,
        scores: r.scores,
      };
    });

    const reviewTotals = reviewDetails.map((r) => r.reviewTotal);
    const totalScore = calculateSubmissionTotal(reviewTotals);
    const criterionAverages = calculateCriterionAverages(validSubmittedReviews);

    return {
      submissionId: sub.id,
      teamId: sub.teamId,
      teamName: sub.teamName,
      title: sub.title,
      isComplete,
      expectedReviewersCount: expectedCount,
      submittedReviewsCount: submittedCount,
      totalScore,
      criterionAverages,
      reviews: reviewDetails,
      rank: null,
      isProvisional: !isComplete,
    };
  });

  // Separate complete vs provisional
  const complete = evaluations.filter((e) => e.isComplete);
  const provisional = evaluations.filter((e) => !e.isComplete);

  // Sort complete submissions:
  // 1. Primary: totalScore descending (full precision)
  // 2. Secondary (Tiebreak): highest-weight criterion average descending
  // 3. Subsequent tiebreaks: next highest-weight criteria in order
  complete.sort((a, b) => {
    // Primary score check (difference > epsilon for float safety)
    const scoreDiff = b.totalScore - a.totalScore;
    if (Math.abs(scoreDiff) > 1e-9) {
      return scoreDiff;
    }

    // Tiebreaker: iterate through sorted criteria by weight
    for (const crit of sortedCriteriaByWeight) {
      const aCritAvg = a.criterionAverages[crit.id] || 0;
      const bCritAvg = b.criterionAverages[crit.id] || 0;
      const critDiff = bCritAvg - aCritAvg;
      if (Math.abs(critDiff) > 1e-9) {
        return critDiff;
      }
    }

    return 0; // Pure tie
  });

  // Assign Standard Competition Ranking (1, 1, 3)
  let currentRank = 1;
  for (let i = 0; i < complete.length; i++) {
    if (i === 0) {
      complete[i].rank = 1;
    } else {
      const prev = complete[i - 1];
      const curr = complete[i];

      // Check if curr is completely tied with prev
      const isScoreTied = Math.abs(curr.totalScore - prev.totalScore) <= 1e-9;
      let isTiebreakTied = true;
      for (const crit of sortedCriteriaByWeight) {
        const prevCrit = prev.criterionAverages[crit.id] || 0;
        const currCrit = curr.criterionAverages[crit.id] || 0;
        if (Math.abs(currCrit - prevCrit) > 1e-9) {
          isTiebreakTied = false;
          break;
        }
      }

      if (isScoreTied && isTiebreakTied) {
        curr.rank = prev.rank;
      } else {
        curr.rank = i + 1; // Standard competition rank (1, 1, 3...)
      }
    }
  }

  // Sort provisional by total score descending for orderly display
  provisional.sort((a, b) => b.totalScore - a.totalScore);

  return {
    ranked: complete,
    provisional,
    all: [...complete, ...provisional],
  };
}
