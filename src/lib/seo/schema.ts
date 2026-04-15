/**
 * JSON-LD schema builders. Pure, synchronous, translation-free — all strings
 * that depend on locale must be derived by the caller and passed in. This
 * lets schema.ts be imported from both RSC pages and `route.ts` handlers
 * without pulling in next-intl.
 *
 * Field visibility rule: every field emitted here MUST correspond to something
 * visible on the rendered page. Google treats hidden-but-schema'd content as
 * spam. See §2.3 of the GEO plan for the visibility contract.
 *
 * schema-dts is not installed; we hand-roll a minimal `WithContext<T>` alias
 * and narrow types for the handful of schemas we emit.
 */

// ---------- Minimal JSON-LD types ----------

type Context = "https://schema.org";

export type WithContext<T> = T & { "@context": Context };

type Thing = {
  "@type": string;
};

export type OrganizationSchema = Thing & {
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
};

export type PersonSchema = Thing & {
  "@type": "Person";
  name: string;
};

/**
 * Public organization profile schema. Distinct from the site-wide
 * `OrganizationSchema` (which represents OpenClienting as the publisher) —
 * this one describes a third-party organization that has content attributed
 * to them on the site.
 *
 * Every field here corresponds to something visible on the profile page:
 *   - `name`          — rendered in the profile hero `<h1>`
 *   - `url`           — canonical link to the profile
 *   - `description`   — the org's about text as rendered in the hero
 *   - `logo`          — the logo image shown in the hero (absolute URL)
 *   - `sameAs`        — the org's declared website (shown as a link)
 *   - `numberOfEmployees` — the employee count badge (tier + count), when set
 *
 * Verification is modelled via the schema.org `identifier` PropertyValue —
 * not a full Google "trust" property since schema.org has no standard for
 * community-verified status. The site-specific label ("Verified by
 * OpenClienting") is placed in `propertyID` so validators accept the field.
 */
export type OrgProfileSchema = Thing & {
  "@type": "Organization";
  name: string;
  url: string;
  description?: string;
  logo?: string;
  sameAs?: string[];
  numberOfEmployees?: {
    "@type": "QuantitativeValue";
    value: number;
  };
  identifier?: {
    "@type": "PropertyValue";
    propertyID: string;
    value: string;
  };
};

export type WebSiteSchema = Thing & {
  "@type": "WebSite";
  name: string;
  url: string;
  inLanguage: string;
  description?: string;
  publisher?: OrganizationSchema;
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
};

export type BreadcrumbItem = { name: string; url: string };

export type BreadcrumbListSchema = Thing & {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

export type ItemListElement = {
  "@type": "ListItem";
  position: number;
  url: string;
  name: string;
};

export type ItemListSchema = Thing & {
  "@type": "ItemList";
  itemListElement: ItemListElement[];
  numberOfItems: number;
};

export type CollectionPageSchema = Thing & {
  "@type": "CollectionPage";
  name: string;
  description?: string;
  url: string;
  inLanguage: string;
  mainEntity: ItemListSchema;
};

export type ArticleSchema = Thing & {
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  mainEntityOfPage: string;
  datePublished: string;
  dateModified?: string;
  inLanguage: string;
  author: PersonSchema;
  publisher: OrganizationSchema;
  keywords?: string;
  about?: OrganizationSchema;
};

// ---------- Inputs ----------

export interface SchemaSiteContext {
  siteUrl: string; // absolute, no trailing slash, e.g. "https://openclienting.org"
  siteName: string;
  description: string;
  logoUrl: string; // absolute
}

export interface ProblemArticleInput {
  id: string;
  title: string;
  description: string; // already derived via firstSentence()
  createdAt: string;
  updatedAt: string | null;
  locale: string;
  canonicalUrl: string; // absolute
  keywords: string[]; // tag labels, already localized
  authorName: string; // already anonymity-gated: "Anonymous" or real display_name
  orgName: string | null; // already anonymity-gated; null means hidden
}

export interface ProblemCollectionItem {
  id: string;
  title: string;
  url: string; // absolute
}

// ---------- Builders ----------

export function organizationSchema(
  site: SchemaSiteContext,
): WithContext<OrganizationSchema> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.siteName,
    url: site.siteUrl,
    logo: site.logoUrl,
  };
}

