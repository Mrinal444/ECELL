import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function AnonymizeBioPage({ params }: { params: { id: string, subId: string } }) {
  const session = await requireAuth();
  requireRole(session, ['ORGANIZER']);

  const submission = await prisma.submission.findUnique({
    where: { id: params.subId, contestId: params.id },
    include: { team: true }
  });

  if (!submission) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full">
      <Link href={`/organizer/contest/${params.id}/results`} className="text-sm text-vault-muted hover:text-vault-navy transition mb-6 inline-block">
        &larr; Back to Results
      </Link>

      <div className="bg-white p-8 rounded-lg archival-border archival-shadow">
        <h1 className="text-2xl font-serif text-vault-navy mb-2">Anonymize Team Bios</h1>
        <p className="text-sm text-vault-muted mb-8">
          Submission: <strong className="text-vault-ink">{submission.title}</strong> by {submission.team.name}
        </p>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-vault-ink uppercase tracking-wide mb-2">Original Bios (Team Submitted)</h2>
            <div className="p-4 bg-vault-card border border-vault-border rounded text-sm whitespace-pre-wrap italic opacity-80">
              {submission.teamBios || 'No bios provided.'}
            </div>
          </div>

          <form action={async (formData) => {
            'use server';
            await requireAuth();
            const { prisma } = await import('@/lib/db');
            const { revalidatePath } = await import('next/cache');

            const bio = formData.get('bio') as string;
            await prisma.submission.update({
              where: { id: submission.id },
              data: { anonymizedBios: bio || null }
            });

            revalidatePath(`/organizer/contest/${params.id}/results`);
            revalidatePath(`/organizer/contest/${params.id}/submissions/${submission.id}/anonymize`);
          }}>
            <h2 className="text-sm font-medium text-vault-ink uppercase tracking-wide mb-2">Anonymized Bios (Judge Views)</h2>
            <textarea
              name="bio"
              defaultValue={submission.anonymizedBios || ''}
              placeholder="e.g. Founder 1: Technical background with 5 years enterprise software experience..."
              className="w-full px-3 py-2 border border-vault-border rounded-md resize-y h-32 focus:outline-none focus:border-vault-copper focus:ring-1 text-sm mb-4"
            />

            <button type="submit" className="bg-vault-copper text-white px-6 py-2 rounded font-medium hover:bg-vault-copper-dark transition text-sm">
              Save Anonymized Bios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
