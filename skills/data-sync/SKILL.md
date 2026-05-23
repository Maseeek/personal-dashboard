---
name: Local Storage and Supabase Sync
description: Guides the implementation of data fetching hooks that fallback gracefully to Local Storage, avoid Next.js SSR hydration mismatches, and synchronize with Supabase.
---

# Skill: Local Storage and Supabase Sync

Use this skill when writing custom hooks, data fetching logic, or synchronization utilities to bind components to state.

## 1. Next.js SSR Safe Local Storage Hook

Since Next.js pre-renders HTML on the server, reading `window.localStorage` directly during render will throw errors or cause hydration mismatches. Always use a state hook that initializes with default values and reads from local storage after mounting:

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  // Load from local storage after client-side mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading localStorage key:', key, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error setting localStorage key:', key, error);
    }
  };

  return [storedValue, setValue];
}
```

## 2. Syncing with Supabase (Offline First)

Implement a sync utility that reads and writes local storage immediately (optimistic UI updates) and queue synchronization to the Supabase database in the background.

### Sync Pattern
1. **Initial Mount**: Load local storage immediately.
2. **Fetch Remote**: Send async query to Supabase.
3. **Compare**:
   - If Supabase query fails, continue running off Local Storage. Highlight a "Local Only" status indicator in the UI.
   - If Supabase query succeeds, compare `updated_at` timestamps. If remote timestamp is newer, update Local Storage and UI state.
   - If local changes have not been synced, push them to Supabase.

### Simple Hook Template
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient'; // Conditional client config

export function useSyncedData<T extends { updated_at: string }>(
  key: string,
  initialValue: T[]
) {
  const [data, setData] = useState<T[]>(initialValue);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'local'>('local');

  // Load local state first
  useEffect(() => {
    const local = localStorage.getItem(key);
    if (local) {
      setData(JSON.parse(local));
    }
  }, [key]);

  const syncWithCloud = async () => {
    if (!supabase) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('syncing');
    try {
      // 1. Fetch from Supabase
      const { data: dbData, error } = await supabase
        .from(key)
        .select('*');

      if (error) throw error;

      // 2. Simple sync resolution: take newer values
      // (or simple override if database is the source of truth)
      if (dbData) {
        setData(dbData);
        localStorage.setItem(key, JSON.stringify(dbData));
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error('Failed to sync with Supabase, using local cache:', e);
      setSyncStatus('local');
    }
  };

  const updateData = async (newData: T[]) => {
    setData(newData);
    localStorage.setItem(key, JSON.stringify(newData));

    if (!supabase) return;

    try {
      // Perform optimistic remote updates / upserts
      const { error } = await supabase
        .from(key)
        .upsert(newData);

      if (error) throw error;
      setSyncStatus('synced');
    } catch (e) {
      console.error('Remote save failed. Data remains cached locally:', e);
      setSyncStatus('local');
    }
  };

  return { data, updateData, syncStatus, syncWithCloud };
}
```

## 3. Visual Sync Status Indicators

Every card that syncs data (Finances, Goals/Todo) should include a subtle status label:
- 🟢 `Synced` (Saved to cloud)
- 🟡 `Syncing...` (Uploading/Downloading)
- ⚪ `Saved Locally` (Offline fallback or Supabase not connected yet)