export function websiteSchema(
  site: SchemaSiteContext,
  locale: string,
  inLanguageTag: string,
): WithContext<WebSiteSchema> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.siteName,
    url: `${site.siteUrl}/${locale}`,
    inLanguage: inLanguageTag,
    description: site.description,
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      url: site.siteUrl,
      logo: site.logoUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.siteUrl}/${locale}/problems?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbListSchema(
  items: BreadcrumbItem[],
): WithContext<BreadcrumbListSchema> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function problemsCollectionSchema(params: {
  inLanguageTag: string;
  pageName: string;
  pageDescription: string;
  pageUrl: string; // absolute
  items: ProblemCollectionItem[];
}): WithContext<CollectionPageSchema> {
  const { inLanguageTag, pageName, pageDescription, pageUrl, items } = params;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    inLanguage: inLanguageTag,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: item.url,
        name: item.title,
      })),
    },
  };
}

export function problemArticleSchema(
  site: SchemaSiteContext,
  input: ProblemArticleInput,
  inLanguageTag: string,
): WithContext<ArticleSchema> {
  const schema: WithContext<ArticleSchema> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    // `url` and `mainEntityOfPage` carry the same canonical URL. Some
    // validators specifically check for `url` on Article, and having both
    // matches what Google's docs example shows — no cost, no drift.
    url: input.canonicalUrl,
    mainEntityOfPage: input.canonicalUrl,
    datePublished: input.createdAt,
    inLanguage: inLanguageTag,
    author: { "@type": "Person", name: input.authorName },
    publisher: {
      "@type": "Organization",
      name: site.siteName,
      url: site.siteUrl,
      logo: site.logoUrl,
    },
  };
  if (input.updatedAt && input.updatedAt !== input.createdAt) {
    schema.dateModified = input.updatedAt;
  }
  if (input.keywords.length > 0) {
    schema.keywords = input.keywords.join(", ");
  }
  // `about` is only emitted when org name is visible on the page (null means
  // anonymity-gated and hidden). This keeps the "visible on page" rule honest.
  if (input.orgName) {
    schema.about = {
      "@type": "Organization",
      name: input.orgName,
      url: site.siteUrl,
    };
  }
  return schema;
}

// ---------- Organization profile builders ----------

export interface OrganizationProfileInput {
  name: string;
  profileUrl: string; // absolute canonical URL of the profile page
  description: string | null;
  website: string | null;
  logoUrl: string | null; // already absolute if set
  employeeCount: number | null;
  verificationLabel: string | null; // e.g. "Verified by OpenClienting"; null if not verified
}

/**
 * Build a schema.org Organization payload for a public org profile page.
 *
 * Visibility contract: only fields that correspond to something rendered on
 * the profile hero are emitted. `numberOfEmployees` is set only when the
 * employee count badge renders; `sameAs` is set only when the website link
 * is rendered; `logo` only when the logo image shows in the hero.
 */
export function organizationProfileSchema(
  input: OrganizationProfileInput,
): WithContext<OrgProfileSchema> {
  const schema: WithContext<OrgProfileSchema> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.profileUrl,
  };
  if (input.description && input.description.trim().length > 0) {
    schema.description = input.description.trim();
  }
  if (input.logoUrl) {
    schema.logo = input.logoUrl;
  }
  if (input.website && input.website.trim().length > 0) {
    schema.sameAs = [input.website.trim()];
  }
  if (input.employeeCount != null && input.employeeCount > 0) {
    schema.numberOfEmployees = {
      "@type": "QuantitativeValue",
      value: input.employeeCount,
    };
  }
  if (input.verificationLabel) {
    schema.identifier = {
      "@type": "PropertyValue",
      propertyID: input.verificationLabel,
      value: "verified",
    };
  }
  return schema;
}

export interface OrganizationCollectionItem {
  name: string;
  url: string; // absolute
}

/**
 * Directory CollectionPage + ItemList pointing at every verified org. Same
 * shape as `problemsCollectionSchema` but the list carries org names instead
 * of problem titles. Kept as a thin wrapper so the directory page matches
 * the problem list page's discoverability pattern for answer engines.
 */
export function organizationsCollectionSchema(params: {
  inLanguageTag: string;
  pageName: string;
  pageDescription: string;
  pageUrl: string; // absolute
  items: OrganizationCollectionItem[];
}): WithContext<CollectionPageSchema> {
  const { inLanguageTag, pageName, pageDescription, pageUrl, items } = params;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageName,
    description: pageDescription,
    url: pageUrl,
    inLanguage: inLanguageTag,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: item.url,
        name: item.name,
      })),
    },
  };
}
