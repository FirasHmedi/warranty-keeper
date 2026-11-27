import { buildList, countByStatus, matchesQuery, normalizeText, sortByEndDate } from '../items';

const items = [
  { id: '1', name: 'Lave-linge', store: 'Magasin du centre', endDate: '2028-01-10' },
  { id: '2', name: 'Téléphone', store: null, endDate: '2026-12-05' },
  { id: '3', name: 'Casque audio', store: 'Boutique en ligne', endDate: '2025-06-01' },
  { id: '4', name: 'Aspirateur', store: null, endDate: '2026-12-05' },
];
const today = '2026-11-27';

describe('search', () => {
  it('ignores case and accents', () => {
    expect(normalizeText('  TÉLÉPHONE ')).toBe('telephone');
    expect(matchesQuery(items[1], 'telephone')).toBe(true);
  });
  it('also matches the store', () => {
    expect(matchesQuery(items[0], 'centre')).toBe(true);
    expect(matchesQuery(items[1], 'centre')).toBe(false);
  });
  it('matches everything for an empty query', () => {
    expect(matchesQuery(items[2], '   ')).toBe(true);
  });
});

describe('sortByEndDate', () => {
  it('puts the soonest end date first and breaks ties by name', () => {
    expect(sortByEndDate(items).map((i) => i.id)).toEqual(['3', '4', '2', '1']);
  });
  it('does not mutate the input', () => {
    const copy = [...items];
    sortByEndDate(items);
    expect(items).toEqual(copy);
  });
});

describe('buildList', () => {
  it('computes status and days left, then filters', () => {
    const all = buildList(items, today, '', 'all');
    expect(all.map((v) => [v.item.id, v.status, v.daysLeft])).toEqual([
      ['3', 'expired', -544],
      ['4', 'soon', 8],
      ['2', 'soon', 8],
      ['1', 'active', 409],
    ]);
    expect(buildList(items, today, '', 'soon').map((v) => v.item.id)).toEqual(['4', '2']);
    expect(buildList(items, today, 'asp', 'soon').map((v) => v.item.id)).toEqual(['4']);
    expect(buildList(items, today, 'asp', 'expired')).toEqual([]);
  });
  it('counts items per status', () => {
    expect(countByStatus(items, today)).toEqual({ active: 1, soon: 2, expired: 1 });
  });
});
