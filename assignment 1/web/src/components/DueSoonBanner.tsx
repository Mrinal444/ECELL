'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, Clock, ArrowRight, X } from 'lucide-react';

export default function DueSoonBanner() {
  const pathname = usePathname();
  const [reminders, setReminders] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pathname === '/login') return;

    fetch('/api/actions/reminders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.summary?.overdueCount > 0 || data.summary?.dueSoonCount > 0 || data.summary?.todayCount > 0)) {
          setReminders(data);
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname === '/login' || dismissed || !reminders) {
    return null;
  }

  const { overdueCount, todayCount, dueSoonCount } = reminders.summary || {};
  const hasUrgent = overdueCount > 0 || todayCount > 0;

  return (
    <div
      className={`border-b transition-all ${
        overdueCount > 0
          ? 'bg-red-50/90 border-red-200 text-red-950'
          : 'bg-amber-50/90 border-amber-200 text-amber-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {overdueCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
          ) : (
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="font-bold">
              {overdueCount > 0
                ? `Action Required: ${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue!`
                : `${todayCount + dueSoonCount} task${todayCount + dueSoonCount > 1 ? 's' : ''} due soon!`}
            </span>
            <span className="hidden md:inline text-ink-200">
              {reminders.overdueItems?.[0]
                ? `"${reminders.overdueItems[0].title}" (${reminders.overdueItems[0].assigneeName})`
                : reminders.todayItems?.[0]
                ? `"${reminders.todayItems[0].title}" (${reminders.todayItems[0].assigneeName})`
                : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/board?status=open"
            className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded text-xs transition-colors ${
              overdueCount > 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <span>View Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-ink-100 hover:text-ink-400 rounded hover:bg-black/5"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
