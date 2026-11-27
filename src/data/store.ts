import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { repository } from './repository';
import type { Item } from './types';

/** Tiny change counter so every screen reloads after a save or delete. */
let version = 0;
const listeners = new Set<() => void>();

export function notifyChanged() {
  version += 1;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function useVersion() {
  return useSyncExternalStore(subscribe, () => version, () => version);
}

export function useItems(): { items: Item[]; loading: boolean } {
  const v = useVersion();
  const [state, setState] = useState<{ items: Item[]; loading: boolean }>({ items: [], loading: true });
  useEffect(() => {
    let alive = true;
    repository.list().then((items) => alive && setState({ items, loading: false }));
    return () => {
      alive = false;
    };
  }, [v]);
  return state;
}

export function useItem(id: string | undefined): { item: Item | null; loading: boolean } {
  const v = useVersion();
  const [state, setState] = useState<{ item: Item | null; loading: boolean }>({ item: null, loading: true });
  const load = useCallback(async () => (id ? repository.get(id) : null), [id]);
  useEffect(() => {
    let alive = true;
    load().then((item) => alive && setState({ item, loading: false }));
    return () => {
      alive = false;
    };
  }, [load, v]);
  return state;
}
