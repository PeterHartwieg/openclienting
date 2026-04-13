"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function SearchBar({ locale, initialQuery }: { locale: string; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/${locale}/problems${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <Input
        type="search"
        placeholder="Search problems..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full"
        aria-label="Search problems"
      />
    </form>
  );
}
