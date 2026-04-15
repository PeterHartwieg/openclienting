import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

// Private / operational routes that must not be indexed by any crawler.
const DISALLOW = [
  "/auth/",
  "/api/",
  "/en/dashboard/",
  "/de/dashboard/",
  "/en/moderate/",
  "/de/moderate/",
];

// Explicit entries for answer-engine crawlers. We grant the same allow-list
// as the generic `*` rule so their access is deliberately permitted rather
// than incidentally so — and each can be flipped independently later without
// touching the generic rule.
//
//  - OAI-SearchBot : ChatGPT Search live crawler
//  - GPTBot        : OpenAI training crawler (distinct from OAI-SearchBot)
//  - ChatGPT-User  : triggered by user actions in ChatGPT, not general crawl
//  - PerplexityBot : Perplexity live answer crawler
//  - Google-Extended : governs whether Google uses the site for Gemini training
//  - ClaudeBot     : Anthropic training crawler
//  - Applebot-Extended : Apple Intelligence training crawler
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Google-Extended",
  "ClaudeBot",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.toString(),
  };
}
