export type UserRole = "LEAD" | "MEMBER";

export type OrgType = "SPONSOR" | "SPEAKER" | "PARTNER";

export type DealStage =
  | "PROSPECT"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING_SCHEDULED"
  | "NEGOTIATION"
  | "CONFIRMED"
  | "LOST";

export type LostReason =
  | "BUDGET"
  | "NO_RESPONSE"
  | "COMPETITOR"
  | "TIMING"
  | "OTHER";

export type SponsorshipTier =
  | "TITLE"
  | "CO_TITLE"
  | "PLATINUM"
  | "GOLD"
  | "SILVER"
  | "BRONZE"
  | "IN_KIND"
  | "PARTNER";

export type DealType = "CASH" | "IN_KIND" | "HYBRID";

export type PaymentStatus = "PLEDGED" | "INVOICED" | "RECEIVED";

export type ActivityType =
  | "WHATSAPP"
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "NOTE"
  | "STAGE_CHANGE"
  | "ASSIGNMENT"
  | "MERGE";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface DuplicateMatchResult {
  matchType: "EXACT_NAME" | "EXACT_DOMAIN" | "FUZZY_NAME" | "PHONE_COLLISION";
  confidence: number; // 0 to 100
  matchedField: string;
  matchedValue: string;
  organization: {
    id: string;
    name: string;
    normalizedName: string;
    domain: string | null;
    city: string | null;
  };
  activeDeal?: {
    id: string;
    campaignName: string;
    stage: DealStage;
    ownerName: string | null;
    ownerEmail: string | null;
    lastActivityAt: string;
    daysSinceLastActivity: number;
  } | null;
}

export interface CsvMappingConfig {
  companyNameCol: string;
  domainCol?: string;
  typeCol?: string;
  cityCol?: string;
  contactNameCol?: string;
  contactTitleCol?: string;
  contactPhoneCol?: string;
  contactEmailCol?: string;
  stageCol?: string;
  tierCol?: string;
  valueCol?: string;
  notesCol?: string;
}

export interface CsvParsedRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    companyName: string;
    domain?: string;
    type: OrgType;
    city?: string;
    contactName?: string;
    contactTitle?: string;
    contactPhone?: string;
    contactEmail?: string;
    stage: DealStage;
    tier?: SponsorshipTier;
    valueINR?: number;
    notes?: string;
  };
  status: "NEW" | "EXACT_MATCH_ATTACH" | "EXACT_MATCH_SKIP" | "FUZZY_MATCH_QUEUE" | "INVALID";
  errors: string[];
  duplicateMatches?: DuplicateMatchResult[];
}
