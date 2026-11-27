import { addDays, addMonths, daysBetween, daysInMonth, isValidISODate, parseISODate, toISODate } from '../dates';

describe('parseISODate', () => {
  it('accepts real calendar dates', () => {
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });
  it('rejects impossible or malformed dates', () => {
    expect(isValidISODate('2023-02-29')).toBe(false);
    expect(isValidISODate('2024-13-01')).toBe(false);
    expect(isValidISODate('2024-04-31')).toBe(false);
    expect(isValidISODate('24-01-01')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
});

describe('daysInMonth', () => {
  it('handles leap years, including century rules', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe('addMonths', () => {
  it('adds months within the same day', () => {
    expect(addMonths('2026-03-15', 24)).toBe('2028-03-15');
  });
  it('rolls over the year', () => {
    expect(addMonths('2026-11-10', 3)).toBe('2027-02-10');
  });
  it('clamps to the end of a shorter month', () => {
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-08-31', 1)).toBe('2026-09-30');
  });
  it('clamps Feb 29 to Feb 28 in a non-leap year', () => {
    expect(addMonths('2024-02-29', 12)).toBe('2025-02-28');
    expect(addMonths('2024-02-29', 48)).toBe('2028-02-29');
  });
  it('supports negative months', () => {
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });
  it('throws on invalid input', () => {
    expect(() => addMonths('2026-02-30', 1)).toThrow();
    expect(() => addMonths('2026-02-01', 1.5)).toThrow();
  });
});

describe('addDays / daysBetween', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
  it('counts calendar days, ignoring daylight saving changes', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-01-10', '2026-01-01')).toBe(-9);
  });
});

describe('toISODate', () => {
  it('uses the local calendar day', () => {
    expect(toISODate(new Date(2026, 10, 27, 23, 59))).toBe('2026-11-27');
  });
});
