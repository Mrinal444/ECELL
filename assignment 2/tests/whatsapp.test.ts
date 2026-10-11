import { describe, it, expect } from "vitest";
import {
  WHATSAPP_TEMPLATES,
  renderWhatsAppMessage,
  generateWhatsAppUrl,
} from "@/lib/whatsapp";

describe("WhatsApp Templates and Generator", () => {
  it("renders variables into template text correctly", () => {
    const template = WHATSAPP_TEMPLATES[0].templateText;
    const rendered = renderWhatsAppMessage(template, {
      contactName: "Rahul Sharma",
      userName: "Aarav Lead",
      companyName: "TechCorp",
      campaignName: "E-Summit 2026",
    });

    expect(rendered).toContain("Hi Rahul Sharma");
    expect(rendered).toContain("Aarav Lead from the Corporate Outreach");
    expect(rendered).toContain("TechCorp");
    expect(rendered).toContain("E-Summit 2026");
  });

  it("handles missing variables with sensible fallbacks", () => {
    const template = "Hi {{contactName}}, from {{userName}} for {{companyName}} - {{campaignName}}";
    const rendered = renderWhatsAppMessage(template, {});

    expect(rendered).toBe("Hi Sir/Ma'am, from E-Cell Outreach Team for your company - E-Summit 2026");
  });

  it("generates correct wa.me link with 91 prefix for Indian mobile numbers", () => {
    const url = generateWhatsAppUrl("+91 98765 43210", "Hello from E-Cell!");
    expect(url).toBe("https://wa.me/919876543210?text=Hello%20from%20E-Cell!");
  });

  it("returns null for invalid phone numbers", () => {
    const url = generateWhatsAppUrl("invalid-phone", "Hello!");
    expect(url).toBeNull();
  });
});
