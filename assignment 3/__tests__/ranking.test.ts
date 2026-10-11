import { describe, it, expect } from 'vitest';
import { rankSubmissions, CriterionInfo, SubmissionData } from '../src/lib/domain/ranking';

describe('Ranking Logic', () => {
  const criteria: CriterionInfo[] = [
    { id: 'c1', label: 'Problem', weight: 40, position: 0 },
    { id: 'c2', label: 'Solution', weight: 40, position: 1 },
    { id: 'c3', label: 'Team', weight: 20, position: 2 },
  ];

  const assignedJudges = ['j1', 'j2', 'j3'];

  it('separates complete vs provisional, ranks complete normally', () => {
    const submissions: SubmissionData[] = [
      {
        id: 's1', teamId: 't1', teamName: 'A', title: 'A', problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
        recusedJudgeIds: [],
        reviews: [
          { id: 'r1', judgeId: 'j1', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 8 }, { criterionId: 'c2', value: 8 }, { criterionId: 'c3', value: 8 }] },
          { id: 'r2', judgeId: 'j2', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 8 }, { criterionId: 'c2', value: 8 }, { criterionId: 'c3', value: 8 }] },
          { id: 'r3', judgeId: 'j3', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 8 }, { criterionId: 'c2', value: 8 }, { criterionId: 'c3', value: 8 }] },
        ]
      }, // Complete, Total = 8.0
      {
        id: 's2', teamId: 't2', teamName: 'B', title: 'B', problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
        recusedJudgeIds: [],
        reviews: [
          { id: 'r4', judgeId: 'j1', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 9 }, { criterionId: 'c2', value: 9 }, { criterionId: 'c3', value: 9 }] },
          { id: 'r5', judgeId: 'j2', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 9 }, { criterionId: 'c2', value: 9 }, { criterionId: 'c3', value: 9 }] },
        ]
      }, // Provisional (missing j3 review), Total = 9.0
      {
        id: 's3', teamId: 't3', teamName: 'C', title: 'C', problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
        recusedJudgeIds: ['j3'], // Recused from j3
        reviews: [
          { id: 'r6', judgeId: 'j1', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 7 }, { criterionId: 'c2', value: 7 }, { criterionId: 'c3', value: 7 }] },
          { id: 'r7', judgeId: 'j2', submittedAt: new Date(), scores: [{ criterionId: 'c1', value: 7 }, { criterionId: 'c2', value: 7 }, { criterionId: 'c3', value: 7 }] },
        ]
      }, // Complete (j3 is recused so expected=2, submitted=2), Total = 7.0
    ];

    const result = rankSubmissions(submissions, criteria, assignedJudges);

    expect(result.ranked.length).toBe(2);
    expect(result.provisional.length).toBe(1);

    expect(result.ranked[0].submissionId).toBe('s1');
    expect(result.ranked[0].rank).toBe(1);
    expect(result.ranked[0].totalScore).toBeCloseTo(8.0, 5);
    expect(result.ranked[0].isProvisional).toBe(false);

    expect(result.ranked[1].submissionId).toBe('s3');
    expect(result.ranked[1].rank).toBe(2);
    expect(result.ranked[1].totalScore).toBeCloseTo(7.0, 5);

    expect(result.provisional[0].submissionId).toBe('s2');
    expect(result.provisional[0].rank).toBeNull();
    expect(result.provisional[0].isProvisional).toBe(true);
  });

  it('handles standard competition ranking (1, 1, 3)', () => {
    // 3 submissions with EXACT same score (say 8.0)
    // plus one with 7.0
    const submissions = Array.from({ length: 4 }).map((_, i) => ({
      id: `s${i}`, teamId: `t${i}`, teamName: `T${i}`, title: `T${i}`, problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
      recusedJudgeIds: ['j2', 'j3'],
      reviews: [
        { id: `r${i}`, judgeId: 'j1', submittedAt: new Date(), scores: [
          { criterionId: 'c1', value: i === 3 ? 7 : 8 }, // index 3 gets 7, others get 8
          { criterionId: 'c2', value: i === 3 ? 7 : 8 },
          { criterionId: 'c3', value: i === 3 ? 7 : 8 },
        ]}
      ]
    }));

    const result = rankSubmissions(submissions, criteria, assignedJudges);
    expect(result.ranked[0].rank).toBe(1);
    expect(result.ranked[1].rank).toBe(1);
    expect(result.ranked[2].rank).toBe(1);
    expect(result.ranked[3].rank).toBe(4); // the one with 7.0
  });

  it('breaks ties using highest-weight criterion average', () => {
    // Both total 8.0.
    // Sub A: C1 = 9, C2 = 7 (C1 is 40%, 3.6 + 2.8 + 1.6 = 8.0)
    // Sub B: C1 = 7, C2 = 9 (C2 is 40%)
    // C1 and C2 both have weight 40. The sort algorithm sorts criteria by weight desc, then position asc.
    // So C1 is checked first because position 0 < position 1.
    // Sub A C1 avg = 9, Sub B C1 avg = 7. Sub A wins tiebreak.

    const submissions: SubmissionData[] = [
      {
        id: 'sA', teamId: 'tA', teamName: 'A', title: 'A', problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
        recusedJudgeIds: ['j2', 'j3'],
        reviews: [
          { id: 'rA', judgeId: 'j1', submittedAt: new Date(), scores: [
            { criterionId: 'c1', value: 9 }, // 3.6
            { criterionId: 'c2', value: 7 }, // 2.8
            { criterionId: 'c3', value: 8 }, // 1.6 => Total 8.0
          ]}
        ]
      },
      {
        id: 'sB', teamId: 'tB', teamName: 'B', title: 'B', problem: '', solution: '', market: '', traction: '', teamBios: '', deckUrl: '', submittedAt: new Date(),
        recusedJudgeIds: ['j2', 'j3'],
        reviews: [
          { id: 'rB', judgeId: 'j1', submittedAt: new Date(), scores: [
            { criterionId: 'c1', value: 7 }, // 2.8
            { criterionId: 'c2', value: 9 }, // 3.6
            { criterionId: 'c3', value: 8 }, // 1.6 => Total 8.0
          ]}
        ]
      }
    ];

    const result = rankSubmissions(submissions, criteria, assignedJudges);
    expect(result.ranked[0].submissionId).toBe('sA');
    expect(result.ranked[0].rank).toBe(1);
    expect(result.ranked[1].submissionId).toBe('sB');
    expect(result.ranked[1].rank).toBe(2);
  });
});
