export interface MatchableMember {
  id: string;
  name: string;
  aliases: string | string[];
  role?: string;
  email?: string | null;
}

/**
 * Normalizes string for fuzzy comparison: lowercases, removes special characters, trims
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[@#:,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matches a raw text name against a list of members and their aliases.
 * Returns the matched member's ID or null if unassigned.
 */
export function matchAssignee(rawName: string | null | undefined, members: MatchableMember[]): string | null {
  if (!rawName || typeof rawName !== 'string') return null;

  const normalizedInput = normalizeString(rawName);
  if (!normalizedInput || normalizedInput === 'unassigned' || normalizedInput === 'none' || normalizedInput === 'tbd') {
    return null;
  }

  // 1. Direct exact or normalized name match
  for (const member of members) {
    const normName = normalizeString(member.name);
    if (normName === normalizedInput) {
      return member.id;
    }

    // Split first and last name
    const parts = normName.split(' ');
    if (parts.length > 0 && parts[0] === normalizedInput && normalizedInput.length > 2) {
      return member.id;
    }
  }

  // 2. Alias matching
  for (const member of members) {
    let aliasesList: string[] = [];
    if (Array.isArray(member.aliases)) {
      aliasesList = member.aliases;
    } else if (typeof member.aliases === 'string') {
      try {
        aliasesList = JSON.parse(member.aliases);
      } catch {
        aliasesList = member.aliases.split(',').map((s) => s.trim());
      }
    }

    for (const alias of aliasesList) {
      if (!alias) continue;
      const normAlias = normalizeString(alias);
      if (normAlias === normalizedInput) {
        return member.id;
      }
      if (normalizedInput.includes(normAlias) && normAlias.length >= 3) {
        return member.id;
      }
    }
  }

  // 3. Substring / partial match (e.g. "Rahul S" against "Rahul Sharma")
  for (const member of members) {
    const normName = normalizeString(member.name);
    if (normName.includes(normalizedInput) || normalizedInput.includes(normName)) {
      return member.id;
    }
  }

  return null;
}
