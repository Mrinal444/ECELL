import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="border-b border-vault-border bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-medium tracking-tight text-vault-navy">
          PitchVault
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          {session ? (
            <>
              {session.role === 'ORGANIZER' && (
                <Link href="/organizer" className="text-vault-muted hover:text-vault-ink transition">Organize</Link>
              )}
              {session.role === 'TEAM' && (
                <Link href="/team" className="text-vault-muted hover:text-vault-ink transition">My Team</Link>
              )}
              {session.role === 'JUDGE' && (
                <Link href="/judge" className="text-vault-muted hover:text-vault-ink transition">Judging Queue</Link>
              )}

              <div className="h-4 w-[1px] bg-vault-border"></div>

              <div className="flex items-center gap-3">
                <span className="text-vault-muted text-xs bg-vault-card px-2 py-1 flex items-center rounded">
                  {session.role}
                </span>
                <span className="text-vault-ink">{session.name}</span>
                <form action={logout}>
                  <button type="submit" className="text-vault-muted hover:text-vault-ruby p-1 transition" title="Log Out">
                    <LogOut size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link href="/login" className="text-vault-copper hover:text-vault-copper-dark transition">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
