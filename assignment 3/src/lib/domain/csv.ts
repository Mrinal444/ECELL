/**
 * Defends against CSV injection (formula injection).
 * If a cell starts with `=`, `+`, `-`, `@`, `\t`, or `\r`, prepends it with a single quote `'`.
 */
export function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';

  let strValue = String(value);

  const injectionChars = ['=', '+', '-', '@', '\t', '\r'];
  if (strValue.length > 0 && injectionChars.includes(strValue[0])) {
    strValue = "'" + strValue;
  }

  return strValue;
}

/**
 * Returns RFC-4180 compliant CSV string for a cell.
 * Escapes quotes as "" and wraps the cell in quotes if it contains commas, newlines, or quotes.
 */
export function formatCsvCell(value: string | number | null | undefined): string {
  const sanitized = sanitizeCsvCell(value);

  if (
    sanitized.includes(',') ||
    sanitized.includes('"') ||
    sanitized.includes('\n') ||
    sanitized.includes('\r')
  ) {
    const escaped = sanitized.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return sanitized;
}

/**
 * Generates the full CSV string from headers and rows.
 */
export function generateCsv(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(formatCsvCell).join(',');
  const rowLines = rows.map(row => row.map(formatCsvCell).join(','));

  return [headerLine, ...rowLines].join('\n');
}
