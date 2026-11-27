import { daysRemaining, isValidMonths, reminderSchedule, warrantyEndDate, warrantyStatus } from '../warranty';

describe('warrantyEndDate', () => {
  it('adds the warranty length to the purchase date', () => {
    expect(warrantyEndDate('2025-05-20', 24)).toBe('2027-05-20');
    expect(warrantyEndDate('2025-08-31', 6)).toBe('2026-02-28');
  });
});

describe('warrantyStatus', () => {
  const today = '2026-11-27';
  it('is active when more than 30 days remain', () => {
    expect(warrantyStatus('2026-12-28', today)).toBe('active');
  });
  it('ends soon at exactly 30 days and on the end date', () => {
    expect(warrantyStatus('2026-12-27', today)).toBe('soon');
    expect(warrantyStatus('2026-11-27', today)).toBe('soon');
  });
  it('is expired the day after the end date', () => {
    expect(warrantyStatus('2026-11-26', today)).toBe('expired');
  });
});

describe('daysRemaining', () => {
  it('is 0 on the end date and negative after', () => {
    expect(daysRemaining('2026-11-27', '2026-11-27')).toBe(0);
    expect(daysRemaining('2026-11-27', '2026-12-02')).toBe(-5);
    expect(daysRemaining('2027-11-27', '2026-11-27')).toBe(365);
  });
});

describe('reminderSchedule', () => {
  it('returns a reminder 30 days before and one on the end date, at 09:00 local', () => {
    const r = reminderSchedule('2027-03-15', new Date(2026, 10, 27, 12, 0));
    expect(r.map((x) => [x.kind, x.date])).toEqual([
      ['before', '2027-02-13'],
      ['end', '2027-03-15'],
    ]);
    expect(r[0].at.getHours()).toBe(9);
    expect(r[0].at.getDate()).toBe(13);
  });
  it('skips reminders already in the past', () => {
    const r = reminderSchedule('2026-12-10', new Date(2026, 10, 27, 12, 0));
    expect(r.map((x) => x.kind)).toEqual(['end']);
  });
  it('skips the end-date reminder once 09:00 has passed on that day', () => {
    expect(reminderSchedule('2026-11-27', new Date(2026, 10, 27, 8, 59))).toHaveLength(1);
    expect(reminderSchedule('2026-11-27', new Date(2026, 10, 27, 9, 0))).toHaveLength(0);
  });
  it('returns nothing for an expired warranty', () => {
    expect(reminderSchedule('2025-01-01', new Date(2026, 10, 27))).toEqual([]);
  });
});

describe('isValidMonths', () => {
  it('accepts whole positive months only', () => {
    expect(isValidMonths(24)).toBe(true);
    expect(isValidMonths(0)).toBe(false);
    expect(isValidMonths(1.5)).toBe(false);
    expect(isValidMonths(601)).toBe(false);
  });
});
