"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  FileText,
  ArrowRightLeft,
  UserCheck,
  GitMerge,
  Send,
  Clock,
  RefreshCw,
  AlertCircle,
  Tag,
} from "lucide-react";
import { logDealActivityAction } from "@/actions/deals";
import { ActivityType, SessionUser } from "@/types";
import { ACTIVITY_TYPE_CONFIG, DEFAULT_FOLLOW_UP_DAYS } from "@/lib/constants";
import { RoleBadge } from "@/components/ui/Badge";

interface ActivityItem {
  id: string;
  type: string;
  body: string;
  createdAt: Date | string;
  metadata?: string | null;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface ActivityTimelineProps {
  dealId: string;
  activities: ActivityItem[];
  currentUser: SessionUser;
  isOwnerOrLead: boolean;
  onActivityAdded?: () => void;
}

export function ActivityTimeline({
  dealId,
  activities,
  currentUser,
  isOwnerOrLead,
  onActivityAdded,
}: ActivityTimelineProps) {
  const [activeTab, setActiveTab] = useState<ActivityType>("NOTE");
  const [body, setBody] = useState<string>("");
  const [followUpDays, setFollowUpDays] = useState<number>(DEFAULT_FOLLOW_UP_DAYS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "WHATSAPP":
        return <MessageSquare className="w-3.5 h-3.5 text-green-700" />;
      case "CALL":
        return <Phone className="w-3.5 h-3.5 text-blue-700" />;
      case "EMAIL":
        return <Mail className="w-3.5 h-3.5 text-purple-700" />;
      case "MEETING":
        return <Users className="w-3.5 h-3.5 text-amber-700" />;
      case "STAGE_CHANGE":
        return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-700" />;
      case "ASSIGNMENT":
        return <UserCheck className="w-3.5 h-3.5 text-stone-700" />;
      case "MERGE":
        return <GitMerge className="w-3.5 h-3.5 text-red-700" />;
      case "NOTE":
      default:
        return <FileText className="w-3.5 h-3.5 text-stone-700" />;
    }
  };

  const handlePostActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    setLoading(true);

    try {
      let nextFollowUpAt: string | null = null;
      if (isOwnerOrLead && activeTab !== "NOTE") {
        nextFollowUpAt = new Date(
          Date.now() + followUpDays * 24 * 60 * 60 * 1000
        ).toISOString();
      }

      const res = await logDealActivityAction(dealId, {
        type: activeTab,
        body: body.trim(),
        nextFollowUpAt,
      });

      if (!res.success) {
        setError(res.error || "Failed to log activity.");
      } else {
        setBody("");
        onActivityAdded?.();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Activity type options based on permissions
  const availableTypes: { type: ActivityType; label: string; icon: any }[] = isOwnerOrLead
    ? [
        { type: "NOTE", label: "Note", icon: FileText },
        { type: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
        { type: "CALL", label: "Phone Call", icon: Phone },
        { type: "EMAIL", label: "Email", icon: Mail },
        { type: "MEETING", label: "Meeting", icon: Users },
      ]
    : [{ type: "NOTE", label: "Team Note / Intelligence", icon: FileText }];

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Activity Creation Card */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border-grid pb-2">
          <div className="flex items-center gap-1.5 font-bold uppercase text-ink">
            <Send className="w-4 h-4" />
            <span>
              {isOwnerOrLead ? "Log Outreach Activity" : "Add Team Intel / Note"}
            </span>
          </div>

          {!isOwnerOrLead && (
            <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 border border-stone-300">
              Non-owner mode: Notes only
            </span>
          )}
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePostActivity} className="space-y-3">
          {/* Activity Type Selector */}
          <div className="flex flex-wrap gap-1.5">
            {availableTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveTab(item.type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 font-bold border transition-all ${
                    isSelected
                      ? "bg-ink text-canvas border-ink shadow-sharp-sm"
                      : "bg-canvas text-ink hover:bg-surface-muted border-border-grid"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body Textarea */}
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              activeTab === "NOTE"
                ? "Add internal note or intelligence (e.g. 'Spoke to their IIT alumni founder on LinkedIn')..."
                : `Record key takeaways and outcome from this ${activeTab.toLowerCase()}...`
            }
            className="w-full bg-canvas border border-border-grid p-2.5 text-ink font-mono text-xs focus:outline-none focus:border-ink resize-y leading-relaxed"
            required
          />

          {/* Bottom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {isOwnerOrLead && activeTab !== "NOTE" ? (
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">Next Follow-Up:</span>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="bg-canvas border border-border-grid px-2 py-1 text-xs font-bold"
                >
                  <option value={1}>+1 day</option>
                  <option value={2}>+2 days</option>
                  <option value={3}>+3 days (Default)</option>
                  <option value={5}>+5 days</option>
                  <option value={7}>+7 days</option>
                </select>
              </div>
            ) : <div />}

            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="flex items-center gap-1.5 bg-ink text-canvas px-4 py-1.5 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Audit Trail</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Append-Only Timeline Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-ink uppercase tracking-wider text-xs">
            Append-Only Audit Trail ({activities.length} Entries)
          </h4>
          <span className="text-[10px] text-ink-muted">Immutable log</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 text-center text-ink-muted bg-surface border border-border-grid">
            No activities recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-grid">
            {activities.map((act) => {
              const cfg = ACTIVITY_TYPE_CONFIG[act.type as ActivityType] || {
                label: act.type,
                color: "text-ink",
              };
              const dateObj = new Date(act.createdAt);
              const dateStr = dateObj.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const timeStr = dateObj.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Dot Icon */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 bg-surface border border-border-grid rounded-full flex items-center justify-center shadow-sm">
                    {getActivityIcon(act.type)}
                  </div>

                  {/* Activity Entry Box */}
                  <div className="bg-surface border border-border-grid p-3 shadow-sharp-sm hover:border-ink transition-colors space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-grid/50 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{act.user.name}</span>
                        <RoleBadge role={act.user.role} />
                        <span className="text-[10px] font-bold px-1.5 py-0.2 border uppercase bg-canvas border-border-grid text-ink">
                          {cfg.label}
                        </span>
                      </div>

                      <div className="text-[11px] text-ink-muted">
                        {dateStr} at {timeStr}
                      </div>
                    </div>

                    <p className="text-ink text-xs whitespace-pre-wrap leading-relaxed">
                      {act.body}
                    </p>
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
