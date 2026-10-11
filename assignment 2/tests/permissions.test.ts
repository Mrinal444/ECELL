import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  canManageDeal,
} from "@/lib/auth";
import { SessionUser } from "@/types";

describe("Authentication & RBAC Permissions", () => {
  const mockLead: SessionUser = {
    id: "lead-1",
    name: "Aarav Lead",
    email: "lead@ecell.org",
    role: "LEAD",
    mustChangePassword: false,
  };

  const mockMember1: SessionUser = {
    id: "member-1",
    name: "Rohan Member",
    email: "rohan@ecell.org",
    role: "MEMBER",
    mustChangePassword: false,
  };

  const mockMember2: SessionUser = {
    id: "member-2",
    name: "Sneha Member",
    email: "sneha@ecell.org",
    role: "MEMBER",
    mustChangePassword: false,
  };

  describe("Password Hashing", () => {
    it("hashes and verifies passwords accurately with bcrypt", async () => {
      const password = "SuperSecretPassword123!";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("JWT Session Tokens", () => {
    it("creates and verifies signed JWT session tokens", async () => {
      const token = await createSessionToken(mockMember1);
      expect(typeof token).toBe("string");

      const decoded = await verifySessionToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(mockMember1.id);
      expect(decoded?.email).toBe(mockMember1.email);
      expect(decoded?.role).toBe(mockMember1.role);
    });

    it("fails verification for corrupted tokens", async () => {
      const decoded = await verifySessionToken("invalid.corrupted.token");
      expect(decoded).toBeNull();
    });
  });

  describe("Deal Management RBAC (`canManageDeal`)", () => {
    it("allows Lead users to manage any deal (owned or other member's)", () => {
      expect(canManageDeal(mockLead, mockMember1.id)).toBe(true);
      expect(canManageDeal(mockLead, mockMember2.id)).toBe(true);
      expect(canManageDeal(mockLead, null)).toBe(true);
    });

    it("allows Members to manage their own deals", () => {
      expect(canManageDeal(mockMember1, mockMember1.id)).toBe(true);
    });

    it("allows Members to claim unassigned deals", () => {
      expect(canManageDeal(mockMember1, null)).toBe(true);
    });

    it("prevents Members from managing other members' deals", () => {
      expect(canManageDeal(mockMember1, mockMember2.id)).toBe(false);
      expect(canManageDeal(mockMember2, mockMember1.id)).toBe(false);
    });
  });
});
