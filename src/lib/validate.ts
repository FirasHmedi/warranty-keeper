import { isValidISODate } from './dates';
import { parsePrice } from './format';
import { isValidMonths } from './warranty';

export interface ItemDraft {
  name: string;
  purchaseDate: string;
  months: number | null;
  price: string;
}

export type DraftError = 'nameRequired' | 'dateInvalid' | 'monthsInvalid' | 'priceInvalid';

export function validateDraft(draft: ItemDraft): DraftError[] {
  const errors: DraftError[] = [];
  if (!draft.name.trim()) errors.push('nameRequired');
  if (!isValidISODate(draft.purchaseDate)) errors.push('dateInvalid');
  if (draft.months === null || !isValidMonths(draft.months)) errors.push('monthsInvalid');
  if (parsePrice(draft.price) === undefined) errors.push('priceInvalid');
  return errors;
}
