'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { revalidatePath } from 'next/cache';
import { ContestStatus, validateStateTransition, canTransitionToOpen, canTransitionToJudging } from '@/lib/domain/lifecycle';

export async function updateRubric(contestId: string, criteriaData: any[]) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest || (contest.status !== 'DRAFT' && contest.status !== 'OPEN')) {
    return { error: 'Rubric can only be edited in DRAFT or OPEN.' };
  }

  const total = criteriaData.reduce((s, c) => s + Number(c.weight), 0);
  if (total !== 100) return { error: `Weights total ${total}, must be exactly 100.` };

  await prisma.$transaction(async (tx) => {
    await tx.criterion.deleteMany({ where: { contestId } });

    for (let i = 0; i < criteriaData.length; i++) {
      const c = criteriaData[i];
      await tx.criterion.create({
        data: {
          contestId,
          label: c.label,
          description: c.description,
          weight: Number(c.weight),
          position: i,
        }
      });
    }
  });

  revalidatePath(`/organizer/contest/${contestId}`);
  return { success: true };
}

export async function updateContestStatus(contestId: string, targetStatus: ContestStatus) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { criteria: true, judges: true, _count: { select: { submissions: true } } }
  });
  if (!contest) return { error: 'Not found' };

  const validation = validateStateTransition(contest.status as ContestStatus, targetStatus);
  if (!validation.success) return { error: validation.reason };

  if (targetStatus === 'OPEN') {
    const toOpen = canTransitionToOpen(contest.criteria, contest.submissionDeadline, new Date());
    if (!toOpen.success) return { error: toOpen.reason };
  } else if (targetStatus === 'JUDGING') {
    const toJudging = canTransitionToJudging(contest.judges.length, contest._count.submissions);
    if (!toJudging.success) return { error: toJudging.reason };
  } else if (targetStatus === 'PUBLISHED') {
    // Explicit override (we trust the UI button for now, but in real life we could check completion)
  }

  await prisma.contest.update({
    where: { id: contestId },
    data: { status: targetStatus }
  });

  revalidatePath(`/organizer/contest/${contestId}`);
}
