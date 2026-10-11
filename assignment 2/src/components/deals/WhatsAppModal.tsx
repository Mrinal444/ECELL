"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Check, Clock, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { WHATSAPP_TEMPLATES, generateWhatsAppUrl, renderWhatsAppMessage } from "@/lib/whatsapp";
import { logDealActivityAction } from "@/actions/deals";
import { DEFAULT_FOLLOW_UP_DAYS } from "@/lib/constants";

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  contactName: string;
  contactPhone: string;
  companyName: string;
  campaignName: string;
  senderName: string;
  onActivityLogged?: () => void;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  dealId,
  contactName,
  contactPhone,
  companyName,
  campaignName,
  senderName,
  onActivityLogged,
}: WhatsAppModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("pitch_initial");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState<boolean>(false);
  const [followUpDays, setFollowUpDays] = useState<number>(DEFAULT_FOLLOW_UP_DAYS);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  // Initialize or update template text
  useEffect(() => {
    const template = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (template) {
      const generated = renderWhatsAppMessage(template.templateText, {
        contactName: contactName || "Sir/Ma'am",
        companyName: companyName || "your team",
        campaignName: campaignName || "E-Summit 2026",
        userName: senderName || "E-Cell Team",
      });
      setCustomMessage(generated);
    }
  }, [selectedTemplateId, contactName, companyName, campaignName, senderName]);

  // Window Focus Listener for Sticky Return Prompt
  useEffect(() => {
    const handleFocus = () => {
      if (hasOpenedWhatsApp && !logSuccess) {
        // User came back from WhatsApp!
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasOpenedWhatsApp, logSuccess]);

  const handleLaunchWhatsApp = () => {
    const url = generateWhatsAppUrl(contactPhone, customMessage);
    if (!url) {
      alert("Invalid phone number. Please ensure it has a valid 10-digit format.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setHasOpenedWhatsApp(true);
  };

  const handleLogActivity = async () => {
    setIsLogging(true);
    try {
      const followUpDate = new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await logDealActivityAction(dealId, {
        type: "WHATSAPP",
        body: `Sent WhatsApp to ${contactName} (${contactPhone}):\n"${customMessage}"`,
        nextFollowUpAt: followUpDate,
        metadata: {
          templateId: selectedTemplateId,
          recipientPhone: contactPhone,
          recipientName: contactName,
        },
      });

      if (res.success) {
        setLogSuccess(true);
        onActivityLogged?.();
        setTimeout(() => {
          onClose();
          setHasOpenedWhatsApp(false);
          setLogSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to log WhatsApp activity", err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Outreach Dispatch"
      subtitle={`To: ${contactName} (${contactPhone}) · ${companyName}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 font-mono text-xs">
        {/* Template Selector */}
        <div>
          <label className="block text-ink font-bold mb-1.5 uppercase">
            Outreach Template:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WHATSAPP_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`p-2.5 text-left border transition-all ${
                  selectedTemplateId === tmpl.id
                    ? "bg-ink text-canvas border-ink shadow-sharp-sm"
                    : "bg-surface text-ink hover:bg-surface-muted border-border-grid"
                }`}
              >
                <div className="font-bold">{tmpl.name}</div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    selectedTemplateId === tmpl.id
                      ? "text-canvas-muted"
                      : "text-ink-muted"
                  }`}
                >
                  {tmpl.subject}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-ink font-bold uppercase">
              Message Preview & Edit:
            </label>
            <span className="text-ink-muted text-[11px]">
              {customMessage.length} characters
            </span>
          </div>
          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full bg-surface border border-border-grid p-3 text-ink font-mono text-xs focus:outline-none focus:border-ink resize-y leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border-grid">
          <button
            type="button"
            onClick={handleLaunchWhatsApp}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 font-bold hover:bg-green-700 transition-colors shadow-sharp-sm border border-green-700"
          >
            <Send className="w-4 h-4" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3 h-3 ml-1" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink px-3 py-1.5 underline"
          >
            Cancel
          </button>
        </div>

        {/* STICKY POST-DISPATCH LOGGING PROMPT */}
        {hasOpenedWhatsApp && (
          <div className="p-4 bg-amber-50 border-2 border-signal-amber animate-in slide-in-from-top-2 duration-200 mt-3 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <Clock className="w-4 h-4 text-signal-amber animate-bounce" />
                <span>Did you send this message on WhatsApp?</span>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 font-bold uppercase">
                Return to Tab Prompt
              </span>
            </div>

            <p className="text-amber-800 text-[11px]">
              Click below to record this communication in the deal audit trail and automatically schedule the next follow-up.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-ink font-semibold">Next Follow-Up in:</span>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="bg-white border border-border-grid px-2 py-1 text-xs font-mono font-bold"
                >
                  <option value={1}>+1 day (Urgent)</option>
                  <option value={2}>+2 days</option>
                  <option value={3}>+3 days (Standard)</option>
                  <option value={5}>+5 days</option>
                  <option value={7}>+7 days (1 Week)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleLogActivity}
                disabled={isLogging || logSuccess}
                className="flex items-center gap-1.5 bg-ink text-canvas px-4 py-1.5 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
              >
                {logSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-signal-green" />
                    <span>Logged to Timeline!</span>
                  </>
                ) : isLogging ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Logging...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>1-Click Log WhatsApp Activity</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
