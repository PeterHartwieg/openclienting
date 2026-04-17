"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "oc:recent-nav:v1";
const MAX_ENTRIES = 10;

export interface RecentNavEntry {
  href: string;
  label: string;
  visitedAt: number;
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
export function useRecentNav(): RecentNavEntry[] {
  const [entries, setEntries] = useState<RecentNavEntry[]>([]);

  useEffect(() => {
    setEntries(readStorage());
  }, []);

  return entries;
}
