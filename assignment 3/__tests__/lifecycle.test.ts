import { describe, it, expect } from 'vitest';
import { canTransitionToOpen, canTransitionToJudging, canTransitionToPublished } from '../src/lib/domain/lifecycle';

describe('Lifecycle Logic', () => {
  it('DRAFT -> OPEN', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    expect(canTransitionToOpen([], futureDate, new Date()).success).toBe(false);
    expect(canTransitionToOpen([{ weight: 90 }], futureDate, new Date()).success).toBe(false);

    // valid
    expect(canTransitionToOpen([{ weight: 50 }, { weight: 50 }], futureDate, new Date()).success).toBe(true);

    // past deadline
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    expect(canTransitionToOpen([{ weight: 100 }], pastDate, new Date()).success).toBe(false);
  });

  it('OPEN -> JUDGING', () => {
    expect(canTransitionToJudging(0, 1).success).toBe(false);
    expect(canTransitionToJudging(1, 0).success).toBe(false);
    expect(canTransitionToJudging(1, 1).success).toBe(true);
  });

  it('JUDGING -> PUBLISHED', () => {
    expect(canTransitionToPublished(false, false).success).toBe(false);
    expect(canTransitionToPublished(false, true).success).toBe(true);
    expect(canTransitionToPublished(true, false).success).toBe(true);
  });
});
