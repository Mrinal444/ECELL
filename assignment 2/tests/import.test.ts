import { describe, it, expect } from "vitest";
import Papa from "papaparse";
import { normalizeCompanyName, normalizeDomain, normalizePhone } from "@/lib/normalization";

describe("CSV Parsing and Column Mapping", () => {
  const sampleCsv = `Company Name,Website,Contact Person,Designation,Phone Number,Email,Target Tier,Est Budget,City
Zomato Ltd.,https://zomato.com,Deepinder G,CEO,+919876543210,deepinder@zomato.com,TITLE,2500000,Gurugram
Swiggy Pvt Ltd,swiggy.in,Sriharsha M,Founder,919876543211,harsha@swiggy.in,PLATINUM,1500000,Bengaluru
CRED,cred.club,Kunal S,Founder,09876543212,kunal@cred.club,GOLD,1000000,Bengaluru`;

  it("parses CSV correctly with PapaParse", () => {
    const parsed = Papa.parse(sampleCsv, { header: true, skipEmptyLines: true });
    expect(parsed.data.length).toBe(3);
    const row1 = parsed.data[0] as any;
    expect(row1["Company Name"]).toBe("Zomato Ltd.");
    expect(row1["Website"]).toBe("https://zomato.com");
    expect(row1["Phone Number"]).toBe("+919876543210");
  });

  it("correctly extracts and normalizes parsed rows", () => {
    const parsed = Papa.parse(sampleCsv, { header: true, skipEmptyLines: true });
    const rows = parsed.data as any[];

    const processed = rows.map((r, index) => ({
      rowIndex: index + 1,
      companyName: r["Company Name"],
      normalizedName: normalizeCompanyName(r["Company Name"]),
      domain: normalizeDomain(r["Website"]),
      phone: normalizePhone(r["Phone Number"]),
      contactName: r["Contact Person"],
    }));

    expect(processed[0].normalizedName).toBe("zomato");
    expect(processed[0].domain).toBe("zomato.com");
    expect(processed[0].phone).toBe("9876543210");

    expect(processed[1].normalizedName).toBe("swiggy");
    expect(processed[1].domain).toBe("swiggy.in");
    expect(processed[1].phone).toBe("9876543211");

    expect(processed[2].normalizedName).toBe("cred");
    expect(processed[2].domain).toBe("cred.club");
    expect(processed[2].phone).toBe("9876543212");
  });
});
