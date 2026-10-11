'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from '@/app/actions/auth';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-vault-copper text-white py-2 rounded-md font-medium hover:bg-vault-copper-dark transition disabled:opacity-50"
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState(login, undefined);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg archival-border archival-shadow w-full max-w-md">
        <h2 className="text-2xl font-serif mb-6 text-center text-vault-navy">Welcome to PitchVault</h2>

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vault-ink mb-1" htmlFor="email">Email address</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full px-3 py-2 border border-vault-border rounded-md focus:outline-none focus:border-vault-copper focus:ring-1 focus:ring-vault-copper"
              placeholder="admin@pitchvault.local"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vault-ink mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              required
              className="w-full px-3 py-2 border border-vault-border rounded-md focus:outline-none focus:border-vault-copper focus:ring-1 focus:ring-vault-copper"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <div className="p-3 bg-vault-ruby-faint text-vault-ruby text-sm rounded border border-vault-ruby/20">
              {state.error}
            </div>
          )}

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-vault-muted">
          Don't have an account? <Link href="/register" className="text-vault-copper hover:underline">Register</Link>
        </p>

        <div className="mt-8 pt-6 border-t border-vault-border">
          <p className="text-xs text-vault-muted mb-2 font-medium">Demo accounts (password: password123)</p>
          <ul className="text-xs text-vault-muted space-y-1 font-mono">
            <li>admin@pitchvault.local (Organizer)</li>
            <li>judge.a@pitchvault.local (Judge)</li>
            <li>alice@pitchvault.local (Team)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
