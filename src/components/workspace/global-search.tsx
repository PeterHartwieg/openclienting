"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackIaEvent } from "@/lib/analytics/ia-events";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  rank: number;
}

interface GlobalSearchProps {
  locale: string;
}

export function GlobalSearch({ locale }: GlobalSearchProps) {
  const t = useTranslations("globalSearch");
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.rpc("search_problems", {
        q: q.trim(),
        lim: 8,
      });
      const rows = (data as SearchResult[] | null) ?? [];
      setResults(rows);
      setOpen(rows.length > 0);
      setActiveIndex(-1);
    },
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 200);
  };

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const navigate = (result: SearchResult) => {
    trackIaEvent({
      name: "ia_nav_click",
      section: "problems",
      surface: "search",
      shell: "workspace",
    });
    router.push(`/${locale}/problems/${result.id}`);
    close();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) navigate(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Screen-reader live region for result count */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {open
          ? t("resultCount", { count: results.length })
          : null}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-label={t("placeholder")}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("resultsLabel")}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {results.map((result, i) => (
            <li
              key={result.id}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => navigate(result)}
              className={`cursor-pointer px-3 py-2.5 ${
                i === activeIndex ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <p className="truncate text-sm font-medium">{result.title}</p>
              {result.snippet && (
                <p
                  className="mt-0.5 line-clamp-1 text-xs text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground"
                  // ts_headline wraps matches in <b> tags. The output is
                  // generated entirely by Postgres from indexed content —
                  // not from raw user input — so it is safe to render.
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
