'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface NewMeetingFormProps {
  members: any[];
}

export default function NewMeetingForm({ members }: NewMeetingFormProps) {
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(
    new Date().toISOString().slice(0, 16) // format for datetime-local
  );
  const [source, setSource] = useState('manual');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>(
    members.map((m) => m.id) // Default all checked
  );

  // Dynamic Decisions
  const [decisions, setDecisions] = useState<{ text: string }[]>([
    { text: '' },
  ]);

  // Dynamic Action Items
  const [actionItems, setActionItems] = useState<
    { title: string; assigneeId: string; dueDate: string }[]
  >([{ title: '', assigneeId: '', dueDate: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleAttendee = (id: string) => {
    if (selectedAttendeeIds.includes(id)) {
      setSelectedAttendeeIds(selectedAttendeeIds.filter((mId) => mId !== id));
    } else {
      setSelectedAttendeeIds([...selectedAttendeeIds, id]);
    }
  };

  const addDecisionRow = () => {
    setDecisions([...decisions, { text: '' }]);
  };

  const removeDecisionRow = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  const updateDecision = (index: number, text: string) => {
    const updated = [...decisions];
    updated[index].text = text;
    setDecisions(updated);
  };

  const addActionRow = () => {
    setActionItems([
      ...actionItems,
      { title: '', assigneeId: '', dueDate: '' },
    ]);
  };

  const removeActionRow = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: string) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        source,
        agenda: agenda.trim() || null,
        notes: notes.trim() || null,
        attendeeIds: selectedAttendeeIds,
        decisions: decisions.filter((d) => d.text.trim().length > 0),
        actionItems: actionItems
          .filter((a) => a.title.trim().length > 0)
          .map((a) => ({
            title: a.title.trim(),
            assigneeId: a.assigneeId || null,
            dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : null,
            status: 'open',
          })),
      };

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create meeting');
        setLoading(false);
        return;
      }

      router.push(`/meetings/${data.meeting.id}`);
      router.refresh();
    } catch (err: any) {
      setError('Connection error while saving meeting.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-paper-300 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/meetings"
            className="p-2 rounded-xl border border-paper-300 bg-white hover:bg-paper-200 text-ink-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight">
              Log New Meeting
            </h1>
            <p className="text-xs text-ink-100">
              Record discussion, verified decisions, and assigned accountability
            </p>
          </div>
        </div>

        <Link
          href="/import"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold shadow-paper-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Import from WhatsApp instead</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Details */}
        <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
          <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-tealAccent-700" />
            <span>Meeting Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Core Team Weekly Sync #12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Meeting Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              >
                <option value="manual">Direct Notes</option>
                <option value="speech">Web Speech Voice Dictation</option>
                <option value="whatsapp_paste">WhatsApp Chat Export</option>
                <option value="meet">Google Meet Capture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
                Agenda Summary
              </label>
              <input
                type="text"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="Key goals discussed..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>
          </div>

          {/* Attendees Selector */}
          <div>
            <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Attendees Present ({selectedAttendeeIds.length}/{members.length})</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedAttendeeIds(
                    selectedAttendeeIds.length === members.length
                      ? []
                      : members.map((m) => m.id)
                  )
                }
                className="text-xs text-tealAccent-700 hover:underline font-normal normal-case"
              >
                {selectedAttendeeIds.length === members.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((member) => {
                const isSelected = selectedAttendeeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAttendee(member.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-tealAccent-50 border-tealAccent-300 text-tealAccent-900 font-semibold'
                        : 'bg-paper-50 border-paper-200 text-ink-200 hover:bg-paper-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected
                          ? 'bg-tealAccent-700 border-tealAccent-700 text-white'
                          : 'border-paper-300 bg-white'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                    <div className="truncate">
                      <p className="truncate">{member.name}</p>
                      <p className="text-[10px] text-ink-100 font-normal">{member.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-ink-300 uppercase tracking-wider mb-1.5">
              Discussion Notes / Minutes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detailed notes on what was discussed, progress updates, and context..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
            />
          </div>
        </div>

        {/* Section 2: Decisions Made */}
        <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Decisions Agreed</span>
            </h2>
            <button
              type="button"
              onClick={addDecisionRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-tealAccent-700 hover:text-tealAccent-800 bg-tealAccent-50 px-2.5 py-1 rounded-lg border border-tealAccent-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Decision</span>
            </button>
          </div>

          <p className="text-xs text-ink-100">
            Explicit agreements made during the meeting that bind the team.
          </p>

          <div className="space-y-2.5">
            {decisions.map((decision, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={decision.text}
                  onChange={(e) => updateDecision(index, e.target.value)}
                  placeholder="e.g., Approved ₹45,000 budget for venue and speaker hospitality"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
                />
                {decisions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDecisionRow(index)}
                    className="p-2 text-ink-100 hover:text-dangerRed-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Action Items & Owners */}
        <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-tealAccent-700" />
              <span>Action Items & Accountabilities</span>
            </h2>
            <button
              type="button"
              onClick={addActionRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-tealAccent-700 hover:text-tealAccent-800 bg-tealAccent-50 px-2.5 py-1 rounded-lg border border-tealAccent-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Item</span>
            </button>
          </div>

          <p className="text-xs text-ink-100">
            Clear tasks with a single owner and strict deadline.
          </p>

          <div className="space-y-3">
            {actionItems.map((action, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl border border-paper-200 bg-paper-50 items-center"
              >
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={action.title}
                    onChange={(e) => updateAction(index, 'title', e.target.value)}
                    placeholder="Task description..."
                    className="w-full px-3 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={action.assigneeId}
                    onChange={(e) => updateAction(index, 'assigneeId', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
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
                    value={action.dueDate}
                    onChange={(e) => updateAction(index, 'dueDate', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  {actionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActionRow(index)}
                      className="p-1.5 text-ink-100 hover:text-dangerRed-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-300">
          <Link
            href="/meetings"
            className="px-4 py-2.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-200 text-ink-300 font-semibold text-sm transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-sm shadow-paper transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating Meeting...' : 'Save Meeting Record'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
