'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  ListTodo,
  Users,
  Plus,
  Trash2,
  ArrowRight,
  Save,
  AlertCircle,
  Clock,
  RefreshCw,
  HelpCircle,
  FileCode,
  Zap,
} from 'lucide-react';

interface ImportClientProps {
  members: any[];
}

const SAMPLE_CHATS = {
  esummit: `[10/10/2026, 7:30:15 PM] Rahul Sharma: Hey team, quick sync on E-Summit 2026 speaker logistics and marketing.
[10/10/2026, 7:31:02 PM] Sneha Patil: Portal backend is ready. We verified the speaker registration portal with Razorpay payments.
[10/10/2026, 7:32:45 PM] Amit Verma: We approved ₹50,000 for speaker travel and stage setup. Let's make sure that's final.
[10/10/2026, 7:33:10 PM] Rahul Sharma: Agreed. Decision taken: ₹50,000 budget approved for stage and guest hospitality.
[10/10/2026, 7:34:20 PM] Rahul Sharma: @Sneha please deploy the attendee registration portal by Friday.
[10/10/2026, 7:35:05 PM] Sneha Patil: Got it, will ship by Friday evening.
[10/10/2026, 7:36:12 PM] Rahul Sharma: Amit, negotiate auditorium sound system vendor contract by tomorrow.
[10/10/2026, 7:37:40 PM] Priya Nair: I will finalize the sponsorship deck for seed investors by next Monday.
[10/10/2026, 7:38:15 PM] Rohan Gupta: I'll print 500 promotional posters and banners by Saturday.
[10/10/2026, 7:39:00 PM] Rahul Sharma: Perfect. That wraps up our sync.`,

  hackathon: `10/08/2026, 6:00 PM - Ananya Joshi: Team, let's finalize the 24-hour National Hackathon problem statements.
10/08/2026, 6:02 PM - Sneha Patil: We received 18 problem statements from industry sponsors (FinTech, HealthTech, AI).
10/08/2026, 6:05 PM - Rahul Sharma: Let's pick 6 core tracks. Decided: 6 sponsor-backed problem tracks for Hackathon.
10/08/2026, 6:07 PM - Ananya Joshi: I will draft the mentor evaluation rubric and scoring sheet by Thursday.
10/08/2026, 6:09 PM - Sneha: I'll set up GitHub Classroom and automated submission grading webhooks by Saturday.
10/08/2026, 6:11 PM - Rohan: I'll arrange Wi-Fi routers and LAN cables for 200 hackathon participants by Friday.
10/08/2026, 6:12 PM - Rahul: Make sure Red Bull and snack boxes are ordered by tomorrow, Amit.`,

  messy: `yo team meeting notes:
- discussed speaker gifts and stage lighting
- decided: partner with T-Hub for investor networking session
- decided: increase student ticket price to 299 in round 2
- Amit: submit budget breakdown to faculty advisor by tomorrow
- Priya: follow up with 10 venture capital funds for sponsorship by Friday
- Rohan: coordinate security pass approvals with campus dean by in 2 days
- Sneha: test live streaming setup for main auditorium by next Tuesday`,
};

