"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { BrandBracket } from "@/components/brand/brand-mark";

export function SearchBar({ locale, initialQuery }: { locale: string; initialQuery?: string }) {
  const router = useRouter();
  const t = useTranslations("common");
  const [query, setQuery] = useState(initialQuery ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/${locale}/problems${params}`);
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
