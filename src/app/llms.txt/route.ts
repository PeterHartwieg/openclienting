import { getAllPublishedArticles } from "@/lib/queries/knowledge-articles";
import { getSiteUrl } from "@/lib/site";

/**
 * Dynamic llms.txt generator.
 *
 * Previously this was a static file in `public/llms.txt` that hardcoded
 * the 6 venture-clienting spoke slugs. Now that the knowledge cluster
 * lives in the `knowledge_articles` table and new articles can be added
 * without a code deploy, the spoke list has to be generated at request
 * time from the DB. The intro prose is kept verbatim so existing answer
 * engines that have snapshotted the file see the same content.
 *
 * We list every published spoke at its row-native locale (EN rows emit
 * EN URLs, DE rows emit DE URLs). No cross-locale fan-out — the hub
 * page already advertises `hreflang` alternates for language switching.
 */
export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const articles = await getAllPublishedArticles();

  const spokeLines: string[] = [];
  for (const article of articles) {
    if (article.kind !== "spoke") continue;
    const localeName = article.locale === "de" ? "German" : "English";
    spokeLines.push(
      `- [${article.title} (Markdown, ${localeName})](${siteUrl}/${article.locale}/venture-clienting/${article.slug}/md)`,
    );
  }

  // The hub is universal and always has an EN + DE markdown alt. Emit
  // those first so the explainer is at the top of the spoke block,
  // regardless of how many spokes exist.
  const hubLines = [
    `- [Venture clienting explainer (Markdown, English)](${siteUrl}/en/venture-clienting/md)`,
    `- [Venture clienting explainer (Markdown, German)](${siteUrl}/de/venture-clienting/md)`,
  ];

  const body = `# OpenClienting

> Open-source venture clienting knowledge base where SMEs and startups share real problem templates, pilot frameworks, and verified outcomes.

OpenClienting is a peer-validated library of the problems companies are actively sourcing solutions for, the requirements those solutions must meet, the pilot frameworks used to evaluate them, and the success reports from pilots that worked. Venture clienting is the model where an established company becomes a paying client of a startup whose solution already works — no equity, no accelerator, just a normal vendor engagement around a specific problem.

Every contribution is moderated before publication, authored attributions are optional (anonymity per submission), and successful pilots are flagged with verification metadata that is visible to anyone.

## About

- [What is venture clienting?](${siteUrl}/en/venture-clienting)
- [Browse all problems](${siteUrl}/en/problems)
- [Browse verified organizations](${siteUrl}/en/organizations)
- [Submit a problem](${siteUrl}/en/submit)

## Markdown versions

Per-problem, per-org, and per-page Markdown alternatives are exposed at a
\`/md\` suffix on each page path. They are intended for answer engines and
LLM crawlers and carry the same per-row anonymity gating as the HTML pages.

${hubLines.join("\n")}
${spokeLines.join("\n")}
- Individual problem detail pages are available as Markdown by appending
  \`/md\` to any problem URL, e.g.
  \`${siteUrl}/en/problems/{id}/md\`. Each HTML problem page
  advertises its Markdown alternative via
  \`<link rel="alternate" type="text/markdown">\`.
- Verified organization profiles are available as Markdown at
  \`${siteUrl}/en/organizations/{slug}/md\` (and \`/de/...\`).
  Each HTML profile page advertises its Markdown alternative via
  \`<link rel="alternate" type="text/markdown">\`.

## Languages

- English: ${siteUrl}/en
- German: ${siteUrl}/de

## Discovery

- Sitemap (all indexable URLs): ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt

## Legal

- [Privacy](${siteUrl}/en/privacy)
- [Terms](${siteUrl}/en/terms)
- [Impressum](${siteUrl}/en/impressum)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
