import { nextToExpire, rowsForHeight } from '../widget';

const item = (id: string, endDate: string) => ({ id, name: id, store: null, endDate });
const TODAY = '2026-11-27';

describe('nextToExpire', () => {
  const items = [
    item('later', '2027-06-01'),
    item('expired', '2026-11-26'),
    item('today', '2026-11-27'),
    item('soon', '2026-12-10'),
    item('far', '2030-01-01'),
  ];

  it('keeps running warranties only, soonest first, three at most', () => {
    expect(nextToExpire(items, TODAY).map((r) => r.id)).toEqual(['today', 'soon', 'later']);
  });

  it('gives days left and status', () => {
    const [first, second] = nextToExpire(items, TODAY);
    expect(first).toMatchObject({ daysLeft: 0, status: 'soon' });
    expect(second).toMatchObject({ daysLeft: 13, status: 'soon' });
  });

  it('limits the number of rows between 1 and 3', () => {
    expect(nextToExpire(items, TODAY, 1)).toHaveLength(1);
    expect(nextToExpire(items, TODAY, 0)).toHaveLength(1);
    expect(nextToExpire(items, TODAY, 10)).toHaveLength(3);
  });

  it('is empty when nothing is covered any more', () => {
    expect(nextToExpire([item('a', '2020-01-01')], TODAY)).toEqual([]);
    expect(nextToExpire([], TODAY)).toEqual([]);
  });
});

describe('rowsForHeight', () => {
  it('fits more rows in taller widgets', () => {
    expect(rowsForHeight(60)).toBe(1);
    expect(rowsForHeight(120)).toBe(2);
    expect(rowsForHeight(250)).toBe(3);
  });
});
