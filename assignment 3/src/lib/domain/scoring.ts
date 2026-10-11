export interface CriterionScoreInput {
  criterionId: string;
  weight: number; // e.g. 30 for 30%
  value: number;  // 1 - 10
}

/**
 * Calculates the weighted total score for a single review.
 * Formula: sum( (weight / 100) * score_value )
 * Output scale: 1.00 to 10.00
 */
export function calculateReviewTotal(scores: CriterionScoreInput[]): number {
  if (!scores || scores.length === 0) return 0;

  const total = scores.reduce((sum, item) => {
    return sum + (item.weight / 100) * item.value;
  }, 0);

  return total;
}

/**
 * Calculates the overall submission total as the arithmetic mean of all submitted review totals.
 */
export function calculateSubmissionTotal(reviewTotals: number[]): number {
  if (!reviewTotals || reviewTotals.length === 0) return 0;

  const sum = reviewTotals.reduce((acc, curr) => acc + curr, 0);
  return sum / reviewTotals.length;
}

/**
 * Calculates the average score for each criterion across all submitted reviews.
 */
export function calculateCriterionAverages(
  reviews: Array<{ scores: Array<{ criterionId: string; value: number }> }>
): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {};

  for (const review of reviews) {
    for (const s of review.scores) {
      if (!totals[s.criterionId]) {
        totals[s.criterionId] = { sum: 0, count: 0 };
      }
      totals[s.criterionId].sum += s.value;
      totals[s.criterionId].count += 1;
    }
  }

  const averages: Record<string, number> = {};
  for (const [criterionId, data] of Object.entries(totals)) {
    averages[criterionId] = data.count > 0 ? data.sum / data.count : 0;
  }

  return averages;
}

/**
 * Formats a numeric score to 2 decimal places for display.
 */
export function formatScore(score: number): string {
  if (isNaN(score) || score === null || score === undefined) return "0.00";
  return Number(score).toFixed(2);
}
