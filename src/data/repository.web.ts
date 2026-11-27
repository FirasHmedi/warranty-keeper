/**
 * Web build only (used for README previews): an in-memory store, because the app targets
 * Android and expo-sqlite on web needs extra server headers. Open the web build with `?demo=1`
 * to load generic sample items. Nothing is persisted.
 */
import { addMonths, toISODate } from '../lib/dates';
import type { Item, ItemRepository } from './types';

const items = new Map<string, Item>();

function sample(id: string, name: string, store: string | null, monthsAgo: number, months: number, price: number | null, notes: string | null): Item {
  const purchaseDate = addMonths(toISODate(new Date()), -monthsAgo);
  return {
    id,
    name,
    store,
    purchaseDate,
    warrantyMonths: months,
    endDate: addMonths(purchaseDate, months),
    price,
    notes,
    receiptUri: null,
    remindersEnabled: monthsAgo < months,
    notificationIds: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

function seedIfDemo() {
  if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('demo')) return;
  const fr = typeof navigator !== 'undefined' && navigator.language.startsWith('fr');
  const demo: Item[] = fr
    ? [
        sample('d1', 'Lave-linge', 'Magasin d’électroménager', 3, 24, 499, 'Numéro de série au dos.'),
        sample('d2', 'Ordinateur portable', 'Boutique en ligne', 23, 24, 899.9, null),
        sample('d3', 'Casque audio', null, 13, 12, 79, null),
        sample('d4', 'Aspirateur', 'Magasin du quartier', 10, 36, 149, null),
        sample('d5', 'Grille-pain', null, 12, 12, 35.5, null),
      ]
    : [
        sample('d1', 'Washing machine', 'Appliance store', 3, 24, 499, 'Serial number on the back.'),
        sample('d2', 'Laptop', 'Online shop', 23, 24, 899.9, null),
        sample('d3', 'Headphones', null, 13, 12, 79, null),
        sample('d4', 'Vacuum cleaner', 'Local store', 10, 36, 149, null),
        sample('d5', 'Toaster', null, 12, 12, 35.5, null),
      ];
  for (const item of demo) items.set(item.id, item);
}
seedIfDemo();

export const repository: ItemRepository = {
  async list() {
    return [...items.values()];
  },
  async get(id) {
    return items.get(id) ?? null;
  },
  async upsert(item) {
    items.set(item.id, { ...item });
  },
  async remove(id) {
    items.delete(id);
  },
};
