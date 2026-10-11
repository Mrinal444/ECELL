import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  if (user.role === Role.FOUNDER && !user.founder?.onboarded) {
    redirect("/onboarding");
  }
  if (user.role === Role.MENTOR && !user.mentor?.onboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      <header className="border-b border-[var(--foreground)]/10 p-4 shrink-0 flex items-center justify-between bg-[var(--background)] z-10 sticky top-0">
        <div className="flex-1 font-bold text-xl tracking-tight hidden md:block">
          Mentor<span className="text-[var(--accent)]">Match</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/discover" className="hover:text-[var(--accent)] transition-colors">Discover</Link>
          <Link href="/sessions" className="hover:text-[var(--accent)] transition-colors">Sessions</Link>
          <Link href="/profile" className="hover:text-[var(--accent)] transition-colors">Profile</Link>
        </nav>
        <div className="flex-1 flex justify-end">
          <form action={logout}>
            <button className="text-sm border border-[var(--foreground)]/20 px-3 py-1.5 rounded hover:bg-[var(--foreground)]/5 transition-colors">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 flex flex-col bg-[var(--background)]">
        {children}
      </main>
    </div>
  );
}
