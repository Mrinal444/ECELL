import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "./match";
import { Domain, Stage, Skill } from "@prisma/client";

describe("Match Scoring", () => {
  it("exact domain, stage, full needs, and availability", () => {
    const res = calculateMatchScore(
      { domain: Domain.FinTech, stage: Stage.Seed, needs: [Skill.Fundraising] },
      { domains: [Domain.FinTech], stages: [Stage.Seed], skills: [Skill.Fundraising], hasAvailableSlotInNext14Days: true }
    );
    expect(res.score).toBe(40 + 25 + 25 + 10);
    expect(res.reason).toMatch(/Same domain \(FinTech\)/);
    expect(res.reason).toMatch(/supports Seed stage/);
    expect(res.reason).toMatch(/covers Fundraising/);
  });

  it("adjacent domain", () => {
    const res = calculateMatchScore(
      { domain: Domain.FinTech, stage: Stage.Idea, needs: [] },
      { domains: [Domain.SaaS], stages: [Stage.Idea], skills: [], hasAvailableSlotInNext14Days: false }
    );
    // FinTech -> SaaS is adjacent (+15)
    expect(res.score).toBe(15 + 25);
    expect(res.reason).toMatch(/Adjacent domain/);
  });

  it("no stage fit", () => {
    const res = calculateMatchScore(
      { domain: Domain.AI, stage: Stage.Growth, needs: [] },
      { domains: [Domain.AI], stages: [Stage.Idea], skills: [], hasAvailableSlotInNext14Days: false }
    );
    // distance is 3 (Growth=3, Idea=0), not nearby
    expect(res.score).toBe(40 + 0);
  });

  it("empty needs", () => {
    const res = calculateMatchScore(
      { domain: Domain.HealthTech, stage: Stage.Seed, needs: [] },
      { domains: [Domain.HealthTech], stages: [Stage.Seed], skills: [Skill.Hiring], hasAvailableSlotInNext14Days: false }
    );
    // no needs to cover
    expect(res.score).toBe(40 + 25 + 0);
  });

  it("no availability", () => {
    const res = calculateMatchScore(
      { domain: Domain.AI, stage: null, needs: [] },
      { domains: [Domain.AI], stages: [], skills: [], hasAvailableSlotInNext14Days: false }
    );
    expect(res.score).toBe(40);
  });
});
