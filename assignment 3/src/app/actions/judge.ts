'use server';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { revalidatePath } from 'next/cache';

export async function saveReview(
  submissionId: string,
  actionType: string,
  payload: { overallComment: string, scores: Array<{criterionId: string, value: number, comment: string}> }
) {
  const session = await requireAuth();
  requireRole(session, ['JUDGE']);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      contest: { include: { judges: { where: { userId: session.id } } } },
      recusals: { where: { judgeId: session.id } },
      reviews: { where: { judgeId: session.id } }
    }
  });

  if (!submission) return { error: 'Submission not found' };

  if (submission.contest.status !== 'JUDGING') {
    return { error: 'Contest is not in JUDGING state.' };
  }

  if (submission.contest.judges.length === 0) {
    return { error: 'You are not assigned to this contest.' };
  }

  if (submission.recusals.length > 0) {
    return { error: 'You are recused from this submission.' };
  }

  const existingReview = submission.reviews[0];

  if (existingReview?.submittedAt) {
    return { error: 'You have already submitted a review. It cannot be edited.' };
  }

  const isSubmit = actionType === 'SUBMIT';

  if (isSubmit) {
    const hasZeros = payload.scores.some(s => s.value < 1 || s.value > 10);
    if (hasZeros) {
      return { error: 'All criteria must have a valid score (1-10) before submitting.' };
    }
  }

  await prisma.$transaction(async (tx) => {
    let reviewId = existingReview?.id;

    if (!reviewId) {
      const review = await tx.review.create({
        data: {
          submissionId,
          judgeId: session.id,
          overallComment: payload.overallComment,
          submittedAt: isSubmit ? new Date() : null
        }
      });
      reviewId = review.id;
    } else {
      await tx.review.update({
        where: { id: reviewId },
        data: {
          overallComment: payload.overallComment,
          submittedAt: isSubmit ? new Date() : null
        }
      });
    }

    // Delete existing scores and recreate to ensure accuracy
    await tx.score.deleteMany({ where: { reviewId } });

    for (const item of payload.scores) {
      await tx.score.create({
        data: {
          reviewId,
          criterionId: item.criterionId,
          value: item.value,
          comment: item.comment,
        }
      });
    }
  });

  revalidatePath(`/judge/score/${submissionId}`);
  revalidatePath('/judge');
  return { success: true };
}
