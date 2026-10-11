import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format, subDays, addDays, isBefore, isToday, startOfDay } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  FileText,
  Users,
  CheckSquare,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const now = new Date();
  const startToday = startOfDay(now);

  // Fetch metrics and recent items
  const [meetings, allActions, decisionsCount, myWorkItems] = await Promise.all([
    prisma.meeting.findMany({
      take: 6,
      orderBy: { startsAt: 'desc' },
      include: {
        attendees: { include: { member: true } },
        decisions: true,
        actionItems: { include: { assignee: true } },
        createdBy: true,
      },
    }),
    prisma.actionItem.findMany({
      where: { status: { in: ['open', 'in_progress'] } },
      include: {
        assignee: true,
        meeting: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.decision.count(),
    user.memberId
      ? prisma.actionItem.findMany({
          where: {
            assigneeId: user.memberId,
            status: { in: ['open', 'in_progress'] },
          },
          include: { meeting: { select: { id: true, title: true } } },
          orderBy: { dueDate: 'asc' },
          take: 4,
        })
      : [],
  ]);

  // Compute overdue and due soon
  const overdueActions = allActions.filter(
    (a) => a.dueDate && isBefore(new Date(a.dueDate), startToday)
  );
  const dueTodayOrSoonActions = allActions.filter(
    (a) =>
      a.dueDate &&
      !isBefore(new Date(a.dueDate), startToday) &&
      isBefore(new Date(a.dueDate), addDays(now, 3))
  );
  const completedCount = await prisma.actionItem.count({ where: { status: 'done' } });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'whatsapp_paste':
      case 'whatsapp_capture':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            WhatsApp
          </span>
        );
      case 'speech':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Voice Dictation
          </span>
        );
      case 'meet':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Google Meet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            Direct Notes
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-paper-300 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-500 tracking-tight">
            Welcome back, {user.displayName}
          </h1>
          <p className="text-sm text-ink-100 mt-1">
            System of record for E-Cell meetings, verified decisions, and team accountability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-paper-200 hover:bg-paper-300 text-ink-400 font-semibold text-sm border border-paper-300 transition-all shadow-paper-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Import</span>
          </Link>

          <Link
            href="/meetings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-sm shadow-paper transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log a Meeting</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-paper-300 rounded-2xl p-4 sm:p-5 shadow-paper">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-100">
              Total Meetings
            </span>
            <div className="p-2 rounded-xl bg-tealAccent-50 text-tealAccent-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink-500 mt-2">
            {meetings.length}
          </p>
          <span className="text-[11px] text-ink-100 font-medium">Logged & searchable</span>
        </div>

        <div className="bg-white border border-paper-300 rounded-2xl p-4 sm:p-5 shadow-paper">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-100">
              Decisions Logged
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink-500 mt-2">
            {decisionsCount}
          </p>
          <span className="text-[11px] text-ink-100 font-medium">Verified by team</span>
        </div>

        <div className="bg-white border border-paper-300 rounded-2xl p-4 sm:p-5 shadow-paper">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-100">
              Active Action Items
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-ink-500 mt-2">
            {allActions.length}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {completedCount} completed
          </span>
        </div>

        <div
          className={`border rounded-2xl p-4 sm:p-5 shadow-paper ${
            overdueActions.length > 0
              ? 'bg-red-50/70 border-red-200'
              : 'bg-white border-paper-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                overdueActions.length > 0 ? 'text-red-700' : 'text-ink-100'
              }`}
            >
              Overdue Tasks
            </span>
            <div
              className={`p-2 rounded-xl ${
                overdueActions.length > 0
                  ? 'bg-red-100 text-red-700 animate-pulse'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-2 ${
              overdueActions.length > 0 ? 'text-red-700' : 'text-ink-500'
            }`}
          >
            {overdueActions.length}
          </p>
          <span className="text-[11px] text-red-600 font-medium">
            {overdueActions.length > 0 ? 'Needs immediate attention' : 'All on track'}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Urgent Items & My Work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Overdue & Due Soon Watchlist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Section */}
          {overdueActions.length > 0 && (
            <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-paper">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Overdue Action Items ({overdueActions.length})</span>
                </div>
                <Link
                  href="/board?status=open"
                  className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
                >
                  <span>Board view</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-red-100">
                {overdueActions.map((action) => (
                  <div
                    key={action.id}
                    className="py-3 flex items-start justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-ink-500">{action.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-ink-100">
                        <span className="font-medium text-ink-300">
                          Owner: {action.assignee?.name || 'Unassigned'}
                        </span>
                        <span>•</span>
                        <span>Meeting: {action.meeting.title}</span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                      Overdue ({format(new Date(action.dueDate!), 'MMM d')})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Soon Section */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-ink-400 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Upcoming & Due Soon ({dueTodayOrSoonActions.length})</span>
              </div>
              <Link
                href="/board"
                className="text-xs font-semibold text-tealAccent-700 hover:underline flex items-center gap-1"
              >
                <span>Full Board</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {dueTodayOrSoonActions.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-100">
                No immediate deadlines in the next 3 days.
              </div>
            ) : (
              <div className="divide-y divide-paper-200">
                {dueTodayOrSoonActions.slice(0, 5).map((action) => {
                  const isDueToday = isToday(new Date(action.dueDate!));
                  return (
                    <div
                      key={action.id}
                      className="py-3 flex items-start justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-ink-400">{action.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-ink-100">
                          <span className="font-medium text-ink-300">
                            Owner: {action.assignee?.name || 'Unassigned'}
                          </span>
                          <span>•</span>
                          <span>{action.meeting.title}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          isDueToday
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isDueToday
                          ? 'Due Today'
                          : `Due ${format(new Date(action.dueDate!), 'EEE, MMM d')}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Meetings */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-ink-400 font-bold text-sm">
                <Calendar className="w-4 h-4 text-tealAccent-700" />
                <span>Recent Meetings Log</span>
              </div>
              <Link
                href="/meetings"
                className="text-xs font-semibold text-tealAccent-700 hover:underline flex items-center gap-1"
              >
                <span>All Meetings</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="block p-4 rounded-xl border border-paper-300 bg-paper-50 hover:bg-paper-100/80 hover:border-tealAccent-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-sm text-ink-500 group-hover:text-tealAccent-800 transition-colors">
                      {meeting.title}
                    </h3>
                    {getSourceBadge(meeting.source)}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-100">
                    <span className="font-medium text-ink-300">
                      {format(new Date(meeting.startsAt), 'MMM d, yyyy')}
                    </span>
                    <span>•</span>
                    <span>{meeting.decisions.length} decisions</span>
                    <span>•</span>
                    <span>
                      {meeting.actionItems.filter((a) => a.status === 'done').length}/
                      {meeting.actionItems.length} actions completed
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meeting.attendees.length} attendees
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: My Work & Quick Extensions Capture info */}
        <div className="space-y-6">
          {/* My Work Box */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-ink-400 font-bold text-sm">
                <CheckSquare className="w-4 h-4 text-tealAccent-700" />
                <span>My Active Work</span>
              </div>
              <Link
                href="/my-work"
                className="text-xs font-semibold text-tealAccent-700 hover:underline"
              >
                View all ({myWorkItems.length})
              </Link>
            </div>

            {myWorkItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-100">
                You have no open action items assigned right now!
              </div>
            ) : (
              <div className="space-y-2.5">
                {myWorkItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/meetings/${item.meeting.id}`}
                    className="block p-3 rounded-xl border border-paper-200 bg-paper-50 hover:bg-tealAccent-50/40 hover:border-tealAccent-200 transition-all text-xs"
                  >
                    <p className="font-semibold text-ink-400 line-clamp-2">{item.title}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-100">
                      <span className="truncate max-w-[120px]">{item.meeting.title}</span>
                      <span className="font-semibold text-ink-300">
                        {item.dueDate ? format(new Date(item.dueDate), 'MMM d') : 'No date'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Chrome Extension Companion Card */}
          <div className="bg-gradient-to-br from-tealAccent-50 via-white to-amberAccent-50 border border-tealAccent-200 rounded-2xl p-5 shadow-paper">
            <div className="flex items-center gap-2 text-tealAccent-800 font-bold text-sm mb-2">
              <Radio className="w-4 h-4 text-tealAccent-600 animate-pulse" />
              <span>Capture Layer Active</span>
            </div>
            <p className="text-xs text-ink-200 leading-relaxed mb-4">
              Use the Chrome Extension side panel to dictate speech notes live in Google Meet or WhatsApp and sync directly to this dashboard.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-paper-200">
                <span className="text-ink-300 font-medium">Auto-Reminders</span>
                <span className="text-[10px] uppercase font-bold text-tealAccent-700 bg-tealAccent-100 px-1.5 py-0.5 rounded">
                  Active (30m)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/80 border border-paper-200">
                <span className="text-ink-300 font-medium">Live Speech API</span>
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                  Web Speech
                </span>
              </div>
            </div>
            <Link
              href="/settings"
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper-sm transition-all"
            >
              <span>Manage Extension Tokens</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
