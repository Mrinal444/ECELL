import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, formatCsvCell, generateCsv } from '../src/lib/domain/csv';

describe('CSV Logic', () => {
  it('mitigates formula injection', () => {
    expect(sanitizeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(sanitizeCsvCell('+1')).toBe("'+1");
    expect(sanitizeCsvCell('-1')).toBe("'-1");
    expect(sanitizeCsvCell('@cmd')).toBe("'@cmd");
    expect(sanitizeCsvCell('\tcmd')).toBe("'\tcmd");
    expect(sanitizeCsvCell('\rcmd')).toBe("'\rcmd");
    expect(sanitizeCsvCell('Normal text')).toBe("Normal text");
    expect(sanitizeCsvCell(123)).toBe("123");
    expect(sanitizeCsvCell(null)).toBe("");
  });

  it('formats cells according to RFC-4180', () => {
    // Contains comma -> wrap in quotes
    expect(formatCsvCell('Hello, World')).toBe('"Hello, World"');

    // Contains newline -> wrap in quotes
    expect(formatCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');

    // Contains quotes -> escape as "" and wrap in quotes
    expect(formatCsvCell('He said "Hi"')).toBe('"He said ""Hi"""');
  });

  it('generates a full CSV string', () => {
    const headers = ['Rank', 'Team', 'Total'];
    const rows = [
      ['1', 'Team A, Inc', 8.5],
      ['2', '=cmd', '7.0"'],
    ];

    const expected = `Rank,Team,Total
1,"Team A, Inc",8.5
2,'=cmd,"7.0"""`;

    expect(generateCsv(headers, rows)).toBe(expected);
  });
});
