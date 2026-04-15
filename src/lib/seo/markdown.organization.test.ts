/**
 * Tests for `organizationToMarkdown`.
 *
 * Unlike the problem Markdown builder, the org profile builder does NOT
 * apply anonymity gating — it trusts the query layer to only pass rows
 * where `is_org_anonymous = false`. The tests here focus on:
 *
 *   1. Frontmatter shape (canonical, slug, website, employees, verified).
 *   2. Empty-state rendering when the org has no problems / approaches /
 *      verified reports attributed to it.
 *   3. Link generation (every problem/approach/report links back to the
 *      canonical problem page so the content stays crawlable).
 *   4. Field omission: missing website / employeeCount / description lines
 *      should simply not render, not emit placeholder rows.
 *
 * Run with Node's built-in test runner:
 *   node --test --experimental-strip-types src/lib/seo/markdown.organization.test.ts
 */

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  organizationToMarkdown,
  type OrganizationMarkdownLabels,
  type OrganizationMarkdownOptions,
  type OrganizationProfileForMarkdown,
  type OrgMdProblem,
  type OrgMdSolutionApproach,
  type OrgMdSuccessReport,
} from "./markdown.ts";

const LABELS: OrganizationMarkdownLabels = {
  website: "Website",
  employees: "Employees",
  verified: "Verified",
  problems: "Problems authored",
  problemsEmpty: "No problems authored yet.",
  solutionApproaches: "Solution approaches offered",
  solutionApproachesEmpty: "No solution approaches offered yet.",
  verifiedOutcomes: "Verified pilot outcomes as client",
  verifiedOutcomesEmpty: "No verified pilot outcomes as client yet.",
  source: "Source",
  canonical: "Canonical",
  license: "License",
  about: "About",
  inProblem: "in problem:",
};

const BASE_ORG: OrganizationProfileForMarkdown = {
  name: "Acme Corp",
  slug: "acme-corp",
  description: "A manufacturer of precision widgets.",
  website: "https://acme.example",
  employeeCount: 42,
  verificationStatus: "verified",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-03-01T00:00:00.000Z",
};

function makeOpts(
  overrides: Partial<OrganizationMarkdownOptions> = {},
): OrganizationMarkdownOptions {
  return {
    canonicalUrl: "https://openclienting.org/en/organizations/acme-corp",
    labels: LABELS,
    licenseName: "CC BY-SA 4.0",
    problems: [],
    solutionApproaches: [],
    verifiedSuccessReports: [],
    siteUrl: "https://openclienting.org",
    locale: "en",
    ...overrides,
  };
}

describe("organizationToMarkdown — frontmatter", () => {
  it("emits canonical, slug, website, employees, verified, created, updated", () => {
    const md = organizationToMarkdown(BASE_ORG, makeOpts());
    assert.match(md, /^---\n/);
    assert.match(
      md,
      /canonical: https:\/\/openclienting\.org\/en\/organizations\/acme-corp/,
    );
    assert.match(md, /slug: acme-corp/);
    assert.match(md, /website: "https:\/\/acme\.example"/);
    assert.match(md, /employees: 42/);
    assert.match(md, /verified: true/);
    assert.match(md, /created: 2025-01-01T00:00:00\.000Z/);
    assert.match(md, /updated: 2025-03-01T00:00:00\.000Z/);
  });

  it("omits updated when null", () => {
    const md = organizationToMarkdown(
      { ...BASE_ORG, updatedAt: null },
      makeOpts(),
    );
    assert.ok(!md.includes("updated:"));
  });

  it("omits website/employees when null", () => {
    const md = organizationToMarkdown(
      { ...BASE_ORG, website: null, employeeCount: null },
      makeOpts(),
    );
    assert.ok(!md.includes("website:"));
    assert.ok(!md.includes("employees:"));
    // The hero metadata list should also not carry the missing labels.
    assert.ok(!md.includes("**Website:**"));
    assert.ok(!md.includes("**Employees:**"));
  });
});

