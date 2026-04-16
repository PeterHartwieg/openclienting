"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { BrandBracket } from "@/components/brand/brand-mark";

export function SearchBar({ locale, initialQuery }: { locale: string; initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("common");
  const [query, setQuery] = useState(initialQuery ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Preserve active filters (industry, function, category, solution_status,
    // ...) and just replace the q param. Reset pagination because the result
    // set is changing.
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/${locale}/problems?${qs}` : `/${locale}/problems`);
  }

  // Search is the bridge between corporate problems and startup solutions,
  // so the input sits between a corporate (teal) and startup (amber)
  // bracket. Brackets fade in on focus-within and settle back on blur.
  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="group/search flex items-center gap-1.5">
        <BrandBracket
          side="corporate"
          size={22}
          className="shrink-0 opacity-40 transition-opacity duration-200 group-focus-within/search:opacity-100"
        />
        <Input
          type="search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
          aria-label={t("search")}
        />
        <BrandBracket
          side="startup"
          size={22}
          className="shrink-0 opacity-40 transition-opacity duration-200 group-focus-within/search:opacity-100"
        />
      </div>
    </form>
  );
}
