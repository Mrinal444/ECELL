import { describe, it, expect } from "vitest";
import {
  normalizeCompanyName,
  normalizeDomain,
  normalizePhone,
  formatINR,
} from "@/lib/normalization";
import { levenshteinDistance, stringSimilarity } from "@/lib/fuzzy";

describe("Company Name Normalization", () => {
  it("strips common Indian and global legal entity suffixes", () => {
    expect(normalizeCompanyName("Zomato Private Limited")).toBe("zomato");
    expect(normalizeCompanyName("Swiggy Pvt Ltd")).toBe("swiggy");
    expect(normalizeCompanyName("CRED Technologies LLP")).toBe("cred");
    expect(normalizeCompanyName("Razorpay Software Solutions India Pvt. Ltd.")).toBe("razorpay software");
    expect(normalizeCompanyName("Tata Consultancy Services Limited")).toBe("tata consultancy");
    expect(normalizeCompanyName("Infosys Technologies Ltd.")).toBe("infosys");
    expect(normalizeCompanyName("Reliance Industries Co.")).toBe("reliance industries");
    expect(normalizeCompanyName("Google India Pvt. Ltd.")).toBe("google");
  });

  it("normalizes ampersands and punctuation", () => {
    expect(normalizeCompanyName("L&T Infotech")).toBe("l and t infotech");
    expect(normalizeCompanyName("Ernst & Young Global")).toBe("ernst and young");
    expect(normalizeCompanyName("Paytm (One97 Communications)")).toBe("paytm one97 communications");
    expect(normalizeCompanyName("Flipkart Internet Pvt. Ltd. - India")).toBe("flipkart internet");
  });

  it("handles whitespace and case collapsing", () => {
    expect(normalizeCompanyName("  UNACADEMY   LEARNING  PVT   LTD  ")).toBe("unacademy learning");
    expect(normalizeCompanyName("")).toBe("");
  });
});

describe("Domain Normalization", () => {
  it("strips protocols, subdomains, paths, query parameters and ports", () => {
    expect(normalizeDomain("https://www.razorpay.com/about/team?ref=ecell")).toBe("razorpay.com");
    expect(normalizeDomain("http://swiggy.in/careers#openings")).toBe("swiggy.in");
    expect(normalizeDomain("WWW.CRED.CLUB/")).toBe("cred.club");
    expect(normalizeDomain("https://sub.domain.co.in:8080/path")).toBe("sub.domain.co.in");
  });

  it("handles null and empty values gracefully", () => {
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain(undefined)).toBeNull();
  });
});

describe("Phone Number Normalization", () => {
  it("extracts 10-digit mobile numbers from Indian phone representations", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizePhone("91-9876543210")).toBe("9876543210");
    expect(normalizePhone("09876543210")).toBe("9876543210");
    expect(normalizePhone("+91 (987) 654-3210")).toBe("9876543210");
    expect(normalizePhone("9876543210")).toBe("9876543210");
  });

  it("returns null for short/invalid numbers", () => {
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe("Currency Formatter", () => {
  it("formats numbers to Indian Rupee currency standard", () => {
    expect(formatINR(500000)).toMatch(/5,00,000/);
    expect(formatINR(null)).toBe("—");
    expect(formatINR(undefined)).toBe("—");
  });
});

describe("Levenshtein Distance & String Similarity", () => {
  it("calculates accurate edit distances", () => {
    expect(levenshteinDistance("zomato", "zomato")).toBe(0);
    expect(levenshteinDistance("zomato", "zomatto")).toBe(1);
    expect(levenshteinDistance("razorpay", "razorpayy")).toBe(1);
    expect(levenshteinDistance("", "abc")).toBe(3);
  });

  it("calculates accurate similarity ratios", () => {
    expect(stringSimilarity("zomato", "zomato")).toBe(1.0);
    expect(stringSimilarity("zomato", "zomatto")).toBeGreaterThan(0.85);
    expect(stringSimilarity("google", "microsoft")).toBeLessThan(0.3);
  });
});
