"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Layers,
  HelpCircle,
} from "lucide-react";
import { processCsvImportAction, ImportRowData, ImportReportItem } from "@/actions/import";

interface CsvWizardProps {
  campaignId: string;
  campaignName: string;
}

const SAMPLE_CSV_DATA = `Company Name,Domain,City,Contact Name,Contact Title,Phone,Email,Stage,Tier,Value INR,Notes
"Razorpay Software Pvt Ltd","razorpay.com","Bengaluru","Harshil Mathur","CEO","+91 9876543210","outreach@razorpay.com","NEGOTIATION","TITLE",500000,"Interested in Fintech Track Sponsorship"
"Tata Consultancy Services","tcs.com","Mumbai","Rajesh Gopinathan","Director","919876543211","sponsorships@tcs.com","CONTACTED","ASSOCIATE",250000,"Campus hiring team outreach"
"CRED Solutions India","cred.club","Bengaluru","Kunal Shah","Founder","9876543212","partnerships@cred.club","PROSPECT","EVENT_SPONSOR",100000,"Intro sent via alumni"
"PhysicsWallah Pvt Ltd","pw.live","Noida","Alakh Pandey","CEO","9876543213","events@pw.live","MEETING_SCHEDULED","POWERED_BY",350000,"Keynote speaker + booth requested"
"Boat Lifestyle Ltd","boat-lifestyle.com","Delhi","Aman Gupta","Co-Founder","9876543214","marketing@boat-lifestyle.com","CONFIRMED","EVENT_SPONSOR",150000,"Pledged audio gear sponsor"`;

