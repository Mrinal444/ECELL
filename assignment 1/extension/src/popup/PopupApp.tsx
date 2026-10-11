import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  PanelRight,
  Calendar,
  User,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getConfig,
  getReminders,
  updateActionStatus,
  DEFAULT_API_URL,
  DEMO_API_TOKEN,
  verifyToken,
  setConfig,
} from '../lib/api';

export default function PopupApp() {
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [hasToken, setHasToken] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [dueSoonItems, setDueSoonItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'dueSoon'>('overdue');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const config = await getConfig();
      setApiUrl(config.apiUrl || DEFAULT_API_URL);

      if (!config.apiToken) {
        setHasToken(false);
        setLoading(false);
        return;
      }

      setHasToken(true);
      const res = await getReminders();
      if (res) {
        setSummary(res.summary);
        setOverdueItems(res.overdueItems || []);
        setTodayItems(res.todayItems || []);
        setDueSoonItems(res.dueSoonItems || []);

        if (res.overdueItems && res.overdueItems.length === 0 && res.todayItems && res.todayItems.length > 0) {
          setActiveTab('today');
        } else if (res.overdueItems && res.overdueItems.length === 0 && res.dueSoonItems && res.dueSoonItems.length > 0) {
          setActiveTab('dueSoon');
        }
      }
    } catch (err: any) {
      console.warn('Failed to load reminders:', err);
      setErrorMsg(err.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnectDemo = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await verifyToken(DEMO_API_TOKEN, DEFAULT_API_URL);
      await setConfig({
        apiUrl: DEFAULT_API_URL,
        apiToken: DEMO_API_TOKEN,
        currentUser: user,
      });
      setHasToken(true);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo token verification failed');
      setLoading(false);
    }
  };

  const handleMarkDone = async (actionId: string) => {
    setUpdatingId(actionId);
    try {
      await updateActionStatus(actionId, 'done');
      // Remove from local states
      setOverdueItems((prev) => prev.filter((i) => i.id !== actionId));
      setTodayItems((prev) => prev.filter((i) => i.id !== actionId));
      setDueSoonItems((prev) => prev.filter((i) => i.id !== actionId));

      if (summary) {
        setSummary((prev: any) => ({
          ...prev,
          overdueCount: Math.max(0, (prev?.overdueCount || 1) - 1),
          totalActiveCount: Math.max(0, (prev?.totalActiveCount || 1) - 1),
        }));
      }
    } catch (err: any) {
      alert(`Could not mark item done: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const openSidePanel = () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
    } else {
      window.open(chrome?.runtime?.getURL('sidepanel.html') || '/sidepanel.html', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-[360px] min-h-[300px] bg-paper p-5 flex flex-col items-center justify-center text-center">
        <div className="w-7 h-7 border-2 border-tealAccent-700 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-ink-300">Checking E-Cell deadlines...</p>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="w-[360px] bg-paper p-5 text-ink-500 space-y-4">
        <div className="flex items-center gap-2 border-b border-paper-300 pb-3">
          <div className="w-7 h-7 rounded-lg bg-tealAccent-700 flex items-center justify-center text-white font-bold text-xs shadow-paper-sm">
            E
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight">E-Cell Companion</h1>
            <p className="text-[10px] text-ink-200">Deadlines & Voice Capture</p>
          </div>
        </div>

        <div className="space-y-2 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xs font-bold text-ink-500">Connect to Your Dashboard</h2>
          <p className="text-[11px] text-ink-200 leading-relaxed px-2">
            Link your web app account to see active reminders, overdue task alerts, and capture live meeting notes.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <button
            onClick={handleQuickConnectDemo}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-paper transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Quick Connect Demo Token</span>
          </button>

          <button
            onClick={openSidePanel}
            className="w-full py-2 px-4 rounded-xl border border-paper-300 bg-white hover:bg-paper-100 text-ink-400 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <PanelRight className="w-3.5 h-3.5 text-tealAccent-700" />
            <span>Open Side Panel Setup</span>
          </button>
        </div>
      </div>
    );
  }

  const currentList =
    activeTab === 'overdue'
      ? overdueItems
      : activeTab === 'today'
      ? todayItems
      : dueSoonItems;

  return (
    <div className="w-[380px] bg-paper text-ink-500 flex flex-col justify-between max-h-[520px] overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-paper-300 bg-paper-50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-tealAccent-700 flex items-center justify-center text-white font-bold text-xs shadow-paper-sm">
              E
            </div>
            <div>
              <span className="font-extrabold text-xs tracking-tight">E-Cell Reminders</span>
              <p className="text-[10px] text-ink-200">
                {summary ? `${summary.totalActiveCount} Active Action Items` : 'Syncing...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg hover:bg-paper-200 text-ink-200 hover:text-ink-400 transition-all"
              title="Refresh Deadlines"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={openSidePanel}
              className="p-1.5 rounded-lg bg-tealAccent-50 hover:bg-tealAccent-100 text-tealAccent-800 border border-tealAccent-200 transition-all text-[11px] font-bold flex items-center gap-1"
              title="Open Side Panel"
            >
              <PanelRight className="w-3.5 h-3.5 text-tealAccent-700" />
              <span>Capture</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Chips / Tabs */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-1.5 px-2 rounded-xl text-left border transition-all ${
              activeTab === 'overdue'
                ? 'bg-red-50 border-dangerRed-500 text-dangerRed-700 shadow-paper-sm font-bold'
                : 'bg-white border-paper-300 text-ink-300 hover:bg-paper-100'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-dangerRed-600 flex items-center justify-between">
              <span>Overdue</span>
              <span className="w-1.5 h-1.5 rounded-full bg-dangerRed-500" />
            </div>
            <div className="text-sm font-extrabold">{summary?.overdueCount ?? 0}</div>
          </button>

          <button
            onClick={() => setActiveTab('today')}
            className={`py-1.5 px-2 rounded-xl text-left border transition-all ${
              activeTab === 'today'
                ? 'bg-amber-50 border-amberAccent-500 text-amberAccent-700 shadow-paper-sm font-bold'
                : 'bg-white border-paper-300 text-ink-300 hover:bg-paper-100'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-amberAccent-600 flex items-center justify-between">
              <span>Due Today</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amberAccent-500" />
            </div>
            <div className="text-sm font-extrabold">{summary?.todayCount ?? 0}</div>
          </button>

          <button
            onClick={() => setActiveTab('dueSoon')}
            className={`py-1.5 px-2 rounded-xl text-left border transition-all ${
              activeTab === 'dueSoon'
                ? 'bg-tealAccent-50 border-tealAccent-500 text-tealAccent-700 shadow-paper-sm font-bold'
                : 'bg-white border-paper-300 text-ink-300 hover:bg-paper-100'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-tealAccent-700 flex items-center justify-between">
              <span>Next 48h</span>
              <span className="w-1.5 h-1.5 rounded-full bg-tealAccent-500" />
            </div>
            <div className="text-sm font-extrabold">{summary?.dueSoonCount ?? 0}</div>
          </button>
        </div>
      </div>

      {/* Item List Scroll Area */}
      <div className="p-3 space-y-2 overflow-y-auto max-h-[320px]">
        {currentList.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
            <p className="text-xs font-bold text-ink-400">All clean in this tab!</p>
            <p className="text-[10px] text-ink-100">No pending action items scheduled.</p>
          </div>
        ) : (
          currentList.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-white border border-paper-300 shadow-paper-sm space-y-2 hover:border-paper-400 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-ink-500 leading-snug flex-1">
                  {item.title}
                </p>
                <button
                  onClick={() => handleMarkDone(item.id)}
                  disabled={updatingId === item.id}
                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-50 shrink-0"
                  title="Mark as Done"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{updatingId === item.id ? 'Saving...' : 'Done'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-ink-200 pt-1 border-t border-paper-200">
                <span className="flex items-center gap-1 font-semibold text-ink-300 truncate max-w-[170px]">
                  <User className="w-3 h-3 text-ink-100" />
                  {item.assigneeName}
                </span>

                {item.daysOverdue ? (
                  <span className="font-extrabold text-dangerRed-600 bg-red-50 px-1.5 py-0.5 rounded">
                    {item.daysOverdue}d overdue
                  </span>
                ) : (
                  <span className="font-mono text-ink-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-ink-100" />
                    {item.dueDate ? item.dueDate.split('T')[0] : 'No date'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Footer */}
      <div className="p-2.5 border-t border-paper-300 bg-paper-100 flex items-center justify-between text-[11px]">
        <a
          href={`${apiUrl}/my-work`}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-tealAccent-800 hover:text-tealAccent-900 flex items-center gap-1"
        >
          <span>Open My Work Board</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={`${apiUrl}/home`}
          target="_blank"
          rel="noreferrer"
          className="text-ink-200 hover:text-ink-400 text-[10px] font-semibold"
        >
          Full Dashboard →
        </a>
      </div>
    </div>
  );
}
