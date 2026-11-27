import type { ISODate } from './dates';
import { type ItemLike, sortByEndDate } from './items';
import { daysRemaining, warrantyStatus, type WarrantyStatus } from './warranty';

export interface WidgetRow {
  id: string;
  name: string;
  endDate: ISODate;
  daysLeft: number;
  status: WarrantyStatus;
}

/** Default number of rows shown by the "Next warranty to expire" widget. */
export const WIDGET_MAX_ROWS = 3;

/**
 * Items for the home-screen widget: warranties still running (ending today or later),
 * soonest end date first, at most `max` (1 to 3).
 */
export function nextToExpire(items: readonly ItemLike[], today: ISODate, max = WIDGET_MAX_ROWS): WidgetRow[] {
  const limit = Math.min(Math.max(Math.floor(max), 1), WIDGET_MAX_ROWS);
  return sortByEndDate(items)
    .map((item) => ({
      id: item.id,
      name: item.name,
      endDate: item.endDate,
      daysLeft: daysRemaining(item.endDate, today),
      status: warrantyStatus(item.endDate, today),
    }))
    .filter((row) => row.daysLeft >= 0)
    .slice(0, limit);
}

/** How many rows fit in a widget of this height (dp): 1 row on a 1-cell widget, up to 3. */
export function rowsForHeight(heightDp: number): number {
  if (heightDp < 110) return 1;
  if (heightDp < 160) return 2;
  return 3;
}
