"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Sparkles, CheckCircle2, Calendar, Target, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "edtech" | "fintech">("edtech");

  const sampleMatches = {
    edtech: {
      mentor: "Arjun Mehta",
      role: "Ex-VP Product at EdTech Unicorn",
      founder: "Priya Sharma (EduScale)",
      domain: "EdTech",
      stage: "Seed",
      score: 85,
      reason: "Same domain (EdTech) · supports Seed stage · covers GoToMarket",
      topic: "Deep dive: GTM motion & sales cycle",
    },
    fintech: {
      mentor: "Sunita Rao",
      role: "Former Partner at SeedFund",
      founder: "Rohan Varma (FinFlow)",
      domain: "FinTech",
      stage: "PreSeed",
      score: 75,
      reason: "Same domain (FinTech) · supports PreSeed stage · covers Fundraising",
      topic: "Treasury automation compliance & priced round prep",
    },
    ai: {
      mentor: "Manoj Pillai",
      role: "Principal Architect, Distributed AI Systems",
      founder: "Vikram Das (NeuralOps)",
      domain: "AI",
      stage: "Seed",
      score: 90,
      reason: "Same domain (AI) · supports Seed stage · covers TechArchitecture",
      topic: "Local LLM inference pipeline latency bottlenecks",
    },
  };

  const current = sampleMatches[activeTab];

  useGSAP(() => {
    gsap.from(".hero-anim", {
      y: 24,
      opacity: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-[var(--background)]">
      {/* Top Navigation */}
      <header className="border-b border-[var(--foreground)]/10 px-6 py-4 flex items-center justify-between">
        <div className="font-bold text-xl tracking-tight">
          Mentor<span className="text-[var(--accent)]">Match</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Join Network
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="p-8 md:p-16 lg:p-20 border-b border-[var(--foreground)]/10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 max-w-2xl">
          <div className="hero-anim inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--foreground)] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            Curated founder-operator mentorship
          </div>
          <h1 className="hero-anim text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
            Mentorship without the noise.
          </h1>
          <p className="hero-anim text-lg md:text-xl text-[var(--foreground)]/70 mb-8 leading-relaxed">
            Pairing early-stage founders with proven operators through deterministic domain, stage, and skill fit. No cold inboxes, just focused 60-minute strategy sessions.
          </p>
          <div className="hero-anim flex flex-wrap gap-4 items-center">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] px-7 py-3.5 rounded-full font-medium hover:opacity-90 transition-opacity text-base shadow-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-[var(--foreground)]/20 px-7 py-3.5 rounded-full font-medium hover:bg-[var(--foreground)]/5 transition-colors text-base"
            >
              Try Demo Accounts
            </Link>
          </div>
        </div>

        {/* Live Interactive Sample Match Card */}
        <div className="hero-anim flex-1 w-full max-w-md">
          <div className="bg-[var(--background)] border border-[var(--foreground)]/15 shadow-xl rounded-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--foreground)]/10 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]/50">
                Live Matching Algorithm
              </span>
              <div className="flex gap-1.5">
                {(["edtech", "fintech", "ai"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "bg-[var(--foreground)]/5 text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-xl">{current.mentor}</h3>
                  <p className="text-xs text-[var(--foreground)]/60">{current.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-[var(--foreground)]/50">Fit Score</div>
                  <div className="text-2xl font-bold text-[var(--accent)]">{current.score}%</div>
                </div>
              </div>

              <div className="w-full bg-[var(--foreground)]/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--accent)] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${current.score}%` }}
                />
              </div>

              <div className="bg-[var(--foreground)]/5 p-3 rounded-lg border-l-2 border-[var(--accent)] text-xs text-[var(--foreground)]/80 leading-relaxed font-medium">
                {current.reason}
              </div>

              <div className="pt-2 border-t border-[var(--foreground)]/10 flex items-center justify-between text-xs text-[var(--foreground)]/70">
                <span>Matched with: <strong className="text-[var(--foreground)]">{current.founder}</strong></span>
                <span className="font-semibold px-2 py-0.5 rounded bg-[var(--secondary)]/15 text-[var(--secondary)]">
                  {current.stage}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative: The 3-Step Product Loop */}
      <section className="p-8 md:p-16 lg:p-20 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            How MentorMatch Works
          </h2>
          <p className="text-[var(--foreground)]/70 text-base">
            From algorithmic matchmaking to confirmed strategy sessions, every interaction is guarded by mutual consent and structured criteria.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-[var(--foreground)]/10 p-7 rounded-2xl bg-[var(--background)] shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-lg mb-5">
              1
            </div>
            <h3 className="text-xl font-bold mb-2">Deterministic Fit</h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-4 flex-1">
              No generic questionnaires. Scoring uses an exact formula: Domain (40 pts), Company Stage (25 pts), Skill Needs (25 pts), and 14-day Calendar Availability (10 pts).
            </p>
            <div className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1">
              Transparent reason string generated <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="border border-[var(--foreground)]/10 p-7 rounded-2xl bg-[var(--background)] shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-lg mb-5">
              2
            </div>
            <h3 className="text-xl font-bold mb-2">Guarded Connection</h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-4 flex-1">
              Founders send concise connection requests. Mentors review reasons and accept or decline. Declined requests enforce a 14-day cooldown to respect everyone's time.
            </p>
            <div className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1">
              Sessions only book on accepted matches <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="border border-[var(--foreground)]/10 p-7 rounded-2xl bg-[var(--background)] shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center font-bold text-lg mb-5">
              3
            </div>
            <h3 className="text-xl font-bold mb-2">Focused 60m Sessions</h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-4 flex-1">
              Select 60-minute slots generated from recurring mentor windows in IST. Once complete, both sides save private notes to track insights and progress.
            </p>
            <div className="text-xs text-[var(--accent)] font-semibold flex items-center gap-1">
              Time-locked state machine <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Demo Login CTA */}
      <section className="bg-[var(--foreground)]/5 border-t border-[var(--foreground)]/10 p-8 md:p-16 text-center">
        <div className="max-w-xl mx-auto space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to explore?</h2>
          <p className="text-sm text-[var(--foreground)]/70">
            Use the pre-seeded demo accounts to experience the complete founder and mentor journeys instantly.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In with Demo Creds
            </Link>
            <Link
              href="/register"
              className="border border-[var(--foreground)]/20 px-6 py-3 rounded-full text-sm font-medium hover:bg-[var(--foreground)]/5 transition-colors"
            >
              Create New Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}