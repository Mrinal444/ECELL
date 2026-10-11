import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requireRole } from '@/lib/domain/policy';
import Link from 'next/link';

export default async function TeamDashboard() {
  const session = await requireAuth();
  requireRole(session, ['TEAM']);

  const team = await prisma.team.findUnique({
    where: { ownerId: session.id },
    include: {
      submissions: {
        include: { contest: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-serif text-vault-navy mb-8">My Team</h1>

      {!team ? (
        <div className="bg-white p-8 rounded-lg archival-border max-w-lg archival-shadow">
          <h2 className="text-xl font-medium mb-4">Create Your Team</h2>
          <form action={async (data) => {
            'use server';
            await requireAuth();
            const { prisma } = await import('@/lib/db');
            await prisma.team.create({
              data: {
                name: data.get('name') as string,
                ownerId: session.id
              }
            });
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/team');
          }} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Team Name"
              required
              className="w-full px-3 py-2 border border-vault-border rounded font-medium focus:border-vault-copper focus:ring-1 focus:ring-vault-copper outline-none"
            />
            <button className="bg-vault-copper text-white px-4 py-2 rounded shadow-sm hover:bg-vault-copper-dark transition font-medium text-sm">
              Create Team
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg archival-border inline-block min-w-xs archival-shadow">
            <h2 className="text-vault-muted text-sm uppercase tracking-wider mb-1">Team Name</h2>
            <div className="text-xl text-vault-navy font-medium">{team.name}</div>
          </div>

          <div>
            <h2 className="text-2xl font-serif text-vault-navy mb-6">Submissions</h2>

            {team.submissions.length === 0 ? (
              <p className="text-vault-muted bg-white p-6 rounded archival-border inline-block archival-shadow">No submissions found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {team.submissions.map(sub => {
                  const c = sub.contest;
                  return (
                    <Link
                      key={sub.id}
                      href={`/team/submission/${sub.id}`}
                      className="block bg-white border border-vault-border rounded-lg p-6 hover:border-vault-copper transition group archival-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg text-vault-navy group-hover:text-vault-copper transition">{c.title}</h3>
                        <span className="text-xs font-mono bg-vault-card border border-vault-border px-2 py-1 rounded text-vault-muted">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-vault-ink mb-1">{sub.title}</p>

                      <div className="mt-4 text-sm text-vault-copper font-medium flex justify-between items-center">
                        <span>View Details</span>
                        <span>&rarr;</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
