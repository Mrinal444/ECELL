'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  LayoutGrid,
  Settings,
  Plus,
  LogOut,
  User,
  Shield,
  Clock,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'Meetings', href: '/meetings', icon: Calendar },
    { name: 'Import & AI', href: '/import', icon: Sparkles, badge: 'AI' },
    { name: 'Action Board', href: '/board', icon: CheckSquare },
    { name: 'My Work', href: '/my-work', icon: User },
    { name: 'Settings & Tokens', href: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-paper-100/90 backdrop-blur-md border-b border-paper-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-tealAccent-700 text-white flex items-center justify-center font-bold text-lg shadow-paper-sm group-hover:bg-tealAccent-800 transition-colors">
                E
              </div>
              <div>
                <span className="font-extrabold text-ink-500 tracking-tight text-lg">E-Cell</span>
                <span className="ml-1.5 text-xs font-semibold uppercase tracking-wider text-tealAccent-700 bg-tealAccent-50 px-2 py-0.5 rounded border border-tealAccent-200">
                  Notetaker
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-paper-200 text-tealAccent-800 font-semibold shadow-paper-sm border border-paper-300'
                      : 'text-ink-200 hover:text-ink-500 hover:bg-paper-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-tealAccent-700' : 'text-ink-100'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-tealAccent-100 text-tealAccent-800 rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons & User profile */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/meetings/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-tealAccent-700 text-white hover:bg-tealAccent-800 text-sm font-semibold shadow-paper-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Log Meeting</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-paper-300">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-ink-400 leading-tight">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[11px] text-tealAccent-700 font-medium">
                    {user.member?.role || 'Core Team'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 rounded-lg text-ink-100 hover:text-dangerRed-600 hover:bg-dangerRed-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-tealAccent-700 hover:text-tealAccent-800 px-3 py-1.5 rounded-lg hover:bg-tealAccent-50"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/meetings/new"
              className="p-1.5 rounded-lg bg-tealAccent-700 text-white text-sm"
            >
              <Plus className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-ink-300 hover:bg-paper-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-paper-300 bg-paper-100 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-paper-200 text-tealAccent-800 font-semibold' : 'text-ink-300'
                }`}
              >
                <Icon className="w-4 h-4 text-ink-200" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          {user && (
            <div className="pt-3 border-t border-paper-300 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-ink-400">{user.displayName}</p>
                <p className="text-ink-100">{user.member?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-dangerRed-600 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
