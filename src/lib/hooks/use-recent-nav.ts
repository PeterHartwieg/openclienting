"use client";

import { useSyncExternalStore } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "oc:recent-nav:v1";
const MAX_ENTRIES = 10;
const CUSTOM_EVENT = "oc:recent-nav:update";

export interface RecentNavEntry {
  href: string;
  label: string;
  visitedAt: number;
}

// Frozen empty array — stable reference so useSyncExternalStore never sees
// a new array reference when there are no entries.
const EMPTY: ReadonlyArray<RecentNavEntry> = Object.freeze([]);

// Module-level cache: re-parse only when the raw localStorage string changes.
let cachedRaw: string | null = null;
let cachedEntries: ReadonlyArray<RecentNavEntry> = EMPTY;

function getSnapshot(): ReadonlyArray<RecentNavEntry> {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  if (!raw) {
    cachedEntries = EMPTY;
    return EMPTY;
  }
  try {
    cachedEntries = Object.freeze(JSON.parse(raw) as RecentNavEntry[]);
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

function getServerSnapshot(): ReadonlyArray<RecentNavEntry> {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  // Cross-tab updates via the native "storage" event.
  window.addEventListener("storage", onChange);
  // Same-tab updates dispatched by useRecentNavTracker.
  window.addEventListener(CUSTOM_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CUSTOM_EVENT, onChange);
  };
}

function readStorage(): RecentNavEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentNavEntry[];
  } catch {
    return [];
  }
}

function writeStorage(entries: RecentNavEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    // Dispatch a custom event so same-tab subscribers (useSyncExternalStore)
    // are notified. The native "storage" event only fires in *other* tabs.
    window.dispatchEvent(new Event(CUSTOM_EVENT));
  } catch {
    // localStorage unavailable (private mode quota etc.) — silently skip
  }
}

/**
 * Mounts once in a workspace client component and records pathname changes
 * to localStorage. `deriveLabel` maps a pathname to a human-readable label;
 * returning null skips recording that route.
 */
export function useRecentNavTracker(
  deriveLabel: (pathname: string) => string | null,
): void {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const label = deriveLabel(pathname);
    if (!label) return;

    const existing = readStorage();
    // De-dupe by href, newest first, cap at MAX_ENTRIES
    const deduped = existing.filter((e) => e.href !== pathname);
    const updated: RecentNavEntry[] = [
      { href: pathname, label, visitedAt: Date.now() },
      ...deduped,
    ].slice(0, MAX_ENTRIES);

    writeStorage(updated);
  }, [pathname, deriveLabel]);
}

/**
 * Reads recent nav entries from localStorage. Safe during SSR (returns []).
 */
export function useRecentNav(): ReadonlyArray<RecentNavEntry> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
