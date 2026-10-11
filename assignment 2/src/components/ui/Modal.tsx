"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className={`w-full ${maxWidthClass} bg-canvas border-2 border-ink shadow-sharp my-8 overflow-hidden relative`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-grid bg-surface">
          <div>
            <h3 className="text-base font-bold text-ink tracking-tight font-sans uppercase">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-ink-muted mt-0.5 font-mono">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-canvas transition-colors border border-transparent hover:border-border-grid"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
