import { normalizePhone } from "./normalization";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "PITCH" | "FOLLOW_UP" | "MEETING" | "THANK_YOU";
  subject: string;
  templateText: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "pitch_initial",
    name: "Summit Sponsorship Pitch",
    category: "PITCH",
    subject: "Initial Outreach Pitch",
    templateText:
      "Hi {{contactName}},\n\nI hope you are having a productive week! I am {{userName}} from the Corporate Outreach & Sponsorship division at E-Cell.\n\nWe are hosting {{campaignName}}, our flagship entrepreneurship summit with over 5,000+ top engineering & management students, tech founders, and angel investors.\n\nWe have been following {{companyName}}'s impressive market leadership and would love to partner with you as an official sponsor. Could we connect for a brief 10-minute discovery call this week to share our deck and sponsorship deliverables?\n\nBest regards,\n{{userName}}\nE-Cell Outreach",
  },
  {
    id: "followup_nudge",
    name: "Gentle Follow-Up Nudge",
    category: "FOLLOW_UP",
    subject: "Quick follow-up on deck",
    templateText:
      "Hi {{contactName}},\n\nFollowing up on our earlier note regarding {{campaignName}} partnership opportunities for {{companyName}}.\n\nWe are currently finalizing our brochure packages and want to ensure {{companyName}} has priority category exclusivity. Would tomorrow afternoon or Thursday work for a quick sync?\n\nLooking forward to hearing your thoughts!\n\nBest,\n{{userName}}",
  },
  {
    id: "meeting_confirmation",
    name: "Meeting Schedule & Agenda",
    category: "MEETING",
    subject: "Meeting details & agenda",
    templateText:
      "Hi {{contactName}},\n\nThank you for agreeing to connect! We look forward to our meeting to discuss {{companyName}}'s sponsorship footprint at {{campaignName}}.\n\nAgenda:\n1. {{campaignName}} attendee demographic overview\n2. Customized brand engagement stalls & branding slots\n3. Deliverable deliverables & sponsorship tiers\n\nSee you then!\n{{userName}}",
  },
  {
    id: "onboarding_thankyou",
    name: "Confirmation & Welcome",
    category: "THANK_YOU",
    subject: "Welcome onboard partner",
    templateText:
      "Hi {{contactName}},\n\nWe are thrilled to officially welcome {{companyName}} onboard as our partner for {{campaignName}}!\n\nOur operations lead will share the MOU, invoice draft, and creative asset specifications shortly. Thank you for empowering student entrepreneurship with us!\n\nWarm regards,\n{{userName}}\nE-Cell Team",
  },
];

export function renderWhatsAppMessage(
  templateText: string,
  variables: {
    contactName?: string;
    userName?: string;
    companyName?: string;
    campaignName?: string;
  }
): string {
  let result = templateText;
  result = result.replace(/\{\{contactName\}\}/g, variables.contactName || "Sir/Ma'am");
  result = result.replace(/\{\{userName\}\}/g, variables.userName || "E-Cell Outreach Team");
  result = result.replace(/\{\{companyName\}\}/g, variables.companyName || "your company");
  result = result.replace(/\{\{campaignName\}\}/g, variables.campaignName || "E-Summit 2026");
  return result;
}

export function generateWhatsAppUrl(phone: string, message: string): string | null {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return null;

  // Indian numbers: if 10 digits, prefix 91
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedText}`;
}
