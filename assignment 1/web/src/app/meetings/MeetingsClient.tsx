'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search,
  Calendar,
  Plus,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  ArrowRight,
  Radio,
  FileText,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface MeetingsClientProps {
  initialMeetings: any[];
  members: any[];
}

export default function MeetingsClient({ initialMeetings, members }: MeetingsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [attendeeFilter, setAttendeeFilter] = useState('all');

  const filteredMeetings = useMemo(() => {
    return initialMeetings.filter((meeting) => {
      // Source filter
      if (sourceFilter !== 'all') {
        if (sourceFilter === 'whatsapp') {
          if (meeting.source !== 'whatsapp_paste' && meeting.source !== 'whatsapp_capture') {
            return false;
          }
        } else if (meeting.source !== sourceFilter) {
          return false;
        }
      }

      // Attendee filter
      if (attendeeFilter !== 'all') {
        const hasAttendee = meeting.attendees.some(
          (a: any) => a.memberId === attendeeFilter
        );
        if (!hasAttendee) return false;
      }

      // Search query across title, notes, agenda, decisions, actions, rawText
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = meeting.title?.toLowerCase().includes(q);
        const inNotes = meeting.notes?.toLowerCase().includes(q);
        const inAgenda = meeting.agenda?.toLowerCase().includes(q);
        const inRaw = meeting.rawText?.toLowerCase().includes(q);
        const inDecisions = meeting.decisions.some((d: any) =>
          d.text?.toLowerCase().includes(q)
        );
        const inActions = meeting.actionItems.some((a: any) =>
          a.title?.toLowerCase().includes(q) || a.assignee?.name?.toLowerCase().includes(q)
        );

        if (!inTitle && !inNotes && !inAgenda && !inRaw && !inDecisions && !inActions) {
          return false;
        }
      }

      return true;
    });
  }, [initialMeetings, searchQuery, sourceFilter, attendeeFilter]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'whatsapp_paste':
      case 'whatsapp_capture':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            WhatsApp
          </span>
        );
      case 'speech':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Voice Dictation
          </span>
        );
      case 'meet':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Google Meet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            Direct Notes
          </span>
        );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setAttendeeFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || sourceFilter !== 'all' || attendeeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-paper-300 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-500 tracking-tight">
            Meetings Catalog
          </h1>
          <p className="text-sm text-ink-100 mt-1">
            Searchable log of all discussions, decisions, and action items ({filteredMeetings.length} of {initialMeetings.length} records)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            <span>Log Meeting</span>
          </Link>
        </div>
      </div>

      {/* Omni-Search & Filter Toolbar */}
      <div className="bg-white border border-paper-300 rounded-2xl p-4 shadow-paper space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-100 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across title, notes, decisions, assignees, or actions..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600 focus:border-transparent transition-all placeholder:text-ink-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-100 hover:text-ink-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chips & Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Source Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-100 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Source:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'whatsapp', label: 'WhatsApp' },
              { id: 'speech', label: 'Voice Notes' },
              { id: 'meet', label: 'Google Meet' },
              { id: 'manual', label: 'Direct' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  sourceFilter === tab.id
                    ? 'bg-tealAccent-700 text-white shadow-paper-sm font-semibold'
                    : 'bg-paper-100 text-ink-300 hover:bg-paper-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Attendee Select */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-100 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Attendee:
            </span>
            <select
              value={attendeeFilter}
              onChange={(e) => setAttendeeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-paper-300 bg-paper-50 text-ink-400 text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-dangerRed-600 hover:text-dangerRed-700 font-semibold underline ml-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-white border border-paper-300 rounded-2xl p-12 text-center shadow-paper">
          <Calendar className="w-12 h-12 text-ink-50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink-400">No meetings found</h3>
          <p className="text-xs text-ink-100 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try clearing your search query or source filters.'
              : 'Start by logging a new meeting or importing notes from WhatsApp.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-paper-200 hover:bg-paper-300 text-ink-400 font-semibold text-xs transition-all"
              >
                Clear all filters
              </button>
            ) : (
              <Link
                href="/meetings/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log first meeting</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const completedActions = meeting.actionItems.filter((a: any) => a.status === 'done');
            const totalActions = meeting.actionItems.length;
            const progressPercent = totalActions > 0 ? Math.round((completedActions.length / totalActions) * 100) : 0;

            return (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="block bg-white border border-paper-300 hover:border-tealAccent-400 rounded-2xl p-5 sm:p-6 shadow-paper hover:shadow-paper-lg transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-tealAccent-700 bg-tealAccent-50 px-2.5 py-0.5 rounded border border-tealAccent-200">
                        {format(new Date(meeting.startsAt), 'EEE, MMM d, yyyy • h:mm a')}
                      </span>
                      {getSourceBadge(meeting.source)}
                    </div>
                    <h2 className="text-lg font-bold text-ink-500 group-hover:text-tealAccent-800 transition-colors">
                      {meeting.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-tealAccent-700 group-hover:translate-x-1 transition-transform self-start shrink-0">
                    <span>View Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Notes or Agenda preview */}
                {(meeting.notes || meeting.agenda) && (
                  <p className="text-xs text-ink-200 line-clamp-2 leading-relaxed mb-4 bg-paper-50 p-2.5 rounded-xl border border-paper-200 font-sans">
                    {meeting.notes || meeting.agenda}
                  </p>
                )}

                {/* Footer Metrics & Attendee Chips */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-paper-200 text-xs">
                  {/* Left: Decisions & Action Items stats */}
                  <div className="flex items-center gap-4 text-ink-200">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-semibold text-ink-400">{meeting.decisions.length}</span>
                      <span>decisions</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-tealAccent-600" />
                      <span className="font-semibold text-ink-400">
                        {completedActions.length}/{totalActions}
                      </span>
                      <span>actions done</span>
                    </div>
                  </div>

                  {/* Right: Attendees Badges */}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-ink-100" />
                    <div className="flex flex-wrap items-center gap-1">
                      {meeting.attendees.slice(0, 4).map((a: any) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 rounded-md bg-paper-100 text-ink-300 font-medium text-[11px] border border-paper-200"
                        >
                          {a.member?.name}
                        </span>
                      ))}
                      {meeting.attendees.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-paper-200 text-ink-200 font-bold text-[10px]">
                          +{meeting.attendees.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
