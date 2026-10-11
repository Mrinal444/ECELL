'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Calendar,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { getDueStatus } from '@/lib/date-parser';

interface MyWorkClientProps {
  initialActions: any[];
  currentUser: any;
  members: any[];
}

export default function MyWorkClient({
  initialActions,
  currentUser,
  members,
}: MyWorkClientProps) {
  const [actions, setActions] = useState<any[]>(initialActions);
  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed'>('active');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    currentUser?.memberId || (members[0]?.id ?? '')
  );
  const [loading, setLoading] = useState(false);

  // Switch viewing member
  const handleMemberChange = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setLoading(true);
    try {
      const res = await fetch(`/api/actions?assigneeId=${memberId}`);
      const data = await res.json();
      if (res.ok && data.actions) {
        setActions(data.actions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle action status
  const handleToggleStatus = async (actionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'open' : 'done';

    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date().toISOString() : null,
            }
          : a
      )
    );

    try {
      await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const activeActions = actions.filter((a) => a.status !== 'done');
  const completedActions = actions.filter((a) => a.status === 'done');
  const overdueActions = activeActions.filter((a) => getDueStatus(a.dueDate).isOverdue);

  const displayedActions =
    activeTab === 'active'
      ? activeActions
      : activeTab === 'overdue'
      ? overdueActions
      : completedActions;

  const currentMemberObj = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-300 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-tealAccent-50 border border-tealAccent-200 flex items-center justify-center text-tealAccent-700 font-bold shadow-paper-sm">
            {currentMemberObj?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight flex items-center gap-2">
              <span>My Work</span>
              {currentMemberObj && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-paper-200 text-ink-300">
                  {currentMemberObj.name} ({currentMemberObj.role})
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-ink-100">
              Personal commitments, sprint deliverables, and action item accountability
            </p>
          </div>
        </div>

        {/* Member Selector Switcher for multi-profile testing */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-200">Viewing as:</span>
          <select
            value={selectedMemberId}
            onChange={(e) => handleMemberChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-paper-300 bg-white text-ink-400 font-semibold text-xs shadow-paper-sm focus:ring-2 focus:ring-tealAccent-600"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'active'
              ? 'bg-tealAccent-50/50 border-tealAccent-300 shadow-paper'
              : 'bg-white border-paper-300 hover:bg-paper-50 shadow-paper-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">
              Active To Do
            </span>
            <span className="p-1.5 rounded-lg bg-tealAccent-100 text-tealAccent-800">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-ink-500 mt-2">
            {activeActions.length}
          </p>
          <p className="text-[11px] text-ink-100 mt-0.5">Tasks needing execution</p>
        </div>

        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'overdue'
              ? 'bg-dangerRed-50/50 border-dangerRed-300 shadow-paper'
              : 'bg-white border-paper-300 hover:bg-paper-50 shadow-paper-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-dangerRed-700 uppercase tracking-wider">
              Overdue
            </span>
            <span className="p-1.5 rounded-lg bg-dangerRed-100 text-dangerRed-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-dangerRed-600 mt-2">
            {overdueActions.length}
          </p>
          <p className="text-[11px] text-dangerRed-500 mt-0.5">Past deadline requirements</p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'completed'
              ? 'bg-paper-100 border-paper-400 shadow-paper'
              : 'bg-white border-paper-300 hover:bg-paper-50 shadow-paper-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-300 uppercase tracking-wider">
              Completed
            </span>
            <span className="p-1.5 rounded-lg bg-paper-200 text-ink-300">
              <CheckCircle2 className="w-4 h-4 text-tealAccent-700" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-ink-500 mt-2">
            {completedActions.length}
          </p>
          <p className="text-[11px] text-ink-100 mt-0.5">Closed deliverables</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-paper-300 gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-tealAccent-700 text-tealAccent-700'
              : 'border-transparent text-ink-200 hover:text-ink-400'
          }`}
        >
          Active Tasks ({activeActions.length})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'overdue'
              ? 'border-dangerRed-600 text-dangerRed-600'
              : 'border-transparent text-ink-200 hover:text-ink-400'
          }`}
        >
          Overdue ({overdueActions.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'completed'
              ? 'border-ink-400 text-ink-500'
              : 'border-transparent text-ink-200 hover:text-ink-400'
          }`}
        >
          Completed Archive ({completedActions.length})
        </button>
      </div>

      {/* Actions List */}
      <div className="bg-white border border-paper-300 rounded-2xl shadow-paper overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-200">
            Loading tasks...
          </div>
        ) : displayedActions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-tealAccent-700 mx-auto opacity-40" />
            <p className="text-sm font-bold text-ink-400">
              {activeTab === 'active'
                ? 'All caught up! No active tasks assigned.'
                : activeTab === 'overdue'
                ? 'Great job! No overdue action items.'
                : 'No completed tasks recorded in history yet.'}
            </p>
            <p className="text-xs text-ink-100">
              New action items assigned in meetings will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-paper-200">
            {displayedActions.map((item) => {
              const dueInfo = getDueStatus(item.dueDate);
              const isDone = item.status === 'done';

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDone ? 'bg-paper-50/50 opacity-75' : 'hover:bg-paper-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center border transition-all ${
                        isDone
                          ? 'bg-tealAccent-700 border-tealAccent-700 text-white'
                          : 'border-paper-400 bg-white hover:border-tealAccent-600 hover:bg-tealAccent-50'
                      }`}
                    >
                      {isDone && <Check className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <p
                        className={`text-sm sm:text-base font-bold tracking-tight ${
                          isDone ? 'line-through text-ink-100 font-normal' : 'text-ink-500'
                        }`}
                      >
                        {item.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-200">
                        <Link
                          href={`/meetings/${item.meetingId}`}
                          className="hover:underline hover:text-tealAccent-700 font-medium flex items-center gap-1"
                        >
                          <span>📁 {item.meeting?.title}</span>
                          <ArrowRight className="w-3 h-3 text-ink-100" />
                        </Link>

                        {item.origin === 'ai_suggested' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px]">
                            <Sparkles className="w-2.5 h-2.5" /> AI
                          </span>
                        )}

                        {item.carriedFrom && (
                          <span className="px-1.5 py-0.2 rounded bg-paper-200 text-ink-300 text-[10px]">
                            Carried over
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {item.dueDate ? (
                      <span
                        className={`text-xs px-3 py-1 rounded-xl border font-bold ${
                          isDone
                            ? 'bg-paper-100 border-paper-300 text-ink-200'
                            : dueInfo.isOverdue
                            ? 'bg-dangerRed-100 border-dangerRed-300 text-dangerRed-700'
                            : dueInfo.isDueSoon
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-paper-100 border-paper-300 text-ink-300'
                        }`}
                      >
                        {dueInfo.text}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-100 italic">No deadline set</span>
                    )}

                    <button
                      onClick={() => handleToggleStatus(item.id, item.status)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isDone
                          ? 'bg-paper-100 hover:bg-paper-200 text-ink-300 border-paper-300 flex items-center gap-1'
                          : 'bg-tealAccent-50 hover:bg-tealAccent-100 text-tealAccent-800 border-tealAccent-200'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <RotateCcw className="w-3 h-3" /> Reopen
                        </>
                      ) : (
                        'Mark Done ✓'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
