import { describe, it, expect } from 'vitest';
import { calculateReviewTotal, calculateSubmissionTotal, calculateCriterionAverages } from '../src/lib/domain/scoring';

describe('Scoring Logic', () => {
  it('calculates weighted review total correctly', () => {
    const scores = [
      { criterionId: 'c1', weight: 30, value: 8 },  // 0.3 * 8 = 2.4
      { criterionId: 'c2', weight: 30, value: 9 },  // 0.3 * 9 = 2.7
      { criterionId: 'c3', weight: 20, value: 7 },  // 0.2 * 7 = 1.4
      { criterionId: 'c4', weight: 20, value: 10 }, // 0.2 * 10 = 2.0
    ];
    // Total should be 8.5
    expect(calculateReviewTotal(scores)).toBeCloseTo(8.5, 5);
  });

  it('handles empty scores', () => {
    expect(calculateReviewTotal([])).toBe(0);
  });

  it('calculates submission total (mean of review totals)', () => {
    const totals = [8.5, 9.0, 7.5];
    // Mean = 25.0 / 3 = 8.3333333333
    expect(calculateSubmissionTotal(totals)).toBeCloseTo(8.333333333, 5);
  });

  it('calculates criterion averages across reviews', () => {
    const reviews = [
      { scores: [{ criterionId: 'c1', value: 8 }, { criterionId: 'c2', value: 9 }] },
      { scores: [{ criterionId: 'c1', value: 10 }, { criterionId: 'c2', value: 7 }] }
    ];

    const averages = calculateCriterionAverages(reviews);

    expect(averages['c1']).toBe(9); // (8 + 10) / 2
    expect(averages['c2']).toBe(8); // (9 + 7) / 2
  });
});
