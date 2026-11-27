import type { ISODate } from './dates';
import { daysRemaining, warrantyStatus, type WarrantyStatus } from './warranty';

export interface ItemLike {
  id: string;
  name: string;
  store: string | null;
  endDate: ISODate;
}

export type StatusFilter = 'all' | WarrantyStatus;

/** Lower-case and strip accents so "telephone" finds "Téléphone". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesQuery(item: Pick<ItemLike, 'name' | 'store'>, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  return normalizeText(item.name).includes(q) || (item.store ? normalizeText(item.store).includes(q) : false);
}

/** Soonest end date first; ties broken by name so the order is stable. */
export function sortByEndDate<T extends ItemLike>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.endDate !== b.endDate) return a.endDate < b.endDate ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export interface ItemView<T extends ItemLike> {
  item: T;
  status: WarrantyStatus;
  daysLeft: number;
}

export function buildList<T extends ItemLike>(
  items: readonly T[],
  today: ISODate,
  query: string,
  filter: StatusFilter,
): ItemView<T>[] {
  return sortByEndDate(items)
    .map((item) => ({ item, status: warrantyStatus(item.endDate, today), daysLeft: daysRemaining(item.endDate, today) }))
    .filter((v) => (filter === 'all' || v.status === filter) && matchesQuery(v.item, query));
}

export function countByStatus(items: readonly ItemLike[], today: ISODate): Record<WarrantyStatus, number> {
  const counts: Record<WarrantyStatus, number> = { active: 0, soon: 0, expired: 0 };
  for (const item of items) counts[warrantyStatus(item.endDate, today)] += 1;
  return counts;
}
