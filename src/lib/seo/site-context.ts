import { getSiteUrl, siteConfig } from "@/lib/site";
import type { SchemaSiteContext } from "@/lib/seo/schema";

/**
 * Assemble the site context used by every JSON-LD builder. Centralizing this
 * keeps `siteUrl` / `logoUrl` derivation in one place so schema builders stay
 * purely synchronous and accept fully-resolved strings.
 *
 * `/opengraph-image` is used for `logoUrl` because no dedicated logo asset
 * lives in `public/`. The OG image generator at `src/app/opengraph-image.tsx`
 * produces a 1200×630 branded PNG that satisfies Google's minimum logo size
 * (112×112) while accurately reflecting the brand identity shown to users.
 */
export function getSchemaSiteContext(): SchemaSiteContext {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  return {
    siteUrl,
    siteName: siteConfig.name,
    description: siteConfig.description,
    logoUrl: `${siteUrl}/opengraph-image`,
  };
}
