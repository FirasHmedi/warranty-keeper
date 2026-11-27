import * as SQLite from 'expo-sqlite';

import type { Item, ItemRepository } from './types';

interface Row {
  id: string;
  name: string;
  store: string | null;
  purchase_date: string;
  warranty_months: number;
  end_date: string;
  price: number | null;
  notes: string | null;
  receipt_uri: string | null;
  reminders_enabled: number;
  notification_ids: string;
  created_at: number;
  updated_at: number;
}

const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('warranty.db');
      const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      if ((row?.user_version ?? 0) < SCHEMA_VERSION) {
        await database.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            store TEXT,
            purchase_date TEXT NOT NULL,
            warranty_months INTEGER NOT NULL,
            end_date TEXT NOT NULL,
            price REAL,
            notes TEXT,
            receipt_uri TEXT,
            reminders_enabled INTEGER NOT NULL DEFAULT 0,
            notification_ids TEXT NOT NULL DEFAULT '[]',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
          CREATE INDEX IF NOT EXISTS items_end_date ON items (end_date);
          PRAGMA user_version = ${SCHEMA_VERSION};
        `);
      }
      return database;
    })();
  }
  return dbPromise;
}

function parseIds(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function fromRow(r: Row): Item {
  return {
    id: r.id,
    name: r.name,
    store: r.store,
    purchaseDate: r.purchase_date,
    warrantyMonths: r.warranty_months,
    endDate: r.end_date,
    price: r.price,
    notes: r.notes,
    receiptUri: r.receipt_uri,
    remindersEnabled: r.reminders_enabled === 1,
    notificationIds: parseIds(r.notification_ids),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const repository: ItemRepository = {
  async list() {
    const rows = await (await db()).getAllAsync<Row>('SELECT * FROM items ORDER BY end_date, name');
    return rows.map(fromRow);
  },
  async get(id) {
    const row = await (await db()).getFirstAsync<Row>('SELECT * FROM items WHERE id = ?', id);
    return row ? fromRow(row) : null;
  },
  async upsert(item) {
    await (await db()).runAsync(
      `INSERT INTO items (id, name, store, purchase_date, warranty_months, end_date, price, notes,
         receipt_uri, reminders_enabled, notification_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, store = excluded.store, purchase_date = excluded.purchase_date,
         warranty_months = excluded.warranty_months, end_date = excluded.end_date, price = excluded.price,
         notes = excluded.notes, receipt_uri = excluded.receipt_uri,
         reminders_enabled = excluded.reminders_enabled, notification_ids = excluded.notification_ids,
         updated_at = excluded.updated_at`,
      item.id,
      item.name,
      item.store,
      item.purchaseDate,
      item.warrantyMonths,
      item.endDate,
      item.price,
      item.notes,
      item.receiptUri,
      item.remindersEnabled ? 1 : 0,
      JSON.stringify(item.notificationIds),
      item.createdAt,
      item.updatedAt,
    );
  },
  async remove(id) {
    await (await db()).runAsync('DELETE FROM items WHERE id = ?', id);
  },
};
