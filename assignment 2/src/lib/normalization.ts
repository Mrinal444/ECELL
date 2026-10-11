/**
 * Company Name Normalization, Domain Normalization, and Phone Cleaner
 */

const KNOWN_ACRONYMS: Record<string, string> = {
  tcs: "tata consultancy services",
  "tata consultancy services": "tcs",
  gfg: "geeksforgeeks",
  geeksforgeeks: "gfg",
  redbull: "red bull",
  "red bull": "red bull",
};

const STRIP_SUFFIXES = [
  "private limited",
  "pvt limited",
  "pvt ltd",
  "pvt. ltd.",
  "pvt.ltd.",
  "pvt.",
  "pvt",
  "limited",
  "ltd.",
  "ltd",
  "llp",
  "llc",
  "inc.",
  "inc",
  "corp.",
  "corp",
  "corporation",
  "co.",
  "co",
  "company",
  "india",
  "technologies",
  "technology",
  "solutions",
  "services",
  "enterprises",
  "labs",
  "foundation",
  "group",
  "global",
  "international",
];

export function normalizeCompanyName(name: string): string {
  if (!name) return "";

  let cleaned = name.toLowerCase().trim();

  // Replace '&' with 'and'
  cleaned = cleaned.replace(/&/g, " and ");

  // Remove punctuation, special characters (quotes, hyphens, brackets, dots, commas)
  cleaned = cleaned.replace(/[.,\-–—_'"()\[\]\/\\#+*!?:;@]/g, " ");

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // Iteratively strip legal and organizational suffixes from the end of the name
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of STRIP_SUFFIXES) {
      // Check if string ends with suffix as a separate word token or at the boundary
      const regex = new RegExp(`\\b${suffix.replace(".", "\\.")}$`, "i");
      if (regex.test(cleaned)) {
        cleaned = cleaned.replace(regex, "").trim();
        changed = true;
      }
    }
  }

  // Remove trailing and leading 'and' or stray single letters
  cleaned = cleaned.replace(/^(and|the)\s+/i, "").replace(/\s+(and|the)$/i, "").trim();

  // Final collapse
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

export function normalizeDomain(rawDomain: string | null | undefined): string | null {
  if (!rawDomain) return null;

  let domain = rawDomain.toLowerCase().trim();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//i, "");

  // Remove www.
  domain = domain.replace(/^www\./i, "");

  // Remove paths, queries, hashes, ports
  domain = domain.split("/")[0];
  domain = domain.split("?")[0];
  domain = domain.split("#")[0];
  domain = domain.split(":")[0];

  domain = domain.trim();

  return domain.length > 0 ? domain : null;
}

export function normalizePhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  // Keep only digits
  let digits = rawPhone.replace(/\D/g, "");

  // If starts with 91 and has 12 digits, strip 91 country code
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // If starts with 0 and has 11 digits, strip leading 0
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.length >= 7 ? digits : null;
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
