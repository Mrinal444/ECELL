'use client';

import { useState } from 'react';
import {
  Key,
  Shield,
  Users,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  Puzzle,
  ExternalLink,
} from 'lucide-react';

interface SettingsClientProps {
  currentUser: any;
  members: any[];
  initialTokens: any[];
}

export default function SettingsClient({
  currentUser,
  members,
  initialTokens,
}: SettingsClientProps) {
  const [tokens, setTokens] = useState<any[]>(initialTokens);
  const [newTokenLabel, setNewTokenLabel] = useState('Chrome Extension Token');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate Token
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenLabel.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTokenLabel.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate API token');
        setLoading(false);
        return;
      }

      setGeneratedToken(data.token);
      setTokens([data.tokenRecord, ...tokens]);
      setNewTokenLabel('Chrome Extension Token');
    } catch (err) {
      setError('Connection error generating token');
    } finally {
      setLoading(false);
    }
  };

  // Revoke Token
  const handleRevokeToken = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this extension API token?')) return;

    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTokens(
          tokens.map((t) => (t.id === id ? { ...t, revokedAt: new Date().toISOString() } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-paper-300 pb-4">
        <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight flex items-center gap-2">
          <span>Settings & Integrations</span>
        </h1>
        <p className="text-xs sm:text-sm text-ink-100">
          Manage Chrome Extension tokens, team roster aliases, and system preferences
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Chrome Extension Companion Integration */}
      <div className="bg-white border border-paper-300 rounded-2xl p-6 shadow-paper space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-tealAccent-50 text-tealAccent-700 border border-tealAccent-200">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-500">
                Chrome Extension Companion
              </h2>
              <p className="text-xs text-ink-100">
                Generate revocable Bearer tokens for the Chrome Extension side panel and background reminder alarms.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Token Notice */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Pre-Seeded Demo Extension Token</span>
            </span>
            <button
              onClick={() => copyToClipboard('ecell_ext_token_demo_987654321')}
              className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-tealAccent-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Token!' : 'Copy Demo Token'}</span>
            </button>
          </div>
          <p className="font-mono text-xs text-amber-800 bg-white/80 p-2 rounded-lg border border-amber-200 break-all select-all">
            ecell_ext_token_demo_987654321
          </p>
          <p className="text-[11px] text-amber-700">
            Paste this token directly into the extension popup or side panel to connect instantly.
          </p>
        </div>

        {/* Generated Token Banner */}
        {generatedToken && (
          <div className="p-4 rounded-xl bg-tealAccent-50 border border-tealAccent-300 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-tealAccent-900">
                🔑 New Token Generated Successfully
              </span>
              <button
                onClick={() => copyToClipboard(generatedToken)}
                className="text-xs text-tealAccent-800 font-bold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-tealAccent-900 bg-white p-2 rounded-lg border border-tealAccent-300 select-all break-all">
              {generatedToken}
            </p>
            <p className="text-[11px] text-tealAccent-700">
              Make sure to copy this token now. It will not be shown in full again for security.
            </p>
          </div>
        )}

        {/* Generate Token Form */}
        <form onSubmit={handleGenerateToken} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newTokenLabel}
            onChange={(e) => setNewTokenLabel(e.target.value)}
            placeholder="Token description (e.g. My Laptop Chrome)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Create New Token'}</span>
          </button>
        </form>

        {/* Active Tokens Table */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-ink-300 uppercase tracking-wider">
            Active & Revoked Tokens
          </h3>

          <div className="divide-y divide-paper-200 border border-paper-200 rounded-xl overflow-hidden">
            {tokens.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-100">
                No tokens created yet.
              </div>
            ) : (
              tokens.map((token) => (
                <div
                  key={token.id}
                  className="p-3.5 bg-paper-50/50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-500">{token.label}</span>
                      {token.revokedAt ? (
                        <span className="px-1.5 py-0.2 rounded bg-dangerRed-100 text-dangerRed-700 text-[10px] font-bold">
                          Revoked
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-tealAccent-100 text-tealAccent-800 text-[10px] font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-100 font-mono">
                      Created: {new Date(token.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {!token.revokedAt && (
                    <button
                      type="button"
                      onClick={() => handleRevokeToken(token.id)}
                      className="px-2.5 py-1 rounded-lg border border-dangerRed-200 text-dangerRed-700 hover:bg-dangerRed-50 text-[11px] font-bold transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Team Roster & Alias Matching Table */}
      <div className="bg-white border border-paper-300 rounded-2xl p-6 shadow-paper space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-paper-100 text-ink-400 border border-paper-300">
              <Users className="w-5 h-5 text-tealAccent-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-500">
                Team Roster & Alias Resolver
              </h2>
              <p className="text-xs text-ink-100">
                Fuzzy matching aliases used by the AI import engine to map WhatsApp tags (@rahul, Sneha, RS) to roster accounts.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper-100 text-ink-400 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Member</th>
                <th className="p-3">Role</th>
                <th className="p-3">Aliases & Handles</th>
                <th className="p-3 rounded-r-lg text-right">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200 text-ink-400">
              {members.map((m) => {
                let aliases: string[] = [];
                try {
                  aliases = JSON.parse(m.aliases || '[]');
                } catch (e) {}

                return (
                  <tr key={m.id} className="hover:bg-paper-50 transition-colors">
                    <td className="p-3 font-bold text-ink-500 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-tealAccent-100 text-tealAccent-800 text-[10px] font-bold flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="p-3 text-ink-300">{m.role}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {aliases.map((alias, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-paper-200 text-ink-400 font-mono text-[10px]"
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right text-ink-200 font-medium">
                      {m._count?.assignedActions || 0} tasks • {m._count?.attendedMeetings || 0} meetings
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
