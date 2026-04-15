/**
 * Shared Markdown builder for venture-clienting spoke pages.
 *
 * Each spoke exposes a `/md` alternate at
 * `/[locale]/venture-clienting/[slug]/md`. All six spokes use the same
 * section layout (TL;DR → detail → FAQ → related), so instead of writing
 * six near-identical route handlers, each spoke's `md/route.ts` just calls
 * `buildSpokeMarkdown()` with its i18n namespace resolved.
 *
 * Reuses `ventureClientingToMarkdown()` from `src/lib/seo/markdown.ts` —
 * that builder's `labels.sections` array is unbounded, so a spoke's three
 * content sections map 1:1.
 */

import { ventureClientingToMarkdown } from "@/lib/seo/markdown";
import {
  DETAIL_BULLET_COUNT,
  FAQ_COUNT,
  TLDR_COUNT,
  type SpokeConfig,
} from "./config";

/**
 * Minimal view of `getTranslations()` we need. Typed as a callable that
 * takes a string key and returns a string — compatible with `next-intl`'s
 * `getTranslations` return value.
 */
type Translator = (key: string) => string;

export interface BuildSpokeMarkdownOptions {
  spoke: SpokeConfig;
  canonicalUrl: string;
  updatedAt: string; // ISO
  /** Translator scoped to the spoke's i18n namespace (already narrowed). */
  tSpoke: Translator;
  /** Translator scoped to `problemDetail.markdown` (source/canonical/license). */
  tMd: Translator;
  licenseName: string; // CC BY-SA 4.0
}

export function buildSpokeMarkdown(opts: BuildSpokeMarkdownOptions): string {
  const { canonicalUrl, updatedAt, tSpoke, tMd, licenseName } = opts;

  const tldrBullets = Array.from({ length: TLDR_COUNT }, (_, i) =>
    `- ${tSpoke(`tldr${i + 1}`)}`,
  ).join("\n");

  const detailBullets = Array.from({ length: DETAIL_BULLET_COUNT }, (_, i) =>
    `- ${tSpoke(`detailBullet${i + 1}`)}`,
  ).join("\n");

  const detailBody = `${tSpoke("detailIntro")}\n\n${detailBullets}`;

  const faqBody = Array.from({ length: FAQ_COUNT }, (_, i) => {
    const q = tSpoke(`faq${i + 1}Q`);
    const a = tSpoke(`faq${i + 1}A`);
    return `**Q: ${q}**\n\n${a}`;
  }).join("\n\n");

  return ventureClientingToMarkdown({
    canonicalUrl,
    licenseName,
    updatedAt,
    labels: {
      title: tSpoke("title"),
      lede: tSpoke("lede"),
      sections: [
        { title: tSpoke("tldrTitle"), body: tldrBullets },
        { title: tSpoke("detailTitle"), body: detailBody },
        { title: tSpoke("faqTitle"), body: faqBody },
      ],
      source: tMd("source"),
      canonical: tMd("canonical"),
      license: tMd("licenseLabel"),
    },
  });
}
