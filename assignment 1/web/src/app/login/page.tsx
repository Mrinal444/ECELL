'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Key, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Demo login failed');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-tealAccent-700 text-white font-extrabold text-2xl shadow-paper-lg mb-4">
            E
          </div>
          <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight">
            E-Cell Meeting Notetaker
          </h1>
          <p className="text-sm text-ink-100 mt-1.5">
            Single system of record for decisions, owners & deadlines
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-paper-300 rounded-2xl p-6 sm:p-8 shadow-paper">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="president@ecell.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-tealAccent-700 text-white font-semibold text-sm hover:bg-tealAccent-800 shadow-paper-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          {/* 1-Click Fast Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-paper-300">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-100 mb-3 text-center">
              Quick Demo Access (1-Click)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => loginWithDemo('demo@ecell.org')}
                className="p-2.5 rounded-xl border border-paper-300 bg-paper-50 hover:bg-tealAccent-50 hover:border-tealAccent-300 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-ink-400 group-hover:text-tealAccent-800">
                    Rahul Sharma
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[10px] text-tealAccent-700 font-semibold block">
                  President
                </span>
              </button>

              <button
                type="button"
                onClick={() => loginWithDemo('tech@ecell.org')}
                className="p-2.5 rounded-xl border border-paper-300 bg-paper-50 hover:bg-tealAccent-50 hover:border-tealAccent-300 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-ink-400 group-hover:text-tealAccent-800">
                    Sneha Patil
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[10px] text-tealAccent-700 font-semibold block">
                  Tech Lead
                </span>
              </button>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] text-ink-100 font-mono">
                Default password: password123
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
