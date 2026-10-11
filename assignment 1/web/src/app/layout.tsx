import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import DueSoonBanner from '@/components/DueSoonBanner';

export const metadata: Metadata = {
  title: 'E-Cell Meeting Notetaker & Action Tracker',
  description: 'The single system of record for E-Cell meetings, decisions, owners, and deadlines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper-100 text-ink-500 min-h-[100dvh] flex flex-col selection:bg-tealAccent-100 selection:text-tealAccent-900">
        <Navbar />
        <DueSoonBanner />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-paper-300 py-6 text-center text-xs text-ink-100 bg-paper-100">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>E-Cell System of Record — Notetaker, Decisions & Action Tracker</p>
            <p className="text-[11px] font-mono text-ink-50">Local SQLite & AI Powered</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