describe("organizationToMarkdown — empty states", () => {
  it("all three sections render empty-state labels when nothing is attributed", () => {
    const md = organizationToMarkdown(BASE_ORG, makeOpts());
    assert.match(md, /## Problems authored\n\nNo problems authored yet\./);
    assert.match(
      md,
      /## Solution approaches offered\n\nNo solution approaches offered yet\./,
    );
    assert.match(
      md,
      /## Verified pilot outcomes as client\n\nNo verified pilot outcomes as client yet\./,
    );
  });

  it("omits about section when description is null or blank", () => {
    const mdNull = organizationToMarkdown(
      { ...BASE_ORG, description: null },
      makeOpts(),
    );
    assert.ok(!mdNull.includes("## About"));
    const mdBlank = organizationToMarkdown(
      { ...BASE_ORG, description: "   " },
      makeOpts(),
    );
    assert.ok(!mdBlank.includes("## About"));
  });
});

describe("organizationToMarkdown — populated sections", () => {
  const problems: OrgMdProblem[] = [
    {
      id: "prob-1",
      title: "Edge-grade defect detection",
      description: "Fast, private defect detection on the line.",
      solution_status: "has_approaches",
    },
    {
      id: "prob-2",
      title: "Automated pallet counting",
      description: "Accurate pallet counts without handheld scanners.",
      solution_status: "unsolved",
    },
  ];
  const approaches: OrgMdSolutionApproach[] = [
    {
      id: "sa-1",
      title: "Edge vision quality model",
      description: "A small CNN running on edge hardware.",
      technology_type: "software",
      maturity: "established",
      problem_id: "prob-1",
      problem_title: "Edge-grade defect detection",
    },
  ];
  const reports: OrgMdSuccessReport[] = [
    {
      id: "sr-1",
      report_summary: "Reduced defect escape rate by 34%.",
      solution_approach_title: "Edge vision quality model",
      problem_id: "prob-1",
      problem_title: "Edge-grade defect detection",
    },
  ];

  it("links every problem, approach, and report back to its canonical problem URL", () => {
    const md = organizationToMarkdown(
      BASE_ORG,
      makeOpts({
        problems,
        solutionApproaches: approaches,
        verifiedSuccessReports: reports,
      }),
    );
    assert.match(
      md,
      /\[Edge-grade defect detection\]\(https:\/\/openclienting\.org\/en\/problems\/prob-1\)/,
    );
    assert.match(
      md,
      /\[Automated pallet counting\]\(https:\/\/openclienting\.org\/en\/problems\/prob-2\)/,
    );
    // Approach row carries BOTH the approach title AND a link to its parent problem.
    assert.match(md, /\*\*Edge vision quality model\*\*/);
    assert.match(
      md,
      /in problem: \[Edge-grade defect detection\]\(https:\/\/openclienting\.org\/en\/problems\/prob-1\)/,
    );
    // Report row: quoted summary + parent problem link.
    assert.match(md, /\u201CReduced defect escape rate by 34%\.\u201D/);
    assert.match(
      md,
      /in problem: \[Edge-grade defect detection\]\(https:\/\/openclienting\.org\/en\/problems\/prob-1\)/,
    );
  });

  it("does not emit empty-state label when its section has rows", () => {
    const md = organizationToMarkdown(
      BASE_ORG,
      makeOpts({ problems, solutionApproaches: [], verifiedSuccessReports: [] }),
    );
    assert.ok(!md.includes("No problems authored yet."));
    assert.match(md, /No solution approaches offered yet\./);
    assert.match(md, /No verified pilot outcomes as client yet\./);
  });

  it("uses the passed-in locale in link URLs (de)", () => {
    const md = organizationToMarkdown(
      BASE_ORG,
      makeOpts({ problems, locale: "de" }),
    );
    assert.match(
      md,
      /\(https:\/\/openclienting\.org\/de\/problems\/prob-1\)/,
    );
  });
});

describe("organizationToMarkdown — source block", () => {
  it("emits canonical URL and license", () => {
    const md = organizationToMarkdown(BASE_ORG, makeOpts());
    assert.match(md, /## Source\n/);
    assert.match(
      md,
      /- \*\*Canonical:\*\* https:\/\/openclienting\.org\/en\/organizations\/acme-corp/,
    );
    assert.match(md, /- \*\*License:\*\* CC BY-SA 4\.0/);
  });
});