export function CsvWizard({ campaignId, campaignName }: CsvWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvRawText, setCsvRawText] = useState<string>("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({
    companyName: "",
    domain: "",
    city: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
    stage: "",
    tier: "",
    valueINR: "",
    notes: "",
  });

  const [options, setOptions] = useState({
    skipExactDuplicates: true,
    attachExistingOrganizations: true,
    importFuzzyAsNew: false,
  });

  const [processing, setProcessing] = useState(false);
  const [reportResult, setReportResult] = useState<{
    totalProcessed: number;
    createdCount: number;
    attachedCount: number;
    skippedCount: number;
    fuzzyCount: number;
    errorCount: number;
    report: ImportReportItem[];
  } | null>(null);

  // Parse CSV text and auto-map headers
  const handleParseCsv = (content: string) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as Record<string, string>);
          setCsvHeaders(headers);
          setParsedRows(results.data as Record<string, string>[]);

          // Auto-guess mapping
          const newMapping: { [key: string]: string } = {};
          headers.forEach((h) => {
            const low = h.toLowerCase().trim();
            if (low.includes("company") || low.includes("org") || low.includes("name") && !low.includes("contact")) {
              newMapping.companyName = h;
            } else if (low.includes("domain") || low.includes("website") || low.includes("url")) {
              newMapping.domain = h;
            } else if (low.includes("city") || low.includes("location")) {
              newMapping.city = h;
            } else if (low.includes("contact") && (low.includes("name") || low.includes("person") || low.includes("poc"))) {
              newMapping.contactName = h;
            } else if (low.includes("title") || low.includes("designation") || low.includes("role")) {
              newMapping.contactTitle = h;
            } else if (low.includes("phone") || low.includes("mobile") || low.includes("whatsapp")) {
              newMapping.contactPhone = h;
            } else if (low.includes("email") || low.includes("mail")) {
              newMapping.contactEmail = h;
            } else if (low.includes("stage") || low.includes("status")) {
              newMapping.stage = h;
            } else if (low.includes("tier") || low.includes("package")) {
              newMapping.tier = h;
            } else if (low.includes("value") || low.includes("amount") || low.includes("inr") || low.includes("money")) {
              newMapping.valueINR = h;
            } else if (low.includes("note") || low.includes("remark") || low.includes("comment")) {
              newMapping.notes = h;
            }
          });

          setColumnMapping((prev) => ({ ...prev, ...newMapping }));
          setStep(2);
        }
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvRawText(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvRawText(SAMPLE_CSV_DATA);
    handleParseCsv(SAMPLE_CSV_DATA);
  };

  const handleExecuteImport = async () => {
    setProcessing(true);
    setStep(4);

    try {
      const formattedRows: ImportRowData[] = parsedRows.map((row, idx) => {
        const valStr = columnMapping.valueINR ? row[columnMapping.valueINR] : undefined;
        const cleanVal = valStr ? Number(valStr.replace(/[^0-9.-]+/g, "")) : undefined;

        return {
          rowIndex: idx + 1,
          companyName: columnMapping.companyName ? row[columnMapping.companyName] : "",
          domain: columnMapping.domain ? row[columnMapping.domain] : undefined,
          city: columnMapping.city ? row[columnMapping.city] : undefined,
          contactName: columnMapping.contactName ? row[columnMapping.contactName] : undefined,
          contactTitle: columnMapping.contactTitle ? row[columnMapping.contactTitle] : undefined,
          contactPhone: columnMapping.contactPhone ? row[columnMapping.contactPhone] : undefined,
          contactEmail: columnMapping.contactEmail ? row[columnMapping.contactEmail] : undefined,
          stage: (columnMapping.stage ? row[columnMapping.stage] : "PROSPECT") as any,
          tier: (columnMapping.tier ? row[columnMapping.tier] : undefined) as any,
          valueINR: isNaN(cleanVal as any) ? undefined : cleanVal,
          notes: columnMapping.notes ? row[columnMapping.notes] : undefined,
        };
      });

      const res = await processCsvImportAction(campaignId, formattedRows, options);
      setReportResult(res);
    } catch (err) {
      console.error("Import processing error", err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadReportCsv = () => {
    if (!reportResult) return;
    const csvContent = Papa.unparse(reportResult.report);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ecell_crm_import_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Step Header Stepper */}
      <div className="grid grid-cols-4 gap-2 bg-surface p-3 border-2 border-border-grid shadow-sharp-sm">
        {[
          { num: 1, label: "1. Upload File" },
          { num: 2, label: "2. Map Columns" },
          { num: 3, label: "3. Strategy & Duplicate Rules" },
          { num: 4, label: "4. Execution Report" },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2 border font-bold text-center transition-all ${
              step === s.num
                ? "bg-ink text-canvas border-ink shadow-sharp-sm"
                : step > s.num
                ? "bg-green-100 text-green-900 border-green-300"
                : "bg-canvas text-ink-muted border-border-grid"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {step === 1 && (
        <div className="bg-surface border-2 border-border-grid p-8 shadow-sharp space-y-6 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 bg-canvas border-2 border-ink rounded-full flex items-center justify-center mx-auto shadow-sharp-sm">
              <UploadCloud className="w-7 h-7 text-ink" />
            </div>

            <h3 className="text-base font-bold text-ink uppercase">
              Import Outreach Leads from CSV
            </h3>
            <p className="text-ink-muted text-xs leading-relaxed">
              Target Campaign: <strong>{campaignName}</strong>. Upload your team's spreadsheet to automatically detect duplicate companies, map contacts, and populate the pipeline.
            </p>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 bg-ink text-canvas px-6 py-3 font-bold cursor-pointer hover:bg-stone-800 transition-all shadow-sharp">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Select CSV File From Computer</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-border-grid flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-ink hover:underline font-bold inline-flex items-center gap-1 text-xs"
              >
                <span>Or Load Indian Corporate Sponsor Sample CSV</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MAP COLUMNS */}
      {step === 2 && (
        <div className="bg-surface border-2 border-border-grid p-6 shadow-sharp space-y-6">
          <div>
            <h3 className="text-sm font-bold text-ink uppercase">
              Step 2: Map CSV Headers to CRM Fields
            </h3>
            <p className="text-ink-muted text-xs mt-0.5">
              Found {parsedRows.length} rows in CSV. Verify that each field corresponds to the right spreadsheet column.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "companyName", label: "Company Name*", required: true },
              { key: "domain", label: "Website Domain (e.g. tcs.com)" },
              { key: "city", label: "City / Headquarters" },
              { key: "contactName", label: "Primary Contact Person Name" },
              { key: "contactTitle", label: "Contact Designation / Title" },
              { key: "contactPhone", label: "Contact Phone (WhatsApp)" },
              { key: "contactEmail", label: "Contact Email" },
              { key: "stage", label: "Initial Deal Stage" },
              { key: "tier", label: "Sponsorship Tier" },
              { key: "valueINR", label: "Target Value (₹ INR)" },
              { key: "notes", label: "Notes / Initial Context" },
            ].map((field) => (
              <div key={field.key} className="p-3 bg-canvas border border-border-grid space-y-1">
                <label className="block font-bold text-ink">
                  {field.label}
                </label>
                <select
                  value={columnMapping[field.key] || ""}
                  onChange={(e) =>
                    setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                  }
                  className="w-full bg-white border border-border-grid p-2 font-mono text-xs focus:border-ink font-semibold"
                >
                  <option value="">-- Ignore / Not in CSV --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>
                      CSV Header: "{h}"
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Sample Row Preview */}
          <div className="border border-border-grid bg-canvas p-4 space-y-2">
            <h4 className="font-bold text-ink uppercase text-[11px]">
              Preview (First Parsed Row):
            </h4>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full border border-border-grid bg-white text-left">
                <tbody>
                  {Object.entries(parsedRows[0] || {}).map(([col, val]) => (
                    <tr key={col} className="border-b border-border-grid">
                      <td className="p-1.5 font-bold bg-stone-50 border-r border-border-grid w-1/3">
                        {col}
                      </td>
                      <td className="p-1.5 text-ink">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-grid">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
            >
              Back to Upload
            </button>

            <button
              type="button"
              disabled={!columnMapping.companyName}
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 bg-ink text-canvas px-6 py-2.5 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm disabled:opacity-50"
            >
              <span>Continue to Duplicate Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DUPLICATE & RESOLUTION RULES */}
      {step === 3 && (
        <div className="bg-surface border-2 border-border-grid p-6 shadow-sharp space-y-6">
          <div>
            <h3 className="text-sm font-bold text-ink uppercase">
              Step 3: Duplicate Handling & Campaign Policies
            </h3>
            <p className="text-ink-muted text-xs mt-0.5">
              Control how normalized name collisions and domain matches are handled during bulk import.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-canvas border border-border-grid cursor-pointer hover:border-ink">
              <input
                type="checkbox"
                checked={options.attachExistingOrganizations}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    attachExistingOrganizations: e.target.checked,
                  })
                }
                className="mt-0.5 w-4 h-4 accent-ink"
              />
              <div>
                <div className="font-bold text-ink">
                  Attach to Existing Organization if Found
                </div>
                <div className="text-ink-muted text-[11px] mt-0.5">
                  If an organization already exists from previous campaigns (e.g. E-Summit 2025), create a new Deal under that existing company profile instead of failing or creating a duplicate org record.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-canvas border border-border-grid cursor-pointer hover:border-ink">
              <input
                type="checkbox"
                checked={options.skipExactDuplicates}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    skipExactDuplicates: e.target.checked,
                  })
                }
                className="mt-0.5 w-4 h-4 accent-ink"
              />
              <div>
                <div className="font-bold text-ink">
                  Skip Exact Duplicate Deals in Current Campaign
                </div>
                <div className="text-ink-muted text-[11px] mt-0.5">
                  If a deal for this exact company already exists in {campaignName}, skip it and record in the final report to prevent double-claiming.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-canvas border border-border-grid cursor-pointer hover:border-ink">
              <input
                type="checkbox"
                checked={!options.importFuzzyAsNew}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    importFuzzyAsNew: !e.target.checked,
                  })
                }
                className="mt-0.5 w-4 h-4 accent-ink"
              />
              <div>
                <div className="font-bold text-ink">
                  Hold Fuzzy Matches for Manual Review
                </div>
                <div className="text-ink-muted text-[11px] mt-0.5">
                  Companies with similar names (e.g. "TCS India" vs "Tata Consultancy Services") will be flagged in the report instead of automatically merged or duplicated.
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-grid">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
            >
              Back to Mapping
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              className="flex items-center gap-1.5 bg-signal-amber text-ink border border-ink px-6 py-2.5 font-bold hover:bg-amber-400 transition-all shadow-sharp"
            >
              <span>Execute Batch Import ({parsedRows.length} Rows)</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: EXECUTION & REPORT */}
      {step === 4 && (
        <div className="bg-surface border-2 border-border-grid p-6 shadow-sharp space-y-6">
          {processing ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-ink border-t-transparent animate-spin rounded-full mx-auto" />
              <h3 className="text-base font-bold text-ink uppercase">
                Ingesting and Normalizing Data...
              </h3>
              <p className="text-xs text-ink-muted">
                Running duplicate algorithms, verifying contact uniqueness, and inserting deals.
              </p>
            </div>
          ) : reportResult ? (
            <div className="space-y-6">
              {/* Metric Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-canvas p-3 border border-border-grid">
                  <div className="text-[10px] text-ink-muted uppercase">Processed</div>
                  <div className="text-lg font-extrabold text-ink">
                    {reportResult.totalProcessed}
                  </div>
                </div>

                <div className="bg-green-50 p-3 border border-green-300">
                  <div className="text-[10px] text-green-800 uppercase">Created New</div>
                  <div className="text-lg font-extrabold text-green-900">
                    {reportResult.createdCount}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 border border-blue-300">
                  <div className="text-[10px] text-blue-800 uppercase">Attached Existing</div>
                  <div className="text-lg font-extrabold text-blue-900">
                    {reportResult.attachedCount}
                  </div>
                </div>

                <div className="bg-amber-50 p-3 border border-amber-300">
                  <div className="text-[10px] text-amber-800 uppercase">Flagged Fuzzy</div>
                  <div className="text-lg font-extrabold text-amber-900">
                    {reportResult.fuzzyCount}
                  </div>
                </div>

                <div className="bg-red-50 p-3 border border-red-300">
                  <div className="text-[10px] text-red-800 uppercase">Skipped / Error</div>
                  <div className="text-lg font-extrabold text-red-900">
                    {reportResult.skippedCount + reportResult.errorCount}
                  </div>
                </div>
              </div>

              {/* Download Report Button */}
              <div className="flex items-center justify-between p-3 bg-canvas border border-border-grid">
                <div className="text-xs text-ink">
                  Detailed execution log is ready. Nothing disappears silently.
                </div>
                <button
                  type="button"
                  onClick={downloadReportCsv}
                  className="flex items-center gap-1.5 bg-ink text-canvas px-4 py-2 font-bold hover:bg-stone-800 transition-colors shadow-sharp-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report (CSV)</span>
                </button>
              </div>

              {/* Report Table */}
              <div className="overflow-x-auto border border-border-grid max-h-[50vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-ink text-canvas uppercase text-[10px]">
                      <th className="p-2 border border-ink">Row</th>
                      <th className="p-2 border border-ink">Company</th>
                      <th className="p-2 border border-ink">Contact</th>
                      <th className="p-2 border border-ink">Status</th>
                      <th className="p-2 border border-ink">Action Taken</th>
                      <th className="p-2 border border-ink">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-grid bg-white">
                    {reportResult.report.map((item) => (
                      <tr key={item.rowIndex} className="hover:bg-canvas">
                        <td className="p-2 border-r border-border-grid font-bold">
                          #{item.rowIndex}
                        </td>
                        <td className="p-2 border-r border-border-grid font-bold">
                          {item.companyName}
                        </td>
                        <td className="p-2 border-r border-border-grid">
                          {item.contactName}
                        </td>
                        <td className="p-2 border-r border-border-grid font-bold">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] border ${
                              item.status === "CREATED"
                                ? "bg-green-100 text-green-900 border-green-300"
                                : item.status === "ATTACHED"
                                ? "bg-blue-100 text-blue-900 border-blue-300"
                                : item.status === "QUEUED_FUZZY"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-red-100 text-red-900 border-red-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2 border-r border-border-grid">
                          {item.actionTaken}
                        </td>
                        <td className="p-2 text-ink-muted text-[11px]">
                          {item.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <a
                  href={`/?campaign=${campaignId}`}
                  className="flex items-center gap-1.5 bg-ink text-canvas px-6 py-2.5 font-bold hover:bg-stone-800 transition-colors shadow-sharp"
                >
                  <Layers className="w-4 h-4" />
                  <span>Go to Pipeline Board</span>
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
