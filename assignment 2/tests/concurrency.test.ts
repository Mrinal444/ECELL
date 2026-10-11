import { describe, it, expect } from "vitest";

describe("Optimistic Concurrency & Claim Race Prevention", () => {
  interface MockDeal {
    id: string;
    ownerId: string | null;
    version: number;
    stage: string;
  }

  function simulateAtomicClaim(
    deal: MockDeal,
    newOwnerId: string,
    expectedVersion: number
  ): { success: boolean; deal: MockDeal; error?: string } {
    // Equivalent to: UPDATE Deal SET ownerId = $newOwnerId, version = version + 1 WHERE id = $id AND ownerId IS NULL AND version = $expectedVersion
    if (deal.ownerId !== null) {
      return {
        success: false,
        deal,
        error: "Deal is already claimed by someone else.",
      };
    }

    if (deal.version !== expectedVersion) {
      return {
        success: false,
        deal,
        error: "Version mismatch: Deal was modified concurrently.",
      };
    }

    const updatedDeal: MockDeal = {
      ...deal,
      ownerId: newOwnerId,
      version: deal.version + 1,
    };

    return {
      success: true,
      deal: updatedDeal,
    };
  }

  it("successfully claims an unassigned deal with matching version", () => {
    const unassignedDeal: MockDeal = {
      id: "deal-101",
      ownerId: null,
      version: 1,
      stage: "PROSPECT",
    };

    const result = simulateAtomicClaim(unassignedDeal, "member-1", 1);
    expect(result.success).toBe(true);
    expect(result.deal.ownerId).toBe("member-1");
    expect(result.deal.version).toBe(2);
  });

  it("rejects concurrent claim if another member already claimed it first (race condition)", () => {
    let currentDealState: MockDeal = {
      id: "deal-101",
      ownerId: null,
      version: 1,
      stage: "PROSPECT",
    };

    // Member 1 reads deal at version 1
    const member1ExpectedVersion = currentDealState.version;

    // Member 2 reads deal at version 1 simultaneously
    const member2ExpectedVersion = currentDealState.version;

    // Member 1 claims first
    const member1Result = simulateAtomicClaim(currentDealState, "member-1", member1ExpectedVersion);
    expect(member1Result.success).toBe(true);
    currentDealState = member1Result.deal; // Now ownerId = member-1, version = 2

    // Member 2 tries to claim with stale version 1 and ownerId condition
    const member2Result = simulateAtomicClaim(currentDealState, "member-2", member2ExpectedVersion);
    expect(member2Result.success).toBe(false);
    expect(member2Result.error).toContain("already claimed");
    expect(currentDealState.ownerId).toBe("member-1");
  });

  it("rejects update if version has been incremented", () => {
    const deal: MockDeal = {
      id: "deal-102",
      ownerId: null,
      version: 3,
      stage: "INITIAL_CONTACT",
    };

    const result = simulateAtomicClaim(deal, "member-1", 2); // stale version passed
    expect(result.success).toBe(false);
    expect(result.error).toContain("Version mismatch");
  });
});
