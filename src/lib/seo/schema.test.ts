/**
 * Tests for the JSON-LD schema builders in `schema.ts`.
 *
 * Scope: `knowledgeArticleSchema` and `faqPageSchema` — both added for the
 * venture-clienting spoke cluster. The older `problemArticleSchema`,
 * `organizationSchema`, etc. are covered implicitly by the pages that
 * consume them; if you add behavior to them, prefer adding coverage here.
 *
 * Run with Node's built-in test runner:
 *   node --test --experimental-strip-types src/lib/seo/schema.test.ts
 */

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  knowledgeArticleSchema,
  faqPageSchema,
  type SchemaSiteContext,
  type KnowledgeArticleInput,
  type FaqItem,
} from "./schema.ts";

const SITE: SchemaSiteContext = {
  siteUrl: "https://openclienting.org",
  siteName: "OpenClienting",
  description: "Open venture clienting knowledge base",
  logoUrl: "https://openclienting.org/icon.svg",
};

const BASE_INPUT: KnowledgeArticleInput = {
  headline: "What is venture clienting?",
  description: "A one-sentence answer for an answer engine.",
  canonicalUrl: "https://openclienting.org/en/venture-clienting/what-is-venture-clienting",
  inLanguage: "en-US",
  dateModified: "2026-04-15T00:00:00.000Z",
};

describe("knowledgeArticleSchema", () => {
  it("sets @context and @type correctly", () => {
    const schema = knowledgeArticleSchema(SITE, BASE_INPUT);
    assert.equal(schema["@context"], "https://schema.org");
    assert.equal(schema["@type"], "Article");
  });

  it("round-trips headline, description, url, inLanguage, dateModified", () => {
    const schema = knowledgeArticleSchema(SITE, BASE_INPUT);
    assert.equal(schema.headline, BASE_INPUT.headline);
    assert.equal(schema.description, BASE_INPUT.description);
    assert.equal(schema.url, BASE_INPUT.canonicalUrl);
    assert.equal(schema.mainEntityOfPage, BASE_INPUT.canonicalUrl);
    assert.equal(schema.inLanguage, BASE_INPUT.inLanguage);
    assert.equal(schema.dateModified, BASE_INPUT.dateModified);
  });

  it("sets both author and publisher to the site organization", () => {
    const schema = knowledgeArticleSchema(SITE, BASE_INPUT);
    assert.equal(schema.author["@type"], "Organization");
    assert.equal(schema.author.name, SITE.siteName);
    assert.equal(schema.author.url, SITE.siteUrl);
    assert.equal(schema.author.logo, SITE.logoUrl);
    assert.equal(schema.publisher["@type"], "Organization");
    assert.equal(schema.publisher.name, SITE.siteName);
    assert.equal(schema.publisher.url, SITE.siteUrl);
  });

  it("omits datePublished by default", () => {
    const schema = knowledgeArticleSchema(SITE, BASE_INPUT);
    assert.equal(schema.datePublished, undefined);
  });

  it("emits datePublished when provided", () => {
    const schema = knowledgeArticleSchema(SITE, {
      ...BASE_INPUT,
      datePublished: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(schema.datePublished, "2026-01-01T00:00:00.000Z");
  });

  it("omits keywords when the list is absent or empty", () => {
    const a = knowledgeArticleSchema(SITE, BASE_INPUT);
    assert.equal(a.keywords, undefined);
    const b = knowledgeArticleSchema(SITE, { ...BASE_INPUT, keywords: [] });
    assert.equal(b.keywords, undefined);
  });

  it("joins keywords with ', ' when present", () => {
    const schema = knowledgeArticleSchema(SITE, {
      ...BASE_INPUT,
      keywords: ["venture clienting", "open innovation", "SME"],
    });
    assert.equal(schema.keywords, "venture clienting, open innovation, SME");
  });

  it("serializes to JSON without throwing (smoke check for <script> use)", () => {
    const schema = knowledgeArticleSchema(SITE, BASE_INPUT);
    const json = JSON.stringify(schema);
    assert.match(json, /"@context":"https:\/\/schema\.org"/);
    assert.match(json, /"@type":"Article"/);
    assert.match(json, /"headline":"What is venture clienting\?"/);
  });
});

describe("faqPageSchema", () => {
  const ITEMS: FaqItem[] = [
    { question: "What is venture clienting?", answer: "A company becomes a paying client of a startup that already has a working solution." },
    { question: "Is it the same as corporate venture capital?", answer: "No — CVC buys equity, venture clienting buys a solution as a normal vendor engagement." },
    { question: "Who is it for?", answer: "Established companies looking to adopt proven startup solutions without taking equity." },
  ];

  it("sets @context and @type correctly", () => {
    const schema = faqPageSchema(ITEMS);
    assert.equal(schema["@context"], "https://schema.org");
    assert.equal(schema["@type"], "FAQPage");
  });

  it("produces one Question per input item in order", () => {
    const schema = faqPageSchema(ITEMS);
    assert.equal(schema.mainEntity.length, 3);
    assert.equal(schema.mainEntity[0]["@type"], "Question");
    assert.equal(schema.mainEntity[0].name, ITEMS[0].question);
    assert.equal(schema.mainEntity[1].name, ITEMS[1].question);
    assert.equal(schema.mainEntity[2].name, ITEMS[2].question);
  });

  it("nests acceptedAnswer with text shape", () => {
    const schema = faqPageSchema(ITEMS);
    const first = schema.mainEntity[0];
    assert.equal(first.acceptedAnswer["@type"], "Answer");
    assert.equal(first.acceptedAnswer.text, ITEMS[0].answer);
  });

  it("handles an empty input array", () => {
    const schema = faqPageSchema([]);
    assert.equal(schema["@type"], "FAQPage");
    assert.deepEqual(schema.mainEntity, []);
  });

  it("serializes to JSON without throwing", () => {
    const schema = faqPageSchema(ITEMS);
    const json = JSON.stringify(schema);
    assert.match(json, /"@type":"FAQPage"/);
    assert.match(json, /"acceptedAnswer"/);
  });
});