export default function ImportClient({ members }: ImportClientProps) {
  const router = useRouter();

  const [rawText, setRawText] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('E-Cell Core Team Sync');
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [meetingSource, setMeetingSource] = useState('whatsapp_paste');

  // Extraction State
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Editable review states
  const [reviewDecisions, setReviewDecisions] = useState<{ text: string }[]>([]);
  const [reviewActions, setReviewActions] = useState<
    {
      title: string;
      rawAssignee?: string;
      assigneeId?: string;
      rawDueDate?: string;
      dueDate?: string;
      confidence?: string;
      status: string;
    }[]
  >([]);
  const [reviewAttendees, setReviewAttendees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load sample text
  const loadSample = (key: 'esummit' | 'hackathon' | 'messy') => {
    setRawText(SAMPLE_CHATS[key]);
    if (key === 'esummit') setMeetingTitle('E-Summit 2026 Speaker & Marketing Sync');
    if (key === 'hackathon') setMeetingTitle('National Hackathon 2026 Logistics');
    if (key === 'messy') setMeetingTitle('Core Team Quick Alignment');
    setExtractionResult(null);
    setError('');
  };

  // Handle File Upload (.txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setMeetingTitle(cleanName || 'Imported WhatsApp Chat');
        setExtractionResult(null);
      }
    };
    reader.readAsText(file);
  };

  // Run AI Extraction
  const handleExtract = async () => {
    if (!rawText.trim()) {
      setError('Please paste text or select a sample transcript first.');
      return;
    }

    setError('');
    setExtracting(true);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          baseDate: new Date(meetingDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Extraction failed. Try manual entry or check input.');
        setExtracting(false);
        return;
      }

      const ext = data.data;
      setExtractionResult(ext);
      if (ext.title && ext.title !== 'Meeting') {
        setMeetingTitle(ext.title);
      }

      setReviewDecisions(
        (ext.decisions || []).map((d: any) => ({
          text: typeof d === 'string' ? d : d.text,
        }))
      );

      setReviewActions(
        (ext.actionItems || []).map((a: any) => ({
          title: a.title,
          rawAssignee: a.rawAssignee,
          assigneeId: a.assigneeId || '',
          rawDueDate: a.rawDueDate,
          dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : '',
          confidence: a.confidence || 'fuzzy_matched',
          status: 'open',
        }))
      );

      setReviewAttendees(ext.attendeeIds || members.map((m) => m.id));
    } catch (err: any) {
      setError('Connection error while calling extraction API.');
    } finally {
      setExtracting(false);
    }
  };

  // Decision editing
  const addDecision = () => setReviewDecisions([...reviewDecisions, { text: '' }]);
  const removeDecision = (idx: number) =>
    setReviewDecisions(reviewDecisions.filter((_, i) => i !== idx));
  const updateDecision = (idx: number, val: string) => {
    const copy = [...reviewDecisions];
    copy[idx].text = val;
    setReviewDecisions(copy);
  };

  // Action item editing
  const addAction = () =>
    setReviewActions([
      ...reviewActions,
      { title: '', assigneeId: '', dueDate: '', status: 'open' },
    ]);
  const removeAction = (idx: number) =>
    setReviewActions(reviewActions.filter((_, i) => i !== idx));
  const updateAction = (idx: number, field: string, val: string) => {
    const copy = [...reviewActions];
    copy[idx] = { ...copy[idx], [field]: val };
    setReviewActions(copy);
  };

  // Save to Database
  const handleSaveToMeeting = async () => {
    if (!meetingTitle.trim()) {
      setError('Meeting title is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: meetingTitle.trim(),
        startsAt: new Date(meetingDate).toISOString(),
        source: meetingSource,
        notes: extractionResult?.summary || rawText.slice(0, 500),
        rawText: rawText.trim(),
        attendeeIds: reviewAttendees,
        decisions: reviewDecisions.filter((d) => d.text.trim().length > 0),
        actionItems: reviewActions
          .filter((a) => a.title.trim().length > 0)
          .map((a) => ({
            title: a.title.trim(),
            assigneeId: a.assigneeId || null,
            dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : null,
            status: a.status || 'open',
            origin: 'ai_suggested',
          })),
      };

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save meeting record');
        setSaving(false);
        return;
      }

      router.push(`/meetings/${data.meeting.id}`);
      router.refresh();
    } catch (err) {
      setError('Connection error while saving record');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-paper-300 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shadow-paper-sm">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink-500 tracking-tight">
              AI Import & NLP Extractor
            </h1>
            <p className="text-xs sm:text-sm text-ink-100">
              Paste messy WhatsApp exports, Meet transcripts, or audio notes to propose decisions and action items with human-in-the-loop review.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Section */}
      <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-ink-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-tealAccent-700" />
            <span>Raw WhatsApp Export or Transcript</span>
          </label>

          {/* Quick Demo Samples */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink-100 font-semibold text-[11px] mr-1">
              1-Click Demo Samples:
            </span>
            <button
              type="button"
              onClick={() => loadSample('esummit')}
              className="px-2.5 py-1 rounded-lg bg-paper-100 hover:bg-tealAccent-50 hover:text-tealAccent-800 text-ink-300 font-medium border border-paper-300 transition-all"
            >
              WhatsApp E-Summit
            </button>
            <button
              type="button"
              onClick={() => loadSample('hackathon')}
              className="px-2.5 py-1 rounded-lg bg-paper-100 hover:bg-tealAccent-50 hover:text-tealAccent-800 text-ink-300 font-medium border border-paper-300 transition-all"
            >
              Hackathon Logistics
            </button>
            <button
              type="button"
              onClick={() => loadSample('messy')}
              className="px-2.5 py-1 rounded-lg bg-paper-100 hover:bg-tealAccent-50 hover:text-tealAccent-800 text-ink-300 font-medium border border-paper-300 transition-all"
            >
              Messy Notes
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste exported WhatsApp chat (.txt format) or Google Meet live transcript here..."
            className="w-full p-4 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tealAccent-600 focus:bg-white transition-all leading-relaxed"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/90 border border-paper-300 hover:bg-paper-100 text-ink-300 text-xs font-semibold cursor-pointer shadow-paper-sm transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .txt</span>
              <input
                type="file"
                accept=".txt,.log"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Meeting metadata bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-ink-300 uppercase mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-300 uppercase mb-1">
              Date & Time Context
            </label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-300 uppercase mb-1">
              Source Tag
            </label>
            <select
              value={meetingSource}
              onChange={(e) => setMeetingSource(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-paper-50 text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
            >
              <option value="whatsapp_paste">WhatsApp Chat Export (.txt)</option>
              <option value="meet">Google Meet Transcript</option>
              <option value="speech">Voice Dictation</option>
              <option value="manual">Direct Notes</option>
            </select>
          </div>
        </div>

        {/* Extract Action Button */}
        <div className="flex items-center justify-between pt-3 border-t border-paper-200">
          <div className="flex items-center gap-2 text-xs text-ink-100">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Dual-engine: AI (LLM) with offline rule-based heuristic fallback</span>
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !rawText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-sm shadow-paper transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {extracting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{extracting ? 'Extracting Decisions & Actions...' : 'Extract Decisions & Actions'}</span>
          </button>
        </div>
      </div>

      {/* Review Section (Human-in-the-loop review table) */}
      {extractionResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Engine & Summary Banner */}
          <div className="bg-gradient-to-r from-tealAccent-50 via-white to-amber-50 border border-tealAccent-200 rounded-2xl p-4 sm:p-5 shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-tealAccent-800 uppercase tracking-wider">
                  Extraction Complete
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-tealAccent-700 border border-tealAccent-300">
                  Engine: {extractionResult.extractionMethod || 'AI Extractor'}
                </span>
              </div>
              <p className="text-xs text-ink-300">
                {extractionResult.summary || 'Decisions, assignees, and relative dates have been resolved.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                {reviewDecisions.length} Decisions
              </span>
              <span className="text-xs font-bold text-tealAccent-800 bg-tealAccent-100 px-2.5 py-1 rounded-lg">
                {reviewActions.length} Action Items
              </span>
            </div>
          </div>

          {/* Attendees Review */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 shadow-paper space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-tealAccent-700" />
                <span>Attendees Detected ({reviewAttendees.length}/{members.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {members.map((member) => {
                const isSelected = reviewAttendees.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setReviewAttendees(reviewAttendees.filter((id) => id !== member.id));
                      } else {
                        setReviewAttendees([...reviewAttendees, member.id]);
                      }
                    }}
                    className={`p-2 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-tealAccent-50 border-tealAccent-300 text-tealAccent-900 font-semibold'
                        : 'bg-paper-50 border-paper-200 text-ink-200 opacity-60'
                    }`}
                  >
                    <p className="truncate">{member.name}</p>
                    <span className="text-[10px] text-ink-100 font-normal">{member.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decisions Review Table */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">
                  Review Decisions Agreed
                </h3>
              </div>
              <button
                type="button"
                onClick={addDecision}
                className="inline-flex items-center gap-1 text-xs font-bold text-tealAccent-700 bg-tealAccent-50 px-2.5 py-1 rounded-lg border border-tealAccent-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Decision
              </button>
            </div>

            {reviewDecisions.length === 0 ? (
              <div className="p-4 rounded-xl bg-paper-50 text-center text-xs text-ink-100">
                No explicit decisions detected. You can add one manually.
              </div>
            ) : (
              <div className="space-y-2">
                {reviewDecisions.map((d, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={d.text}
                      onChange={(e) => updateDecision(index, e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeDecision(index)}
                      className="p-1.5 text-ink-100 hover:text-dangerRed-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Items Review Table */}
          <div className="bg-white border border-paper-300 rounded-2xl p-5 sm:p-6 shadow-paper space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-tealAccent-700" />
                <h3 className="text-sm font-bold text-ink-500 uppercase tracking-wider">
                  Review Action Items & Assigned Deadlines
                </h3>
              </div>
              <button
                type="button"
                onClick={addAction}
                className="inline-flex items-center gap-1 text-xs font-bold text-tealAccent-700 bg-tealAccent-50 px-2.5 py-1 rounded-lg border border-tealAccent-200"
              >
                <Plus className="w-3.5 h-3.5" /> Add Action Item
              </button>
            </div>

            <p className="text-xs text-ink-100">
              Verify owners matched from names/aliases and confirmed natural language due dates before saving.
            </p>

            {reviewActions.length === 0 ? (
              <div className="p-4 rounded-xl bg-paper-50 text-center text-xs text-ink-100">
                No action items detected. Add tasks manually above.
              </div>
            ) : (
              <div className="space-y-3">
                {reviewActions.map((action, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-paper-200 bg-paper-50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink-300">
                        Task #{index + 1}
                      </span>
                      {action.rawAssignee && (
                        <span className="text-[10px] text-ink-100 font-mono">
                          Raw mention: &quot;{action.rawAssignee}&quot;
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-bold text-ink-100 uppercase mb-1">
                          Task Description
                        </label>
                        <input
                          type="text"
                          value={action.title}
                          onChange={(e) => updateAction(index, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs sm:text-sm focus:ring-2 focus:ring-tealAccent-600"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-ink-100 uppercase mb-1">
                          Assignee (Fuzzy Matched)
                        </label>
                        <select
                          value={action.assigneeId || ''}
                          onChange={(e) => updateAction(index, 'assigneeId', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                        >
                          <option value="">⚠️ Unassigned</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-ink-100 uppercase mb-1">
                          Resolved Due Date
                        </label>
                        <input
                          type="date"
                          value={action.dueDate || ''}
                          onChange={(e) => updateAction(index, 'dueDate', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-paper-300 bg-white text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-1.5 text-ink-100 hover:text-dangerRed-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Footer Bar */}
          <div className="flex items-center justify-between p-4 bg-white border border-paper-300 rounded-2xl shadow-paper">
            <div className="text-xs text-ink-200">
              Saving creates a permanent meeting record with verified decisions and assigned tasks.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setExtractionResult(null)}
                className="px-4 py-2 rounded-xl border border-paper-300 bg-white text-ink-300 text-xs font-semibold hover:bg-paper-100"
              >
                Discard & Retry
              </button>

              <button
                type="button"
                onClick={handleSaveToMeeting}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-semibold text-sm shadow-paper transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Meeting Record...' : 'Confirm & Save Meeting'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
