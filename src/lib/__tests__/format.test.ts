import { formatPrice, parseMonths, parsePrice } from '../format';
import { validateDraft } from '../validate';

describe('parsePrice', () => {
  it('accepts dot, comma and spaces', () => {
    expect(parsePrice('12')).toBe(12);
    expect(parsePrice('12,5')).toBe(12.5);
    expect(parsePrice('1 299,90')).toBe(1299.9);
    expect(parsePrice('1 299.99')).toBe(1299.99);
  });
  it('returns null when empty and undefined when invalid', () => {
    expect(parsePrice('  ')).toBeNull();
    expect(parsePrice('abc')).toBeUndefined();
    expect(parsePrice('-5')).toBeUndefined();
    expect(parsePrice('1.234')).toBeUndefined();
  });
});

describe('formatPrice', () => {
  it('formats with two decimals', () => {
    expect(formatPrice(1299.9, 'en-US')).toBe('1,299.90');
  });
});

describe('parseMonths', () => {
  it('accepts whole positive numbers only', () => {
    expect(parseMonths('18')).toBe(18);
    expect(parseMonths('0')).toBeNull();
    expect(parseMonths('2.5')).toBeNull();
    expect(parseMonths('')).toBeNull();
  });
});

describe('validateDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateDraft({ name: 'Four', purchaseDate: '2026-01-15', months: 24, price: '' })).toEqual([]);
  });
  it('reports every problem', () => {
    expect(validateDraft({ name: ' ', purchaseDate: '2026-02-30', months: null, price: 'x' })).toEqual([
      'nameRequired',
      'dateInvalid',
      'monthsInvalid',
      'priceInvalid',
    ]);
  });
});
