'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Sparkles,
  AlertTriangle,
  FileText,
  Repeat,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MeetingDetailClientProps {
  initialMeeting: any;
  members: any[];
  otherMeetings: any[];
  currentUser: any;
}

export default function MeetingDetailClient({
  initialMeeting,
  members,
  otherMeetings,
  currentUser,
}: MeetingDetailClientProps) {
  const router = useRouter();
  const [meeting, setMeeting] = useState(initialMeeting);

  // Edit Mode states for Notes / Info
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editTitle, setEditTitle] = useState(meeting.title);
  const [editStartsAt, setEditStartsAt] = useState(
    new Date(meeting.startsAt).toISOString().slice(0, 16)
  );
  const [editAgenda, setEditAgenda] = useState(meeting.agenda || '');
  const [editNotes, setEditNotes] = useState(meeting.notes || '');
  const [editAttendeeIds, setEditAttendeeIds] = useState<string[]>(
    meeting.attendees.map((a: any) => a.memberId)
  );

  // New Decision input
  const [newDecisionText, setNewDecisionText] = useState('');
  const [addingDecision, setAddingDecision] = useState(false);

  // New Action Item input
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssigneeId, setNewActionAssigneeId] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [addingAction, setAddingAction] = useState(false);

  // Carry-over Modal state
  const [isCarryOverModalOpen, setIsCarryOverModalOpen] = useState(false);
  const [selectedCarryOverMeetingId, setSelectedCarryOverMeetingId] = useState(
    otherMeetings[0]?.id || ''
  );
  const [selectedCarryActionIds, setSelectedCarryActionIds] = useState<string[]>([]);
  const [carryingOver, setCarryingOver] = useState(false);

  // Raw Text Drawer
  const [showRawText, setShowRawText] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [copied, setCopied] = useState(false);

  const startToday = startOfDay(new Date());

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

  // Save edited meeting metadata
  const handleSaveMeetingDetails = async () => {
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          startsAt: new Date(editStartsAt).toISOString(),
          agenda: editAgenda.trim() || null,
          notes: editNotes.trim() || null,
          attendeeIds: editAttendeeIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting(data.meeting);
        setIsEditingMeeting(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to update meeting details', err);
    }
  };

  // Add Decision
  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecisionText.trim()) return;

    setAddingDecision(true);
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          text: newDecisionText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting({
          ...meeting,
          decisions: [...meeting.decisions, data.decision],
        });
        setNewDecisionText('');
      }
    } catch (err) {
      console.error('Failed to add decision', err);
    } finally {
      setAddingDecision(false);
    }
  };

  // Delete Decision
  const handleDeleteDecision = async (decisionId: string) => {
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMeeting({
          ...meeting,
          decisions: meeting.decisions.filter((d: any) => d.id !== decisionId),
        });
      }
    } catch (err) {
      console.error('Failed to delete decision', err);
    }
  };

  // Add Action Item
  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    setAddingAction(true);
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: meeting.id,
          title: newActionTitle.trim(),
          assigneeId: newActionAssigneeId || null,
          dueDate: newActionDueDate ? new Date(newActionDueDate).toISOString() : null,
          origin: 'manual',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting({
          ...meeting,
          actionItems: [...meeting.actionItems, data.actionItem],
        });
        setNewActionTitle('');
        setNewActionAssigneeId('');
        setNewActionDueDate('');
      }
    } catch (err) {
      console.error('Failed to add action item', err);
    } finally {
      setAddingAction(false);
    }
  };

  // Toggle Action Status
  const handleToggleActionStatus = async (action: any) => {
    const nextStatus = action.status === 'done' ? 'open' : 'done';
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting({
          ...meeting,
          actionItems: meeting.actionItems.map((a: any) =>
            a.id === action.id ? data.actionItem : a
          ),
        });
      }
    } catch (err) {
      console.error('Failed to update action status', err);
    }
  };

  // Update Action Assignee or Due Date
  const handleUpdateActionField = async (
    actionId: string,
    field: 'assigneeId' | 'dueDate',
    val: string
  ) => {
    try {
      const payload: any = {};
      if (field === 'assigneeId') payload.assigneeId = val || null;
      if (field === 'dueDate') payload.dueDate = val ? new Date(val).toISOString() : null;

      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting({
          ...meeting,
          actionItems: meeting.actionItems.map((a: any) =>
            a.id === actionId ? data.actionItem : a
          ),
        });
      }
    } catch (err) {
      console.error('Failed to update action', err);
    }
  };

  // Delete Action Item
  const handleDeleteAction = async (actionId: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMeeting({
          ...meeting,
          actionItems: meeting.actionItems.filter((a: any) => a.id !== actionId),
        });
      }
    } catch (err) {
      console.error('Failed to delete action item', err);
    }
  };

  // Carry Over Actions from prior meeting
  const handleExecuteCarryOver = async () => {
    if (!selectedCarryOverMeetingId) return;
    setCarryingOver(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}/carry-over`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMeetingId: selectedCarryOverMeetingId,
          actionItemIds:
            selectedCarryActionIds.length > 0 ? selectedCarryActionIds : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMeeting({
          ...meeting,
          actionItems: [...meeting.actionItems, ...data.carriedActions],
        });
        setIsCarryOverModalOpen(false);
        setSelectedCarryActionIds([]);
      }
    } catch (err) {
      console.error('Failed to carry over actions', err);
    } finally {
      setCarryingOver(false);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/meetings');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete meeting', err);
      setDeleting(false);
    }
  };

  const copySummary = () => {
    const lines = [
      `📋 *${meeting.title}* (${format(new Date(meeting.startsAt), 'MMM d, yyyy')})`,
      '',
      '🎯 *Decisions Agreed:*',
      ...meeting.decisions.map((d: any, i: number) => `${i + 1}. ${d.text}`),
      '',
      '⚡ *Action Items:*',
      ...meeting.actionItems.map(
        (a: any) =>
          `• [${a.status === 'done' ? '✓' : ' '}] ${a.title} (@${a.assignee?.name || 'Unassigned'}) - Due: ${
            a.dueDate ? format(new Date(a.dueDate), 'MMM d') : 'No deadline'
          }`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedActions = meeting.actionItems.filter((a: any) => a.status === 'done');
  const targetMeetingForCarry = otherMeetings.find(
    (m) => m.id === selectedCarryOverMeetingId
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-300 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/meetings"
            className="p-2 rounded-xl border border-paper-300 bg-white hover:bg-paper-200 text-ink-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-tealAccent-700 uppercase tracking-wider">
                Meeting Record
              </span>
              {getSourceBadge(meeting.source)}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink-500 tracking-tight">
              {meeting.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-200 text-ink-300 text-xs font-semibold shadow-paper-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Summary Copied!' : 'Copy Summary'}</span>
          </button>

          {otherMeetings.length > 0 && (
            <button
              onClick={() => setIsCarryOverModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold shadow-paper-sm transition-all"
            >
              <Repeat className="w-3.5 h-3.5 text-amber-600" />
              <span>Carry Over Actions</span>
            </button>
          )}

          <button
            onClick={() => setIsEditingMeeting(!isEditingMeeting)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-200 hover:bg-paper-300 text-ink-400 text-xs font-semibold border border-paper-300 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditingMeeting ? 'Cancel Edit' : 'Edit Info'}</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl text-ink-100 hover:text-dangerRed-600 hover:bg-dangerRed-50 transition-colors"
            title="Delete Meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editing Metadata Form */}
      {isEditingMeeting && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-paper space-y-4">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-amber-700" />
            <span>Edit Meeting Record Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-sm focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={editStartsAt}
                onChange={(e) => setEditStartsAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-sm focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
              Agenda Summary
            </label>
            <input
              type="text"
              value={editAgenda}
              onChange={(e) => setEditAgenda(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-sm focus:ring-2 focus:ring-tealAccent-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
              Discussion Notes
            </label>
            <textarea
              rows={4}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-sm focus:ring-2 focus:ring-tealAccent-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-300 uppercase mb-2">
              Attendees
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((member) => {
                const isChecked = editAttendeeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setEditAttendeeIds(editAttendeeIds.filter((id) => id !== member.id));
                      } else {
                        setEditAttendeeIds([...editAttendeeIds, member.id]);
                      }
                    }}
                    className={`p-2 rounded-lg border text-left text-xs ${
                      isChecked
                        ? 'bg-tealAccent-50 border-tealAccent-300 text-tealAccent-900 font-semibold'
                        : 'bg-white border-paper-200 text-ink-200'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditingMeeting(false)}
              className="px-3.5 py-1.5 rounded-xl border border-paper-300 bg-white text-ink-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMeetingDetails}
              className="px-4 py-1.5 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white text-xs font-semibold shadow-paper"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Info Overview Card */}
      {!isEditingMeeting && (
        <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs pb-3 border-b border-paper-200">
            <div className="flex items-center gap-4 text-ink-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-tealAccent-700" />
                <span className="font-semibold text-ink-500">
                  {format(new Date(meeting.startsAt), 'EEEE, MMMM d, yyyy • h:mm a')}
                </span>
              </div>
              <span>•</span>
              <span className="text-ink-100">
                Logged by {meeting.createdBy?.displayName || 'Team Member'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {meeting.decisions.length} Decisions
              </span>
              <span className="text-xs font-semibold text-tealAccent-800 bg-tealAccent-50 px-2 py-0.5 rounded border border-tealAccent-200">
                {completedActions.length}/{meeting.actionItems.length} Actions Done
              </span>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-100 block mb-1.5">
              Attendees Present ({meeting.attendees.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {meeting.attendees.map((a: any) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-paper-100 text-ink-400 font-medium text-xs border border-paper-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-tealAccent-600"></span>
                  <span>{a.member?.name}</span>
                  <span className="text-[10px] text-ink-100">({a.member?.role})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Agenda & Notes */}
          {meeting.agenda && (
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-100 block mb-1">
                Agenda Summary:
              </span>
              <p className="text-xs sm:text-sm text-ink-400 font-medium bg-paper-50 p-3 rounded-xl border border-paper-200">
                {meeting.agenda}
              </p>
            </div>
          )}

          {meeting.notes && (
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-100 block mb-1">
                Discussion Notes:
              </span>
              <div className="text-xs sm:text-sm text-ink-400 leading-relaxed bg-paper-50 p-3.5 rounded-xl border border-paper-200 whitespace-pre-wrap font-sans">
                {meeting.notes}
              </div>
            </div>
          )}

          {/* Raw Text Drawer Toggle */}
          {meeting.rawText && (
            <div className="pt-2">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-200 hover:text-ink-400 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Original Preserved Raw Transcript ({meeting.rawText.length} chars)</span>
                {showRawText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showRawText && (
                <div className="mt-2 p-3.5 bg-paper-200/70 border border-paper-300 rounded-xl text-xs font-mono text-ink-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {meeting.rawText}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section 2: Verified Decisions */}
      <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wider">
              Verified Decisions ({meeting.decisions.length})
            </h2>
          </div>
        </div>

        <p className="text-xs text-ink-100">
          Agreements confirmed and logged as historical system of record.
        </p>

        {meeting.decisions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-paper-300 rounded-xl text-xs text-ink-100">
            No decisions logged for this meeting yet.
          </div>
        ) : (
          <div className="divide-y divide-paper-200 border border-paper-200 rounded-xl overflow-hidden bg-paper-50/50">
            {meeting.decisions.map((decision: any, index: number) => (
              <div
                key={decision.id}
                className="p-3.5 flex items-start justify-between gap-3 hover:bg-paper-100/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-ink-500 leading-snug">
                    {decision.text}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteDecision(decision.id)}
                  className="p-1 text-ink-100 hover:text-dangerRed-600 transition-colors shrink-0"
                  title="Delete decision"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Decision Form */}
        <form onSubmit={handleAddDecision} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newDecisionText}
            onChange={(e) => setNewDecisionText(e.target.value)}
            placeholder="Add another decision agreed upon..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
          />
          <button
            type="submit"
            disabled={addingDecision || !newDecisionText.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Section 3: Action Items Table */}
      <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-tealAccent-700" />
            <h2 className="text-sm font-bold text-ink-500 uppercase tracking-wider">
              Action Items & Accountabilities ({meeting.actionItems.length})
            </h2>
          </div>
        </div>

        <p className="text-xs text-ink-100">
          Live accountability checklist. Status changes reflect immediately across the dashboard.
        </p>

        {meeting.actionItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-paper-300 rounded-xl text-xs text-ink-100">
            No action items assigned for this meeting yet.
          </div>
        ) : (
          <div className="divide-y divide-paper-200 border border-paper-200 rounded-xl overflow-hidden bg-white">
            {meeting.actionItems.map((action: any) => {
              const isDone = action.status === 'done';
              const isOverdue =
                !isDone && action.dueDate && isBefore(new Date(action.dueDate), startToday);
              const isDueToday = !isDone && action.dueDate && isToday(new Date(action.dueDate));

              return (
                <div
                  key={action.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDone ? 'bg-paper-50/70' : isOverdue ? 'bg-red-50/30' : 'hover:bg-paper-50/40'
                  }`}
                >
                  {/* Left: Checkbox + Title + Origin */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleActionStatus(action)}
                      className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center border transition-all ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-paper-300 bg-white hover:border-tealAccent-600'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-semibold text-ink-500 ${
                          isDone ? 'line-through text-ink-100' : ''
                        }`}
                      >
                        {action.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-100">
                        {action.origin === 'ai_suggested' && (
                          <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium border border-amber-200 text-[10px]">
                            <Sparkles className="w-2.5 h-2.5" /> AI Extracted
                          </span>
                        )}
                        {action.carriedFrom && (
                          <span className="inline-flex items-center gap-0.5 text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium border border-blue-200 text-[10px]">
                            <Repeat className="w-2.5 h-2.5" /> Carried from{' '}
                            {action.carriedFrom.meeting?.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Assignee selector + Due date selector + Delete */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
                    {/* Assignee select */}
                    <select
                      value={action.assigneeId || ''}
                      onChange={(e) =>
                        handleUpdateActionField(action.id, 'assigneeId', e.target.value)
                      }
                      className="px-2.5 py-1 rounded-lg border border-paper-300 bg-paper-50 text-ink-400 text-xs focus:ring-2 focus:ring-tealAccent-600"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>

                    {/* Due Date & Chips */}
                    <input
                      type="date"
                      value={action.dueDate ? new Date(action.dueDate).toISOString().slice(0, 10) : ''}
                      onChange={(e) =>
                        handleUpdateActionField(action.id, 'dueDate', e.target.value)
                      }
                      className="px-2 py-1 rounded-lg border border-paper-300 bg-paper-50 text-ink-400 text-xs focus:ring-2 focus:ring-tealAccent-600"
                    />

                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Overdue
                      </span>
                    )}

                    {isDueToday && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Today
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-1 text-ink-100 hover:text-dangerRed-600 transition-colors"
                      title="Delete action"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Action Item Form */}
        <form onSubmit={handleAddActionItem} className="pt-2 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Assign new task description..."
                className="w-full px-3.5 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={newActionAssigneeId}
                onChange={(e) => setNewActionAssigneeId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="date"
                value={newActionDueDate}
                onChange={(e) => setNewActionDueDate(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={addingAction || !newActionTitle.trim()}
                className="w-full h-full py-2 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-xs shadow-paper transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Carry-Over Unfinished Actions Modal */}
      {isCarryOverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-paper-300 rounded-2xl max-w-lg w-full p-6 shadow-paper-lg space-y-4">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-ink-500 text-base">
                  Carry Over Unfinished Actions
                </h3>
              </div>
              <button
                onClick={() => setIsCarryOverModalOpen(false)}
                className="p-1 text-ink-100 hover:text-ink-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-200 leading-relaxed">
              Select previous meetings to pull open and in-progress tasks into this meeting record without losing their original lineage.
            </p>

            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase mb-1">
                Source Meeting
              </label>
              <select
                value={selectedCarryOverMeetingId}
                onChange={(e) => {
                  setSelectedCarryOverMeetingId(e.target.value);
                  setSelectedCarryActionIds([]);
                }}
                className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
              >
                {otherMeetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.actionItems?.length || 0} open actions)
                  </option>
                ))}
              </select>
            </div>

            {targetMeetingForCarry && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-ink-300 uppercase">
                  Tasks Available ({targetMeetingForCarry.actionItems?.length || 0}):
                </span>
                {targetMeetingForCarry.actionItems?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-paper-50 text-center text-xs text-ink-100">
                    No open action items in this meeting!
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-paper-200 rounded-xl p-2 bg-paper-50">
                    {targetMeetingForCarry.actionItems.map((action: any) => {
                      const isSelected = selectedCarryActionIds.includes(action.id);
                      return (
                        <div
                          key={action.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCarryActionIds(
                                selectedCarryActionIds.filter((id) => id !== action.id)
                              );
                            } else {
                              setSelectedCarryActionIds([...selectedCarryActionIds, action.id]);
                            }
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-semibold'
                              : 'bg-white border-paper-200 text-ink-400'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate">{action.title}</p>
                            <span className="text-[10px] text-ink-100">
                              @{action.assignee?.name || 'Unassigned'}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-amber-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-paper-200">
              <button
                onClick={() => setIsCarryOverModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-paper-300 bg-white text-ink-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteCarryOver}
                disabled={carryingOver || targetMeetingForCarry?.actionItems?.length === 0}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-paper transition-all disabled:opacity-50"
              >
                {carryingOver
                  ? 'Carrying Over...'
                  : selectedCarryActionIds.length > 0
                  ? `Carry Over Selected (${selectedCarryActionIds.length})`
                  : 'Carry Over All Open Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-paper-lg space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-ink-500 text-base">Delete Meeting Record?</h3>
            </div>
            <p className="text-xs text-ink-200 leading-relaxed">
              Are you sure you want to permanently delete <strong>{meeting.title}</strong>? All associated decisions and action items will also be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-paper-200">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-paper-300 bg-white text-ink-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMeeting}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-dangerRed-600 hover:bg-dangerRed-700 text-white text-xs font-semibold shadow-paper transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
