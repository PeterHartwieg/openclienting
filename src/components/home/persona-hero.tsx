"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/layout/search-bar";
import { writePersonaCookie, type Persona } from "@/lib/persona";
import { BrandMark } from "@/components/brand/brand-mark";

export function PersonaHero({
  locale,
  initialPersona,
}: {
  locale: string;
  initialPersona: Persona;
}) {
  const t = useTranslations("home");
  const [persona, setPersona] = useState<Persona>(initialPersona);

  function handleSelect(next: Persona) {
    setPersona(next);
    writePersonaCookie(next);
  }

  const title1 = persona === "sme" ? t("heroSmeTitle1") : t("heroStartupTitle1");
  const title2 = persona === "sme" ? t("heroSmeTitle2") : t("heroStartupTitle2");
  const subtitle = persona === "sme" ? t("heroSmeSubtitle") : t("heroStartupSubtitle");
  const ctaPrimary =
    persona === "sme" ? t("heroSmeCtaPrimary") : t("heroStartupCtaPrimary");
  const ctaSecondary =
    persona === "sme" ? t("heroSmeCtaSecondary") : t("heroStartupCtaSecondary");

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Eyebrow — category flag */}
        <Link
          href={`/${locale}/venture-clienting`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          <span>{t("heroEyebrow")}</span>
          <ArrowRight className="h-3 w-3" />
          <span className="sr-only">{t("heroEyebrowCta")}</span>
        </Link>

        {/* Brand mark — reflects active persona side */}
        <div className="mt-6 flex justify-center">
          <BrandMark
            state={persona === "sme" ? "corporate" : "startup"}
            size={56}
            ariaLabel={
              persona === "sme"
                ? t("personaSme")
                : t("personaStartup")
            }
          />
        </div>

        {/* Persona toggle */}
        <div
          role="tablist"
          aria-label={t("personaToggleLabel")}
          className="mx-auto mt-4 inline-flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm"
        >
          <button
            type="button"
            role="tab"
            aria-selected={persona === "sme"}
            aria-controls="persona-hero-copy"
            onClick={() => handleSelect("sme")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              persona === "sme"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("personaSme")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={persona === "startup"}
            aria-controls="persona-hero-copy"
            onClick={() => handleSelect("startup")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              persona === "startup"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("personaStartup")}
          </button>
        </div>

        {/* Hero copy */}
        <div id="persona-hero-copy" role="tabpanel">
          <h1 className="mt-8 text-display font-bold leading-display tracking-tighter">
            {title1}{" "}
            <span
              className={cn(
                "transition-colors duration-200",
                persona === "sme" ? "text-primary" : "text-accent",
              )}
            >
              {title2}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <SearchBar locale={locale} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/problems`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {ctaPrimary}
            </Link>
            <Link
              href={`/${locale}/submit`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
