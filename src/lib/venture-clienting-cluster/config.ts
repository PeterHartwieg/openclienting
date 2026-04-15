/**
 * Venture-clienting knowledge cluster — shared config.
 *
 * Six spoke pages branch off the `/[locale]/venture-clienting` hub, each
 * targeting a specific answer-engine query. This file is the single source
 * of truth for: the spoke slug, the i18n key under `ventureClientingCluster`
 * that holds its prose, the breadcrumb label key, and the two sibling
 * spokes it cross-links to from its CTA row.
 *
 * Adding a new spoke: append an entry here, add the corresponding
 * `ventureClientingCluster.<i18nKey>.*` namespace to `messages/en.json`
 * (and mirror into `messages/de.json`), add the `breadcrumbs.<breadcrumbKey>`
 * label, and create the two route files
 * `src/app/[locale]/venture-clienting/<slug>/page.tsx` + `/md/route.ts`.
 */

export type SpokeId =
  | "whatIsVentureClienting"
  | "ventureClientingVsCvc"
  | "startupPilotFramework"
  | "problemTemplate"
  | "smeOpenInnovation"
  | "verifiedSuccessReport";

export interface SpokeConfig {
  /** URL segment under `/[locale]/venture-clienting/`. */
  slug: string;
  /** Key under `ventureClientingCluster` in messages/*.json. */
  i18nKey: SpokeId;
  /** Key under `breadcrumbs` for the last-segment label. */
  breadcrumbKey: string;
  /** Two sibling spoke ids this page cross-links to in its CTA row. */
  siblings: readonly [SpokeId, SpokeId];
}

/**
 * Ordered list — the same order spokes appear in llms.txt / sitemap append.
 * Sibling pairings give every spoke exactly two outbound links to sibling
 * spokes so the cluster forms a connected internal link graph (every spoke
 * is reachable in ≤2 clicks from any other).
 */
export const SPOKES: readonly SpokeConfig[] = [
  {
    slug: "what-is-venture-clienting",
    i18nKey: "whatIsVentureClienting",
    breadcrumbKey: "vcWhatIs",
    siblings: ["ventureClientingVsCvc", "startupPilotFramework"],
  },
  {
    slug: "venture-clienting-vs-corporate-venture-capital",
    i18nKey: "ventureClientingVsCvc",
    breadcrumbKey: "vcVsCvc",
    siblings: ["whatIsVentureClienting", "smeOpenInnovation"],
  },
  {
    slug: "startup-pilot-framework",
    i18nKey: "startupPilotFramework",
    breadcrumbKey: "vcPilotFramework",
    siblings: ["problemTemplate", "verifiedSuccessReport"],
  },
  {
    slug: "problem-template",
    i18nKey: "problemTemplate",
    breadcrumbKey: "vcProblemTemplate",
    siblings: ["startupPilotFramework", "smeOpenInnovation"],
  },
  {
    slug: "sme-open-innovation",
    i18nKey: "smeOpenInnovation",
    breadcrumbKey: "vcSme",
    siblings: ["whatIsVentureClienting", "problemTemplate"],
  },
  {
    slug: "verified-success-report",
    i18nKey: "verifiedSuccessReport",
    breadcrumbKey: "vcVerifiedReport",
    siblings: ["startupPilotFramework", "ventureClientingVsCvc"],
  },
];

export function getSpokeById(id: SpokeId): SpokeConfig {
  const hit = SPOKES.find((s) => s.i18nKey === id);
  if (!hit) throw new Error(`Unknown spoke id: ${id}`);
  return hit;
}

export function getSpokeBySlug(slug: string): SpokeConfig | undefined {
  return SPOKES.find((s) => s.slug === slug);
}

/** Number of TL;DR bullets per spoke (flat numbered i18n keys `tldr1..N`). */
export const TLDR_COUNT = 3;
/** Number of detail bullets per spoke (`detailBullet1..N`). */
export const DETAIL_BULLET_COUNT = 4;
/** Number of FAQ items per spoke (`faq1Q/A`..`faqNQ/A`). */
export const FAQ_COUNT = 4;
