'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Calendar,
  Plus,
  Trash2,
  MoreVertical,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  UserCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { getDueStatus } from '@/lib/date-parser';

interface BoardClientProps {
  initialActions: any[];
  members: any[];
  meetings: any[];
  currentUser: any;
}

export default function BoardClient({
  initialActions,
  members,
  meetings,
  currentUser,
}: BoardClientProps) {
  const [actions, setActions] = useState<any[]>(initialActions);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'due_soon'>('all');
  const [meetingFilter, setMeetingFilter] = useState('all');

  // New action modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMeetingId, setNewTaskMeetingId] = useState(
    meetings[0]?.id || ''
  );
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('open');
  const [creating, setCreating] = useState(false);

  // Status update handler
  const handleUpdateStatus = async (actionId: string, newStatus: string) => {
    // Optimistic update
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
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on error
        setActions(initialActions);
      }
    } catch (err) {
      setActions(initialActions);
    }
  };

  // Reassign handler
  const handleReassign = async (actionId: string, newAssigneeId: string) => {
    const memberObj = members.find((m) => m.id === newAssigneeId) || null;
    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? { ...a, assigneeId: newAssigneeId || null, assignee: memberObj }
          : a
      )
    );

    await fetch(`/api/actions/${actionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId: newAssigneeId || null }),
    });
  };

  // Delete handler
  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;

    setActions((prev) => prev.filter((a) => a.id !== actionId));
    await fetch(`/api/actions/${actionId}`, { method: 'DELETE' });
  };

  // Create new task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskMeetingId) return;

    setCreating(true);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          meetingId: newTaskMeetingId,
          assigneeId: newTaskAssigneeId || null,
          dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null,
          status: newTaskStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.action) {
        setActions([data.action, ...actions]);
        setShowNewModal(false);
        setNewTaskTitle('');
        setNewTaskDueDate('');
        setNewTaskAssigneeId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Filtered Actions
  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMeeting = item.meeting?.title?.toLowerCase().includes(q);
        const matchesAssignee = item.assignee?.name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMeeting && !matchesAssignee) return false;
      }

      // Assignee Filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          if (item.assigneeId) return false;
        } else if (assigneeFilter === 'my_work') {
          if (item.assigneeId !== currentUser?.memberId) return false;
        } else {
          if (item.assigneeId !== assigneeFilter) return false;
        }
      }

      // Meeting Filter
      if (meetingFilter !== 'all') {
        if (item.meetingId !== meetingFilter) return false;
      }

      // Due Date Filter
      if (dueFilter !== 'all') {
        const dueInfo = getDueStatus(item.dueDate);
        if (dueFilter === 'overdue' && (!dueInfo.isOverdue || item.status === 'done')) {
          return false;
        }
        if (dueFilter === 'due_soon' && (!dueInfo.isDueSoon || item.status === 'done')) {
          return false;
        }
      }

      return true;
    });
  }, [actions, searchQuery, assigneeFilter, dueFilter, meetingFilter, currentUser]);

  // Group into Kanban columns
  const openActions = filteredActions.filter((a) => a.status === 'open');
  const inProgressActions = filteredActions.filter((a) => a.status === 'in_progress');
  const doneActions = filteredActions.filter((a) => a.status === 'done');

  // Stats
  const totalCount = actions.length;
  const overdueCount = actions.filter(
    (a) => a.status !== 'done' && getDueStatus(a.dueDate).isOverdue
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-300 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight flex items-center gap-2.5">
            <span>Action Board</span>
            {overdueCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-dangerRed-100 text-dangerRed-700 border border-dangerRed-200">
                {overdueCount} Overdue
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-ink-100">
            Track commitments, assignee accountability, and sprint deliverables across all meetings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center bg-paper-200 p-1 rounded-xl border border-paper-300 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-ink-500 shadow-paper-sm'
                  : 'text-ink-200 hover:text-ink-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-ink-500 shadow-paper-sm'
                  : 'text-ink-200 hover:text-ink-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Action</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-paper-300 rounded-2xl p-4 shadow-paper space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-ink-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter actions or assignees..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600 focus:bg-white"
            />
          </div>

          {/* Assignee Filter */}
          <div className="sm:col-span-3">
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
            >
              <option value="all">All Assignees</option>
              {currentUser?.memberId && (
                <option value="my_work">👤 Assigned to Me (My Work)</option>
              )}
              <option value="unassigned">⚠️ Unassigned Only</option>
              <optgroup label="Team Members">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Due Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
            >
              <option value="all">All Due Dates</option>
              <option value="overdue">🚨 Overdue Tasks Only</option>
              <option value="due_soon">⏰ Due in Next 48 Hours</option>
            </select>
          </div>

          {/* Meeting Filter */}
          <div className="sm:col-span-2">
            <select
              value={meetingFilter}
              onChange={(e) => setMeetingFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600 truncate"
            >
              <option value="all">All Meetings</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Open / To Do */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-paper-300" />
                <h2 className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                  To Do / Open
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-paper-200 text-ink-400">
                {openActions.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[400px] p-2 rounded-2xl bg-paper-100/60 border border-paper-300/80">
              {openActions.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-100">
                  No open items matching filters
                </div>
              ) : (
                openActions.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    members={members}
                    onStatusChange={handleUpdateStatus}
                    onReassign={handleReassign}
                    onDelete={handleDeleteAction}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  In Progress
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {inProgressActions.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[400px] p-2 rounded-2xl bg-amber-50/40 border border-amber-200/80">
              {inProgressActions.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-100">
                  No tasks currently in progress
                </div>
              ) : (
                inProgressActions.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    members={members}
                    onStatusChange={handleUpdateStatus}
                    onReassign={handleReassign}
                    onDelete={handleDeleteAction}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tealAccent-600" />
                <h2 className="text-xs font-bold text-tealAccent-800 uppercase tracking-wider">
                  Completed
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-tealAccent-100 text-tealAccent-800">
                {doneActions.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[400px] p-2 rounded-2xl bg-tealAccent-50/30 border border-tealAccent-200/80">
              {doneActions.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-100">
                  No completed tasks yet
                </div>
              ) : (
                doneActions.map((item) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    members={members}
                    onStatusChange={handleUpdateStatus}
                    onReassign={handleReassign}
                    onDelete={handleDeleteAction}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-paper-300 rounded-2xl shadow-paper overflow-hidden">
          <div className="divide-y divide-paper-200">
            {filteredActions.length === 0 ? (
              <div className="p-12 text-center text-ink-100 text-sm">
                No action items found matching your filters.
              </div>
            ) : (
              filteredActions.map((item) => {
                const dueInfo = getDueStatus(item.dueDate);
                return (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            item.id,
                            item.status === 'done' ? 'open' : 'done'
                          )
                        }
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border transition-all ${
                          item.status === 'done'
                            ? 'bg-tealAccent-700 border-tealAccent-700 text-white'
                            : 'border-paper-300 bg-white hover:border-tealAccent-600'
                        }`}
                      >
                        {item.status === 'done' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-1 min-w-0">
                        <p
                          className={`text-sm font-semibold tracking-tight ${
                            item.status === 'done'
                              ? 'line-through text-ink-100'
                              : 'text-ink-500'
                          }`}
                        >
                          {item.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-100">
                          <Link
                            href={`/meetings/${item.meetingId}`}
                            className="hover:underline hover:text-tealAccent-700 font-medium"
                          >
                            📁 {item.meeting?.title}
                          </Link>

                          {item.origin === 'ai_suggested' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px]">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}

                          {item.carriedFrom && (
                            <span className="px-1.5 py-0.5 rounded bg-paper-200 text-ink-300 text-[10px]">
                              Carried over from {item.carriedFrom.meeting?.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Assignee select */}
                      <select
                        value={item.assigneeId || ''}
                        onChange={(e) => handleReassign(item.id, e.target.value)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                          item.assignee
                            ? 'bg-white border-paper-300 text-ink-400'
                            : 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                        }`}
                      >
                        <option value="">⚠️ Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>

                      {/* Due badge */}
                      {item.dueDate ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${
                            item.status === 'done'
                              ? 'bg-paper-100 border-paper-300 text-ink-200'
                              : dueInfo.isOverdue
                              ? 'bg-dangerRed-100 border-dangerRed-300 text-dangerRed-700 animate-pulse'
                              : dueInfo.isDueSoon
                              ? 'bg-amber-100 border-amber-300 text-amber-800'
                              : 'bg-paper-100 border-paper-300 text-ink-300'
                          }`}
                        >
                          {dueInfo.text}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-100 italic">No deadline</span>
                      )}

                      {/* Status quick toggle */}
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-paper-300 bg-white text-ink-400 font-semibold"
                      >
                        <option value="open">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>

                      <button
                        onClick={() => handleDeleteAction(item.id)}
                        className="p-1.5 text-ink-100 hover:text-dangerRed-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-ink-500/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-paper-300 rounded-2xl max-w-lg w-full p-6 shadow-paper-lg space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-ink-500 flex items-center gap-2">
              <Plus className="w-5 h-5 text-tealAccent-700" />
              <span>Create New Action Item</span>
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                  Task Description *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Finalize speaker flight tickets and airport pickup"
                  className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:ring-2 focus:ring-tealAccent-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                    Associate Meeting *
                  </label>
                  <select
                    required
                    value={newTaskMeetingId}
                    onChange={(e) => setNewTaskMeetingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                    Assignee
                  </label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                  >
                    <option value="">⚠️ Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                  >
                    <option value="open">To Do / Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-paper-300 bg-white text-ink-300 text-xs font-semibold hover:bg-paper-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white text-xs font-semibold shadow-paper"
                >
                  {creating ? 'Creating...' : 'Create Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Single Kanban Card Component
function TaskCard({
  item,
  members,
  onStatusChange,
  onReassign,
  onDelete,
}: {
  item: any;
  members: any[];
  onStatusChange: (id: string, status: string) => void;
  onReassign: (id: string, memberId: string) => void;
  onDelete: (id: string) => void;
}) {
  const dueInfo = getDueStatus(item.dueDate);

  return (
    <div className="bg-white border border-paper-300 rounded-xl p-4 shadow-paper hover:shadow-paper-md transition-all space-y-3">
      {/* Title and tags */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-xs sm:text-sm font-bold tracking-tight leading-snug ${
              item.status === 'done' ? 'line-through text-ink-100' : 'text-ink-500'
            }`}
          >
            {item.title}
          </p>

          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-ink-100 hover:text-dangerRed-600 transition-colors opacity-60 hover:opacity-100 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Origin tags & context */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <Link
            href={`/meetings/${item.meetingId}`}
            className="text-ink-200 hover:text-tealAccent-700 hover:underline font-medium truncate max-w-[180px]"
          >
            📁 {item.meeting?.title}
          </Link>

          {item.origin === 'ai_suggested' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
              <Sparkles className="w-2.5 h-2.5" /> AI
            </span>
          )}

          {item.carriedFrom && (
            <span className="px-1.5 py-0.2 rounded bg-paper-200 text-ink-300">
              Carried over
            </span>
          )}
        </div>
      </div>

      {/* Due date & Assignee Footer */}
      <div className="pt-2 border-t border-paper-200 flex items-center justify-between gap-2">
        {/* Assignee selector */}
        <select
          value={item.assigneeId || ''}
          onChange={(e) => onReassign(item.id, e.target.value)}
          className={`text-[11px] px-2 py-1 rounded-lg border font-medium max-w-[140px] truncate ${
            item.assignee
              ? 'bg-paper-50 border-paper-300 text-ink-400'
              : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
          }`}
        >
          <option value="">⚠️ Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Due status pill */}
        {item.dueDate ? (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              item.status === 'done'
                ? 'bg-paper-100 border-paper-300 text-ink-200'
                : dueInfo.isOverdue
                ? 'bg-dangerRed-100 border-dangerRed-300 text-dangerRed-700 animate-pulse'
                : dueInfo.isDueSoon
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-paper-100 border-paper-300 text-ink-300'
            }`}
          >
            {dueInfo.text}
          </span>
        ) : (
          <span className="text-[10px] text-ink-100 italic">No date</span>
        )}
      </div>

      {/* Quick Move Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {item.status === 'open' && (
          <>
            <button
              onClick={() => onStatusChange(item.id, 'in_progress')}
              className="py-1 px-2 rounded-lg bg-paper-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 text-ink-300 border border-paper-300 text-[10px] font-bold text-center transition-all"
            >
              Start Progress →
            </button>
            <button
              onClick={() => onStatusChange(item.id, 'done')}
              className="py-1 px-2 rounded-lg bg-tealAccent-50 hover:bg-tealAccent-100 text-tealAccent-800 border border-tealAccent-300 text-[10px] font-bold text-center transition-all"
            >
              Mark Done ✓
            </button>
          </>
        )}

        {item.status === 'in_progress' && (
          <>
            <button
              onClick={() => onStatusChange(item.id, 'open')}
              className="py-1 px-2 rounded-lg bg-paper-100 hover:bg-paper-200 text-ink-300 border border-paper-300 text-[10px] font-bold text-center transition-all"
            >
              ← Revert
            </button>
            <button
              onClick={() => onStatusChange(item.id, 'done')}
              className="py-1 px-2 rounded-lg bg-tealAccent-700 hover:bg-tealAccent-800 text-white text-[10px] font-bold text-center shadow-paper-sm transition-all"
            >
              Mark Done ✓
            </button>
          </>
        )}

        {item.status === 'done' && (
          <button
            onClick={() => onStatusChange(item.id, 'open')}
            className="col-span-2 py-1 px-2 rounded-lg bg-paper-100 hover:bg-paper-200 text-ink-300 border border-paper-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reopen Task
          </button>
        )}
      </div>
    </div>
  );
}
