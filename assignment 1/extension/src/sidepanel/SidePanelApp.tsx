import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Calendar,
  User,
  Clock,
  ExternalLink,
  Settings,
  Key,
  CheckCircle2,
  AlertCircle,
  FileText,
  ListTodo,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  getConfig,
  setConfig,
  clearConfig,
  verifyToken,
  getMembers,
  createMeeting,
  extractAiItems,
  DEFAULT_API_URL,
  DEMO_API_TOKEN,
} from '../lib/api';

interface DecisionDraft {
  id: string;
  text: string;
}

interface ActionDraft {
  id: string;
  title: string;
  assigneeId: string | null;
  dueDate: string | null;
  dueDateText?: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
}

export default function SidePanelApp() {
  // Auth state
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [apiToken, setApiToken] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Meeting metadata
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingSource, setMeetingSource] = useState<'speech' | 'manual' | 'meet' | 'whatsapp_capture'>('speech');
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');

  // Structured drafts
  const [decisions, setDecisions] = useState<DecisionDraft[]>([]);
  const [actions, setActions] = useState<ActionDraft[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<{ id: string; title: string } | null>(null);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  // Initial load: check auth & storage
  useEffect(() => {
    loadAuth();

    // Listen for messages from content scripts (Meet / WhatsApp)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      const messageListener = (msg: any) => {
        if (msg.type === 'SET_MEETING_TITLE') {
          setMeetingTitle(msg.title || '');
          setMeetingSource(msg.source || 'meet');
        } else if (msg.type === 'APPEND_TRANSCRIPT') {
          setTranscript((prev) => (prev ? `${prev}\n\n${msg.text}` : msg.text));
          if (msg.source) setMeetingSource(msg.source);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, []);

  const loadAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const config = await getConfig();
      setApiUrl(config.apiUrl || DEFAULT_API_URL);
      setApiToken(config.apiToken || '');

      if (config.apiToken) {
        try {
          const user = await verifyToken(config.apiToken, config.apiUrl || DEFAULT_API_URL);
          setCurrentUser(user);
          await setConfig({ currentUser: user });
          loadMembersData();
        } catch (err: any) {
          console.warn('Token validation failed:', err);
          // Token might need re-entry
        }
      }
    } catch (e: any) {
      setAuthError(e.message || 'Failed to load credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadMembersData = async () => {
    try {
      const res = await getMembers();
      if (res && res.members) {
        setMembers(res.members);
      }
    } catch (err) {
      console.warn('Could not load team roster:', err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) return;

    setAuthLoading(true);
    setAuthError('');

    try {
      const user = await verifyToken(apiToken.trim(), apiUrl.trim());
      setCurrentUser(user);
      await setConfig({
        apiUrl: apiUrl.trim(),
        apiToken: apiToken.trim(),
        currentUser: user,
      });
      setShowSettings(false);
      loadMembersData();
    } catch (err: any) {
      setAuthError(err.message || 'Connection failed. Check API URL and Token.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUseDemoToken = () => {
    setApiToken(DEMO_API_TOKEN);
    setApiUrl(DEFAULT_API_URL);
  };

  const handleDisconnect = async () => {
    await clearConfig();
    setCurrentUser(null);
    setApiToken('');
    setShowSettings(true);
  };

  // Web Speech API Handlers
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setRecognitionError('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError('Web Speech API is not supported in this browser. Use Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalized = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalized += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (finalized) {
          setTranscript((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed}\n${finalized.trim()}` : finalized.trim();
          });
        }
        setInterimText(interim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone access denied. Grant permission in Chrome settings.');
        } else if (event.error !== 'no-speech') {
          setRecognitionError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setRecognitionError(err.message || 'Failed to start speech recognition');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
  };

  // Quick Promotion helpers
  const handlePromoteSelection = (type: 'decision' | 'action') => {
    let selected = '';
    if (transcriptRef.current) {
      const start = transcriptRef.current.selectionStart;
      const end = transcriptRef.current.selectionEnd;
      selected = transcript.substring(start, end).trim();
    }

    if (!selected) {
      // If nothing selected, promote the last non-empty line
      const lines = transcript
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      selected = lines[lines.length - 1] || '';
    }

    if (!selected) {
      alert('Type or select some text in the notes area first.');
      return;
    }

    if (type === 'decision') {
      setDecisions((prev) => [
        ...prev,
        { id: Math.random().toString(), text: selected.replace(/^([-\*•]|\d+\.)\s*/, '') },
      ]);
    } else {
      setActions((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          title: selected.replace(/^([-\*•]|\d+\.)\s*/, ''),
          assigneeId: null,
          dueDate: null,
        },
      ]);
    }
  };

  // AI Extraction
  const handleAiExtract = async () => {
    if (!transcript.trim()) {
      alert('Please add some speech notes or text to extract items.');
      return;
    }

    setAiExtracting(true);
    try {
      const data = await extractAiItems(transcript);

      if (data.decisions && Array.isArray(data.decisions)) {
        const newDecisions: DecisionDraft[] = data.decisions.map((d: any) => ({
          id: Math.random().toString(),
          text: typeof d === 'string' ? d : d.text,
        }));
        setDecisions((prev) => [...prev, ...newDecisions]);
      }

      if (data.actions && Array.isArray(data.actions)) {
        const newActions: ActionDraft[] = data.actions.map((a: any) => {
          let matchedAssigneeId: string | null = null;
          if (a.matchedMemberId) {
            matchedAssigneeId = a.matchedMemberId;
          } else if (a.assigneeName) {
            const m = members.find(
              (mem) => mem.name.toLowerCase() === a.assigneeName.toLowerCase()
            );
            if (m) matchedAssigneeId = m.id;
          }

          return {
            id: Math.random().toString(),
            title: a.title,
            assigneeId: matchedAssigneeId,
            dueDate: a.resolvedDueDate || null,
            dueDateText: a.rawDueDateText || a.dueDate || '',
          };
        });
        setActions((prev) => [...prev, ...newActions]);
      }

      if (!meetingTitle && data.suggestedTitle) {
        setMeetingTitle(data.suggestedTitle);
      }
    } catch (err: any) {
      alert(`AI Extraction Error: ${err.message || 'Check server connection'}`);
    } finally {
      setAiExtracting(false);
    }
  };

  // Save Meeting
  const handleSaveMeeting = async () => {
    if (!meetingTitle.trim()) {
      alert('Please enter a meeting title.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      const payload = {
        title: meetingTitle.trim(),
        startsAt: new Date().toISOString(),
        notes: transcript,
        rawText: transcript,
        source: meetingSource,
        decisions: decisions.map((d) => ({ text: d.text })),
        actionItems: actions.map((a) => ({
          title: a.title,
          assigneeId: a.assigneeId || null,
          dueDate: a.dueDate || null,
          origin: 'extension_capture',
        })),
      };

      const res = await createMeeting(payload);
      if (res && res.meeting) {
        setSaveSuccess({ id: res.meeting.id, title: res.meeting.title });
        // Reset form
        setMeetingTitle('');
        setTranscript('');
        setDecisions([]);
        setActions([]);
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Render Auth Setup if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-tealAccent-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-200 font-semibold">Connecting to E-Cell Hub...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || showSettings) {
    return (
      <div className="min-h-screen bg-paper p-4 text-ink-500 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-paper-300 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-tealAccent-700 flex items-center justify-center text-white font-bold text-xs shadow-paper-sm">
                E
              </div>
              <span className="font-extrabold text-sm tracking-tight">E-Cell Notetaker</span>
            </div>
            {currentUser && (
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-ink-200 hover:text-ink-400 font-semibold"
              >
                Back
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-ink-500">Connect Companion</h2>
            <p className="text-xs text-ink-100">
              Enter your web dashboard API Token to sync live voice notes, decisions, and action items.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick Demo Pre-seed Button */}
          <button
            type="button"
            onClick={handleUseDemoToken}
            className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between hover:bg-amber-100/70 transition-all text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Use Pre-Seeded Demo Token</span>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">
              1-Click
            </span>
          </button>

          <form onSubmit={handleConnect} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-1">
                Dashboard URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-xs focus:ring-2 focus:ring-tealAccent-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-1">
                Bearer API Token
              </label>
              <input
                type="password"
                required
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="ecell_ext_token_..."
                className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 text-xs font-mono focus:ring-2 focus:ring-tealAccent-600"
              />
              <p className="text-[10px] text-ink-100 mt-1">
                Generate tokens under <strong className="text-ink-300">Settings & Integrations</strong> in the web dashboard.
              </p>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-bold text-xs shadow-paper transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>{authLoading ? 'Verifying...' : 'Connect to Dashboard'}</span>
            </button>
          </form>
        </div>

        {currentUser && (
          <div className="pt-4 border-t border-paper-300">
            <button
              onClick={handleDisconnect}
              className="w-full py-2 text-xs text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
            >
              Disconnect Account
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Capture Side Panel UI
  return (
    <div className="min-h-screen bg-paper text-ink-500 flex flex-col justify-between p-3.5 space-y-4">
      {/* Top App Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-paper-300 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-tealAccent-700 flex items-center justify-center text-white font-bold text-xs shadow-paper-sm">
              E
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs tracking-tight">E-Cell Capture</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-ink-200">
                {currentUser.displayName || currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={`${apiUrl}/home`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-200 hover:text-ink-400 transition-all"
              title="Open Web Dashboard"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-200 hover:text-ink-400 transition-all"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Save Success Banner */}
        {saveSuccess && (
          <div className="p-3 rounded-xl bg-tealAccent-50 border border-tealAccent-200 text-tealAccent-900 text-xs space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-tealAccent-700" />
                <span>Meeting Saved!</span>
              </span>
              <button
                onClick={() => setSaveSuccess(null)}
                className="text-tealAccent-700 hover:underline text-[10px]"
              >
                Dismiss
              </button>
            </div>
            <p className="text-[11px] text-tealAccent-800 truncate">"{saveSuccess.title}"</p>
            <a
              href={`${apiUrl}/meetings/${saveSuccess.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-tealAccent-800 underline mt-0.5"
            >
              <span>View in Dashboard</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Meeting Title Input */}
        <div className="space-y-1">
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="Meeting Title (e.g. Core Team Sprint #4)"
            className="w-full px-3 py-2 rounded-xl border border-paper-300 bg-white text-ink-500 font-bold text-xs focus:ring-2 focus:ring-tealAccent-600 shadow-paper-sm"
          />
        </div>

        {/* Speech Dictation Record Pill Button */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-paper transition-all ${
                isRecording
                  ? 'bg-dangerRed-600 text-white animate-pulse'
                  : 'bg-tealAccent-700 hover:bg-tealAccent-800 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop Speech Notes</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Live Speech Notes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleAiExtract}
              disabled={aiExtracting || !transcript.trim()}
              className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 shadow-paper-sm transition-all disabled:opacity-40"
              title="Auto-extract decisions and action items using AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{aiExtracting ? 'Extracting...' : 'AI Extract'}</span>
            </button>
          </div>

          {recognitionError && (
            <p className="text-[10px] text-red-600 font-medium px-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{recognitionError}</span>
            </p>
          )}

          {isRecording && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-[11px] text-red-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="truncate italic">
                {interimText || 'Listening... speak clearly into your mic'}
              </span>
            </div>
          )}
        </div>

        {/* Transcript / Notes Editable Box */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-ink-300">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-tealAccent-700" />
              <span>Live Notes & Transcript</span>
            </span>
            <span className="text-[10px] text-ink-100 font-normal">
              {transcript.split('\n').filter(Boolean).length} lines
            </span>
          </div>

          <textarea
            ref={transcriptRef}
            rows={5}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Live speech transcript will append here. You can also paste notes or type manually..."
            className="w-full p-2.5 rounded-xl border border-paper-300 bg-white text-ink-500 font-mono text-[11px] leading-relaxed resize-y focus:ring-2 focus:ring-tealAccent-600 shadow-paper-sm"
          />

          {/* Quick Line Promotion Toolbar */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-semibold text-ink-100">Promote selection:</span>
            <button
              type="button"
              onClick={() => handlePromoteSelection('decision')}
              className="px-2 py-0.5 rounded-lg bg-paper-200 hover:bg-paper-300 text-ink-400 font-bold text-[10px] transition-all flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5 text-tealAccent-700" />
              <span>+ Decision</span>
            </button>
            <button
              type="button"
              onClick={() => handlePromoteSelection('action')}
              className="px-2 py-0.5 rounded-lg bg-paper-200 hover:bg-paper-300 text-ink-400 font-bold text-[10px] transition-all flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5 text-tealAccent-700" />
              <span>+ Action</span>
            </button>
          </div>
        </div>

        {/* Decisions List Section */}
        {decisions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-paper-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-ink-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-tealAccent-700" />
                <span>Decisions Agreed ({decisions.length})</span>
              </span>
            </div>

            <div className="space-y-1">
              {decisions.map((d, index) => (
                <div
                  key={d.id}
                  className="p-2 rounded-lg bg-tealAccent-50/70 border border-tealAccent-200 flex items-start justify-between gap-2 text-xs"
                >
                  <span className="font-medium text-tealAccent-900 leading-snug flex-1">
                    {index + 1}. {d.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDecisions(decisions.filter((item) => item.id !== d.id))}
                    className="text-tealAccent-700 hover:text-dangerRed-600 p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items List Section */}
        {actions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-paper-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-ink-400">
              <span className="flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5 text-amber-700" />
                <span>Action Items ({actions.length})</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="p-2 rounded-xl bg-white border border-paper-300 shadow-paper-sm space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-ink-500 leading-snug flex-1">
                      {act.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActions(actions.filter((a) => a.id !== act.id))}
                      className="text-ink-100 hover:text-dangerRed-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Assignee & Due Date selector */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <div className="flex-1">
                      <select
                        value={act.assigneeId || ''}
                        onChange={(e) =>
                          setActions(
                            actions.map((a) =>
                              a.id === act.id ? { ...a, assigneeId: e.target.value || null } : a
                            )
                          )
                        }
                        className="w-full px-2 py-1 rounded-lg border border-paper-300 bg-paper-50 text-ink-400 font-semibold focus:ring-1 focus:ring-tealAccent-600"
                      >
                        <option value="">👤 Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="date"
                        value={act.dueDate ? act.dueDate.split('T')[0] : ''}
                        onChange={(e) =>
                          setActions(
                            actions.map((a) =>
                              a.id === act.id ? { ...a, dueDate: e.target.value || null } : a
                            )
                          )
                        }
                        className="w-full px-1.5 py-1 rounded-lg border border-paper-300 bg-paper-50 text-ink-400 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions Footer */}
      <div className="pt-2 border-t border-paper-300 space-y-2">
        <button
          type="button"
          onClick={handleSaveMeeting}
          disabled={isSaving || !meetingTitle.trim()}
          className="w-full py-2.5 px-4 rounded-xl bg-tealAccent-700 hover:bg-tealAccent-800 text-white font-bold text-xs shadow-paper transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{isSaving ? 'Syncing to Web Hub...' : 'Save & Sync Meeting'}</span>
        </button>
      </div>
    </div>
  );
}
