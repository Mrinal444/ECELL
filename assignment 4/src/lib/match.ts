import { Domain, Stage, Skill, MatchStatus, SessionStatus } from "@prisma/client";

const STAGES = [Stage.Idea, Stage.PreSeed, Stage.Seed, Stage.Growth];

const ADJACENT_DOMAINS: Record<Domain, Domain[]> = {
  [Domain.FinTech]: [Domain.SaaS],
  [Domain.HealthTech]: [Domain.Consumer, Domain.AI],
  [Domain.EdTech]: [Domain.Consumer, Domain.SaaS],
  [Domain.AI]: [Domain.SaaS, Domain.HealthTech],
  [Domain.Climate]: [Domain.SaaS],
  [Domain.Consumer]: [Domain.HealthTech, Domain.EdTech],
  [Domain.SaaS]: [Domain.FinTech, Domain.AI, Domain.Climate, Domain.EdTech],
};

export type MatchInputFounder = {
  domain: Domain | null;
  stage: Stage | null;
  needs: Skill[];
};

export type MatchInputMentor = {
  domains: Domain[];
  stages: Stage[];
  skills: Skill[];
  hasAvailableSlotInNext14Days: boolean;
};

export function calculateMatchScore(
  founder: MatchInputFounder,
  mentor: MatchInputMentor
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Domain Match
  if (founder.domain) {
    if (mentor.domains.includes(founder.domain)) {
      score += 40;
      reasons.push(`Same domain (${founder.domain})`);
    } else {
      const adjacent = ADJACENT_DOMAINS[founder.domain] || [];
      if (mentor.domains.some((d) => adjacent.includes(d))) {
        score += 15;
        const matchedAdj = mentor.domains.find((d) => adjacent.includes(d));
        reasons.push(`Adjacent domain (${founder.domain} ↔ ${matchedAdj})`);
      }
    }
  }

  // 2. Stage Match
  if (founder.stage) {
    if (mentor.stages.includes(founder.stage)) {
      score += 25;
      reasons.push(`supports ${founder.stage} stage`);
    } else {
      const stageIdx = STAGES.indexOf(founder.stage);
      const mentorStageIndices = mentor.stages.map((s) => STAGES.indexOf(s));
      const hasNeighbour = mentorStageIndices.some(
        (idx) => Math.abs(idx - stageIdx) === 1
      );
      if (hasNeighbour) {
        score += 10;
        reasons.push("supports nearby stage");
      }
    }
  }

  // 3. Needs Match
  if (founder.needs.length > 0) {
    const covered = founder.needs.filter((n) => mentor.skills.includes(n));
    if (covered.length > 0) {
      const proportion = covered.length / founder.needs.length;
      score += Math.round(25 * proportion);
      reasons.push(`covers ${covered.join(", ")}`);
    }
  }

  // 4. Availability
  if (mentor.hasAvailableSlotInNext14Days) {
    score += 10;
  }

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(" · ") : "No direct overlap",
  };
}
