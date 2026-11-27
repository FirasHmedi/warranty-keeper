export interface Item {
  id: string;
  name: string;
  store: string | null;
  purchaseDate: string; // YYYY-MM-DD
  warrantyMonths: number;
  endDate: string; // YYYY-MM-DD, computed from purchaseDate + warrantyMonths
  price: number | null;
  notes: string | null;
  receiptUri: string | null;
  remindersEnabled: boolean;
  notificationIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ItemRepository {
  list(): Promise<Item[]>;
  get(id: string): Promise<Item | null>;
  upsert(item: Item): Promise<void>;
  remove(id: string): Promise<void>;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
