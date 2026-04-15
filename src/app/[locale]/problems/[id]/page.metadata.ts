import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getProblemById } from "@/lib/queries/problems";
import { getLanguageAlternates } from "@/lib/site";
import { firstSentence } from "@/lib/seo/derive";

export async function generateProblemMetadata(
  locale: string,
  id: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "problemDetail" });

  try {
    const problem = await getProblemById(id);
    const title = problem.title || t("metaTitleFallback");
    // Sentence-boundary truncation so the meta description, visible
    // answer-ready summary, and Article JSON-LD `description` all match.
    const description = firstSentence(problem.description);

    return {
      title,
      description,
      alternates: {
        ...getLanguageAlternates(locale, `/problems/${id}`),
        // Advertise the Markdown alternate so LLM crawlers that follow
        // `<link rel="alternate" type="text/markdown">` can discover it
        // without guessing URL shapes. Not added to the sitemap — search
        // engines should still index the HTML canonical.
        types: {
          "text/markdown": `/${locale}/problems/${id}/md`,
        },
      },
      openGraph: {
        title,
        description,
        type: "article",
        // Next.js doesn't deep-merge openGraph, so the opengraph-image.tsx
        // convention from the root is dropped whenever a child sets its own
        // openGraph block. Re-add it by URL, resolved against metadataBase.
        images: ["/opengraph-image"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/opengraph-image"],
      },
    };
  } catch {
    return {
      title: t("metaTitleFallback"),
      alternates: getLanguageAlternates(locale, `/problems/${id}`),
    };
  }
}
