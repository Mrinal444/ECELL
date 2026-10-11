import { requireUser, prisma } from "@/lib/auth";
import { calculateMatchScore, MatchInputFounder, MatchInputMentor } from "@/lib/match";
import { Role, Domain, Stage, Skill } from "@prisma/client";
import MatchCard from "./MatchCard";
import Link from "next/link";
import { Filter, X } from "lucide-react";

interface Result {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  domain?: Domain | null;
  domains?: Domain[];
  stage?: Stage | null;
  stages?: Stage[];
  match: { score: number; reason: string };
  skills?: Skill[];
  needs?: Skill[];
  hasSlot?: boolean;
}

const domainsList: Domain[] = ["FinTech", "HealthTech", "EdTech", "AI", "Climate", "Consumer", "SaaS"];
const stagesList: Stage[] = ["Idea", "PreSeed", "Seed", "Growth"];
const skillsList: Skill[] = ["Fundraising", "GoToMarket", "Product", "Hiring", "TechArchitecture", "Pricing", "Sales", "Branding", "Legal", "Operations"];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; stage?: string; skill?: string; hasSlot?: string }>;
}) {
  const user = await requireUser();
  const isFounder = user.role === Role.FOUNDER;
  const params = await searchParams;

  const filterDomain = params.domain as Domain | undefined;
  const filterStage = params.stage as Stage | undefined;
  const filterSkill = params.skill as Skill | undefined;
  const filterHasSlot = params.hasSlot === "true";

  const hasActiveFilters = Boolean(filterDomain || filterStage || filterSkill || filterHasSlot);

  let results: Result[] = [];

  if (isFounder && user.founder) {
    const founderInput: MatchInputFounder = {
      domain: user.founder.domain,
      stage: user.founder.stage,
      needs: (await prisma.founderNeed.findMany({ where: { founderId: user.founder.id } })).map(n => n.skill),
    };

    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: true,
        domains: true,
        stages: true,
        skills: true,
        availability: true,
      }
    });

    results = mentors.map(m => {
      const mentorDomains = m.domains.map(d => d.domain);
      const mentorStages = m.stages.map(s => s.stage);
      const mentorSkills = m.skills.map(s => s.skill);
      const hasSlot = m.availability.length > 0;

      const mentorInput: MatchInputMentor = {
        domains: mentorDomains,
        stages: mentorStages,
        skills: mentorSkills,
        hasAvailableSlotInNext14Days: hasSlot,
      };

      return {
        id: m.id,
        name: m.user.name,
        headline: m.headline,
        bio: m.bio,
        domains: mentorDomains,
        stages: mentorStages,
        match: calculateMatchScore(founderInput, mentorInput),
        skills: mentorSkills,
        hasSlot,
      };
    }).sort((a, b) => b.match.score - a.match.score);

    // Apply filters
    if (filterDomain) {
      results = results.filter(r => r.domains?.includes(filterDomain));
    }
    if (filterStage) {
      results = results.filter(r => r.stages?.includes(filterStage));
    }
    if (filterSkill) {
      results = results.filter(r => r.skills?.includes(filterSkill));
    }
    if (filterHasSlot) {
      results = results.filter(r => r.hasSlot);
    }

  } else if (!isFounder && user.mentor) {
    const mentorDomains = (await prisma.mentorDomain.findMany({ where: { mentorId: user.mentor.id } })).map(d => d.domain);
    const mentorStages = (await prisma.mentorStage.findMany({ where: { mentorId: user.mentor.id } })).map(s => s.stage);
    const mentorSkills = (await prisma.mentorSkill.findMany({ where: { mentorId: user.mentor.id } })).map(s => s.skill);
    const mentorSlots = await prisma.availabilitySlot.findMany({ where: { mentorId: user.mentor.id } });

    const mentorInput: MatchInputMentor = {
      domains: mentorDomains,
      stages: mentorStages,
      skills: mentorSkills,
      hasAvailableSlotInNext14Days: mentorSlots.length > 0
    };

    const founders = await prisma.founderProfile.findMany({
      include: { user: true, needs: true }
    });

    results = founders.map(f => {
      const founderNeeds = f.needs.map(n => n.skill);
      const founderInput: MatchInputFounder = {
        domain: f.domain,
        stage: f.stage,
        needs: founderNeeds,
      };

      return {
        id: f.id,
        name: f.startupName || f.user.name,
        headline: f.pitch,
        bio: null,
        domain: f.domain,
        stage: f.stage,
        match: calculateMatchScore(founderInput, mentorInput),
        needs: founderNeeds,
      };
    }).sort((a, b) => b.match.score - a.match.score);

    // Apply filters
    if (filterDomain) {
      results = results.filter(r => r.domain === filterDomain);
    }
    if (filterStage) {
      results = results.filter(r => r.stage === filterStage);
    }
    if (filterSkill) {
      results = results.filter(r => r.needs?.includes(filterSkill));
    }
  }

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {isFounder ? "Find your mentor" : "Startups that could use you"}
        </h1>
        <p className="text-[var(--foreground)]/60 text-sm">
          Ranked matches based on overlapping domains, stages, and skills.
        </p>
      </div>

      {/* Filter Bar */}
      <form method="GET" className="bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="w-4 h-4 text-[var(--accent)]" />
            <span>Filter Matches</span>
          </div>
          {hasActiveFilters && (
            <Link
              href="/discover"
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--foreground)]/70 mb-1">Domain</label>
            <select
              name="domain"
              defaultValue={filterDomain || ""}
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">All Domains</option>
              {domainsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)]/70 mb-1">Stage</label>
            <select
              name="stage"
              defaultValue={filterStage || ""}
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">All Stages</option>
              {stagesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)]/70 mb-1">Skill / Expertise</label>
            <select
              name="skill"
              defaultValue={filterSkill || ""}
              className="w-full border border-[var(--foreground)]/20 p-2 rounded-md bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="">All Skills</option>
              {skillsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {isFounder ? (
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hasSlot"
                  value="true"
                  defaultChecked={filterHasSlot}
                  className="rounded border-[var(--foreground)]/20 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-xs font-medium">Has open slots (14d)</span>
              </label>
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-[var(--foreground)] text-[var(--background)] px-4 py-2 rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((r) => (
          <MatchCard key={r.id} match={r} isFounder={isFounder} />
        ))}
      </div>

      {results.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-[var(--foreground)]/10 rounded-2xl p-8 space-y-4">
          <p className="text-[var(--foreground)]/70 font-medium">
            {hasActiveFilters ? "No matches found matching your filters." : "No matches found at the moment."}
          </p>
          {hasActiveFilters && (
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--foreground)]/20 rounded-md text-xs font-medium hover:bg-[var(--foreground)]/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  );
}