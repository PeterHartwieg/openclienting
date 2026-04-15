/**
 * Tests for `problemToMarkdown` with a focus on per-row anonymity gating.
 *
 * Anonymity is the single biggest correctness hazard in the Markdown
 * alternatives: each nested entity (requirement, pilot_framework,
 * solution_approach, success_report) carries its OWN
 * `is_publicly_anonymous` / `is_org_anonymous` flags — a problem author may
 * be anonymous while a requirement on that same problem is fully named, or
 * vice versa. There is no "parent flag inherits to children" logic.
 *
 * This file exercises all four per-row states —
 *   (public-named, org-named), (public-anon, org-named),
 *   (public-named, org-anon), (public-anon, org-anon)
 * — across all four nested entity types, for 16 assertions. It additionally
 * tests the top-level problem attribution independently so any collapse of
 * parent/child anonymity logic would fail both sets.
 *
 * Run with Node 24+ built-in test runner (stable type stripping):
 *   node --test --experimental-strip-types src/lib/seo/markdown.test.ts
 * (Or via `npm test`.)
 */

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  attribution,
  problemToMarkdown,
  type AttributionLabels,
  type ProblemForMarkdown,
  type ProblemMarkdownLabels,
  type ProblemMarkdownOptions,
  type ProblemPilotFramework,
  type ProblemRequirement,
  type ProblemSolutionApproach,
  type ProblemSuccessReport,
} from "./markdown.ts";

// ---------- Fixtures ----------

const LABELS: ProblemMarkdownLabels = {
  anonymous: "Anonymous",
  unknown: "Unknown",
  author: "Author",
  organization: "Organization",
  description: "Description",
  requirements: "Requirements",
  requirementsEmpty: "No requirements published yet.",
  pilotFrameworks: "Pilot frameworks",
  pilotFrameworksEmpty: "No pilot frameworks published yet.",
  solutionApproaches: "Solution approaches",
  solutionApproachesEmpty: "No solution approaches published yet.",
  verifiedOutcomes: "Verified success reports",
  source: "Source",
  canonical: "Canonical",
  license: "License",
  upvotes: "upvotes",
  technology: "Technology",
  maturity: "Maturity",
  complexity: "Complexity",
  price: "Price",
  scope: "Scope",
  duration: "Duration",
  suggestedKpis: "Suggested KPIs",
  successCriteria: "Success criteria",
  commonPitfalls: "Common pitfalls",
  resourceCommitment: "Resource commitment",
  pilotPeriod: "Pilot period",
  deploymentScope: "Deployment scope",
  kpiSummary: "Key results",
  evidenceNotes: "Evidence",
};

const OPTS: ProblemMarkdownOptions = {
  canonicalUrl: "https://openclienting.org/en/problems/prob-123",
  labels: LABELS,
  licenseName: "CC BY-SA 4.0",
  tags: [{ label: "Manufacturing", slug: "manufacturing" }],
};

const ATTR_LABELS: AttributionLabels = {
  anonymous: LABELS.anonymous,
  unknown: LABELS.unknown,
};

const NAMED_AUTHOR = { display_name: "Alice Author" };
const NAMED_ORG = { id: "org-1", name: "Acme Corp" };

// All four per-row anonymity permutations.
const PERMUTATIONS = [
  { key: "both-named",    is_publicly_anonymous: false, is_org_anonymous: false },
  { key: "public-anon",   is_publicly_anonymous: true,  is_org_anonymous: false },
  { key: "org-anon",      is_publicly_anonymous: false, is_org_anonymous: true  },
  { key: "both-anon",     is_publicly_anonymous: true,  is_org_anonymous: true  },
] as const;

function makeRequirement(overrides: Partial<ProblemRequirement> = {}): ProblemRequirement {
  return {
    id: "req-1",
    body: "The solution must run on edge hardware.",
    upvote_count: 5,
    status: "published",
    is_publicly_anonymous: false,
    is_org_anonymous: false,
    profiles: NAMED_AUTHOR,
    organizations: NAMED_ORG,
    ...overrides,
  };
}

function makePilotFramework(
  overrides: Partial<ProblemPilotFramework> = {},
): ProblemPilotFramework {
  return {
    id: "fw-1",
    scope: "Single factory line",
    suggested_kpis: "Defect rate, cycle time",
    success_criteria: "Defect rate reduced by 20%",
    common_pitfalls: "Hardware procurement delays",
    duration: "8 weeks",
    resource_commitment: "1 engineer, 1 ops lead",
    upvote_count: 3,
    status: "published",
    is_publicly_anonymous: false,
    is_org_anonymous: false,
    profiles: NAMED_AUTHOR,
    organizations: NAMED_ORG,
    ...overrides,
  };
}

function makeSuccessReport(
  overrides: Partial<ProblemSuccessReport> = {},
): ProblemSuccessReport {
  return {
    id: "sr-1",
    report_summary: "Reduced defect escape rate by 34%.",
    pilot_date_range: "2025-Q1",
    deployment_scope: "One assembly line",
    kpi_summary: "Defect rate: -34%",
    evidence_notes: "QA spot check, 200 units",
    verification_status: "verified",
    status: "published",
    is_publicly_anonymous: false,
    is_org_anonymous: false,
    profiles: NAMED_AUTHOR,
    organizations: NAMED_ORG,
    ...overrides,
  };
}

function makeSolutionApproach(
  overrides: Partial<ProblemSolutionApproach> = {},
): ProblemSolutionApproach {
  return {
    id: "sa-1",
    title: "Edge vision quality model",
    description: "A small CNN running on edge hardware.",
    technology_type: "software",
    maturity: "established",
    complexity: "medium",
    price_range: "€€",
    upvote_count: 7,
    status: "published",
    is_publicly_anonymous: false,
    is_org_anonymous: false,
    profiles: NAMED_AUTHOR,
    organizations: NAMED_ORG,
    success_reports: [makeSuccessReport()],
    ...overrides,
  };
}

function makeProblem(
  overrides: Partial<ProblemForMarkdown> = {},
): ProblemForMarkdown {
  return {
    id: "prob-123",
    title: "Edge-grade defect detection",
    description: "Manufacturers need fast, private defect detection on the line.",
    solution_status: "has_approaches",
    created_at: "2025-01-10T10:00:00.000Z",
    updated_at: "2025-03-15T14:00:00.000Z",
    is_publicly_anonymous: false,
    is_org_anonymous: false,
    profiles: NAMED_AUTHOR,
    organizations: NAMED_ORG,
    requirements: [makeRequirement()],
    pilot_frameworks: [makePilotFramework()],
    solution_approaches: [makeSolutionApproach()],
    ...overrides,
  };
}

// ---------- attribution() direct tests ----------

describe("attribution()", () => {
  it("both named -> 'Author · Org'", () => {
    const result = attribution(
      { is_publicly_anonymous: false, is_org_anonymous: false, profiles: NAMED_AUTHOR, organizations: NAMED_ORG },
      ATTR_LABELS,
    );
    assert.equal(result, "Alice Author \u00B7 Acme Corp");
  });

  it("public-anon only -> 'Anonymous · Org' (real name discarded)", () => {
    const result = attribution(
      { is_publicly_anonymous: true, is_org_anonymous: false, profiles: NAMED_AUTHOR, organizations: NAMED_ORG },
      ATTR_LABELS,
    );
    assert.equal(result, "Anonymous \u00B7 Acme Corp");
    assert.ok(!result.includes("Alice"), "real name must not leak");
  });

  it("org-anon only -> 'Author' with org omitted entirely", () => {
    const result = attribution(
      { is_publicly_anonymous: false, is_org_anonymous: true, profiles: NAMED_AUTHOR, organizations: NAMED_ORG },
      ATTR_LABELS,
    );
    assert.equal(result, "Alice Author");
    assert.ok(!result.includes("Acme"), "org name must not leak");
  });

  it("both anon -> 'Anonymous' with org omitted", () => {
    const result = attribution(
      { is_publicly_anonymous: true, is_org_anonymous: true, profiles: NAMED_AUTHOR, organizations: NAMED_ORG },
      ATTR_LABELS,
    );
    assert.equal(result, "Anonymous");
    assert.ok(!result.includes("Alice"));
    assert.ok(!result.includes("Acme"));
  });

  it("missing profile with no anonymity -> falls back to 'Unknown'", () => {
    const result = attribution(
      { is_publicly_anonymous: false, is_org_anonymous: false, profiles: null, organizations: null },
      ATTR_LABELS,
    );
    assert.equal(result, "Unknown");
  });
});

// ---------- Top-level problem anonymity ----------

describe("problemToMarkdown — top-level problem anonymity", () => {
  it("named problem: hero attribution includes both author and org", () => {
    const md = problemToMarkdown(makeProblem(), OPTS);
    assert.match(md, /\*\*Author:\*\* Alice Author/);
    assert.match(md, /\*\*Organization:\*\* Acme Corp/);
  });

  it("public-anon problem: hero author is 'Anonymous', real name absent", () => {
    const md = problemToMarkdown(
      makeProblem({ is_publicly_anonymous: true }),
      OPTS,
    );
    assert.match(md, /\*\*Author:\*\* Anonymous/);
    // Real name must not appear in the top-level hero section. It may still
    // appear in nested rows, which is correct — each row has its own flag.
    const heroSlice = md.slice(0, md.indexOf("## Description"));
    assert.ok(!heroSlice.includes("Alice Author"), "top-level real name leaked");
  });

  it("org-anon problem: Organization line omitted entirely", () => {
    const md = problemToMarkdown(
      makeProblem({ is_org_anonymous: true }),
      OPTS,
    );
    const heroSlice = md.slice(0, md.indexOf("## Description"));
    assert.ok(!heroSlice.includes("**Organization:**"), "org line should be absent");
    assert.ok(!heroSlice.includes("Acme Corp"), "org name must not leak");
  });

  it("both-anon problem: hero author Anonymous, no organization line", () => {
    const md = problemToMarkdown(
      makeProblem({ is_publicly_anonymous: true, is_org_anonymous: true }),
      OPTS,
    );
    const heroSlice = md.slice(0, md.indexOf("## Description"));
    assert.match(heroSlice, /\*\*Author:\*\* Anonymous/);
    assert.ok(!heroSlice.includes("**Organization:**"));
    assert.ok(!heroSlice.includes("Alice"));
    assert.ok(!heroSlice.includes("Acme"));
  });
});

// ---------- Per-nested-entity anonymity (the 16 permutations) ----------
//
// Matrix layout:
//   for each entity type {requirement, pilot_framework, solution_approach,
//                         success_report}
//     for each permutation {both-named, public-anon, org-anon, both-anon}
//       one test — 4 × 4 = 16
//
// Each test takes a problem where the top-level attribution is FULLY ANON
// (problem author anonymous, problem org anonymous) so the test can prove
// that the nested entity's own flags are what drive visibility — not any
// parent flag. If anonymity gating were mistakenly applied at the top-level
// and inherited, these tests would fail for the "nested row fully named"
// permutation because the parent's anonymity would suppress the child name.

const ANON_PROBLEM_OVERRIDES = {
  is_publicly_anonymous: true,
  is_org_anonymous: true,
} satisfies Partial<ProblemForMarkdown>;

function expectAuthorVisible(md: string, sectionMarker: string) {
  const section = md.slice(md.indexOf(sectionMarker));
  assert.ok(
    section.includes("Alice Author"),
    `expected nested author 'Alice Author' visible in section after '${sectionMarker}' but it was hidden`,
  );
}

function expectAuthorHidden(md: string, sectionMarker: string) {
  const section = md.slice(
    md.indexOf(sectionMarker),
    md.indexOf("## Source"),
  );
  assert.ok(
    !section.includes("Alice Author"),
    `nested author name leaked into section after '${sectionMarker}' despite is_publicly_anonymous=true`,
  );
  assert.ok(
    section.includes("Anonymous"),
    `expected 'Anonymous' label in section after '${sectionMarker}'`,
  );
}

function expectOrgVisible(md: string, sectionMarker: string) {
  const section = md.slice(md.indexOf(sectionMarker));
  assert.ok(
    section.includes("Acme Corp"),
    `expected nested org 'Acme Corp' visible in section after '${sectionMarker}' but it was hidden`,
  );
}

function expectOrgHidden(md: string, sectionMarker: string) {
  const section = md.slice(
    md.indexOf(sectionMarker),
    md.indexOf("## Source"),
  );
  assert.ok(
    !section.includes("Acme Corp"),
    `nested org name leaked into section after '${sectionMarker}' despite is_org_anonymous=true`,
  );
}

describe("problemToMarkdown — per-row nested anonymity (16 permutations)", () => {
  // ---------- Requirements ----------
  describe("requirements", () => {
    for (const perm of PERMUTATIONS) {
      it(`requirement with ${perm.key} (parent fully anon)`, () => {
        const md = problemToMarkdown(
          makeProblem({
            ...ANON_PROBLEM_OVERRIDES,
            requirements: [
              makeRequirement({
                is_publicly_anonymous: perm.is_publicly_anonymous,
                is_org_anonymous: perm.is_org_anonymous,
              }),
            ],
            // Force other nested types empty so we can cleanly scope the
            // section we slice for assertions.
            pilot_frameworks: [],
            solution_approaches: [],
          }),
          OPTS,
        );
        const marker = "## Requirements";
        if (perm.is_publicly_anonymous) expectAuthorHidden(md, marker);
        else expectAuthorVisible(md, marker);
        if (perm.is_org_anonymous) expectOrgHidden(md, marker);
        else expectOrgVisible(md, marker);
      });
    }
  });

  // ---------- Pilot frameworks ----------
  describe("pilot frameworks", () => {
    for (const perm of PERMUTATIONS) {
      it(`pilot framework with ${perm.key} (parent fully anon)`, () => {
        const md = problemToMarkdown(
          makeProblem({
            ...ANON_PROBLEM_OVERRIDES,
            requirements: [],
            solution_approaches: [],
            pilot_frameworks: [
              makePilotFramework({
                is_publicly_anonymous: perm.is_publicly_anonymous,
                is_org_anonymous: perm.is_org_anonymous,
              }),
            ],
          }),
          OPTS,
        );
        const marker = "## Pilot frameworks";
        if (perm.is_publicly_anonymous) expectAuthorHidden(md, marker);
        else expectAuthorVisible(md, marker);
        if (perm.is_org_anonymous) expectOrgHidden(md, marker);
        else expectOrgVisible(md, marker);
      });
    }
  });

  // ---------- Solution approaches ----------
  describe("solution approaches", () => {
    for (const perm of PERMUTATIONS) {
      it(`solution approach with ${perm.key} (parent fully anon)`, () => {
        const md = problemToMarkdown(
          makeProblem({
            ...ANON_PROBLEM_OVERRIDES,
            requirements: [],
            pilot_frameworks: [],
            solution_approaches: [
              makeSolutionApproach({
                is_publicly_anonymous: perm.is_publicly_anonymous,
                is_org_anonymous: perm.is_org_anonymous,
                // Success report inside the approach is left fully named so
                // we can isolate the approach's own flags. Nested report
                // anonymity has its own describe() below.
                success_reports: [makeSuccessReport()],
              }),
            ],
          }),
          OPTS,
        );
        // Slice just the approach heading line to avoid bleed-through from
        // the nested success report (which is always named here).
        const sectionStart = md.indexOf("## Solution approaches");
        const nextSection = md.indexOf("#### Verified", sectionStart);
        const approachHeader = md.slice(sectionStart, nextSection);

        if (perm.is_publicly_anonymous) {
          assert.ok(
            !approachHeader.includes("Alice Author"),
            `approach header leaked real author for ${perm.key}`,
          );
          assert.ok(
            approachHeader.includes("Anonymous"),
            `approach header missing 'Anonymous' label for ${perm.key}`,
          );
        } else {
          assert.ok(
            approachHeader.includes("Alice Author"),
            `approach header hidden real author for ${perm.key}`,
          );
        }
        if (perm.is_org_anonymous) {
          // Approach header line starts at "### " and ends at the first
          // blank line. Scope the org check to that one line — the
          // description paragraph below is free text and could legitimately
          // mention a brand name unrelated to attribution.
          const headerLineEnd = approachHeader.indexOf("\n\n");
          const headerLine = approachHeader.slice(0, headerLineEnd);
          assert.ok(
            !headerLine.includes("Acme Corp"),
            `approach header line leaked org for ${perm.key}`,
          );
        } else {
          assert.ok(
            approachHeader.includes("Acme Corp"),
            `approach header hidden org for ${perm.key}`,
          );
        }
      });
    }
  });

  // ---------- Success reports (nested inside a NAMED approach) ----------
  describe("success reports", () => {
    for (const perm of PERMUTATIONS) {
      it(`success report with ${perm.key} (parent approach named)`, () => {
        const md = problemToMarkdown(
          makeProblem({
            ...ANON_PROBLEM_OVERRIDES,
            requirements: [],
            pilot_frameworks: [],
            solution_approaches: [
              makeSolutionApproach({
                // Approach is fully named so we can prove the NESTED
                // success report's own flags gate its identity — not the
                // parent approach's.
                is_publicly_anonymous: false,
                is_org_anonymous: false,
                profiles: { display_name: "Bob Approach" },
                organizations: { id: "org-2", name: "Beta Inc" },
                success_reports: [
                  makeSuccessReport({
                    is_publicly_anonymous: perm.is_publicly_anonymous,
                    is_org_anonymous: perm.is_org_anonymous,
                    // Nested report has a distinct identity so we can tell
                    // the two apart in the output.
                    profiles: { display_name: "Carol Pilot" },
                    organizations: { id: "org-3", name: "Gamma LLC" },
                  }),
                ],
              }),
            ],
          }),
          OPTS,
        );
        // Slice the #### Verified outcomes block for this single approach.
        const verifiedStart = md.indexOf("#### Verified");
        assert.ok(verifiedStart >= 0, "expected verified outcomes block");
        const reportBlock = md.slice(verifiedStart, md.indexOf("## Source"));

        if (perm.is_publicly_anonymous) {
          assert.ok(
            !reportBlock.includes("Carol Pilot"),
            `report leaked real author for ${perm.key}`,
          );
          assert.ok(
            reportBlock.includes("Anonymous"),
            `report missing 'Anonymous' label for ${perm.key}`,
          );
        } else {
          assert.ok(
            reportBlock.includes("Carol Pilot"),
            `report hidden real author for ${perm.key}`,
          );
        }
        if (perm.is_org_anonymous) {
          assert.ok(
            !reportBlock.includes("Gamma LLC"),
            `report leaked org for ${perm.key}`,
          );
        } else {
          assert.ok(
            reportBlock.includes("Gamma LLC"),
            `report hidden org for ${perm.key}`,
          );
        }
      });
    }
  });
});

// ---------- Filtering: unpublished + unverified ----------

describe("problemToMarkdown — filtering", () => {
  it("excludes unpublished requirements / pilot_frameworks / approaches", () => {
    const md = problemToMarkdown(
      makeProblem({
        requirements: [
          makeRequirement({ body: "PUBLISHED-REQ", status: "published" }),
          makeRequirement({ id: "req-2", body: "DRAFT-REQ", status: "draft" }),
        ],
        pilot_frameworks: [
          makePilotFramework({ scope: "PUBLISHED-SCOPE", status: "published" }),
          makePilotFramework({ id: "fw-2", scope: "DRAFT-SCOPE", status: "submitted" }),
        ],
        solution_approaches: [
          makeSolutionApproach({ title: "PUBLISHED-SA", status: "published" }),
          makeSolutionApproach({ id: "sa-2", title: "DRAFT-SA", status: "draft" }),
        ],
      }),
      OPTS,
    );
    assert.match(md, /PUBLISHED-REQ/);
    assert.ok(!md.includes("DRAFT-REQ"));
    assert.match(md, /PUBLISHED-SCOPE/);
    assert.ok(!md.includes("DRAFT-SCOPE"));
    assert.match(md, /PUBLISHED-SA/);
    assert.ok(!md.includes("DRAFT-SA"));
  });

  it("excludes unverified success reports from verified outcomes", () => {
    const md = problemToMarkdown(
      makeProblem({
        solution_approaches: [
          makeSolutionApproach({
            success_reports: [
              makeSuccessReport({
                report_summary: "VERIFIED-REPORT",
                verification_status: "verified",
                status: "published",
              }),
              makeSuccessReport({
                id: "sr-2",
                report_summary: "PENDING-REPORT",
                verification_status: "under_review",
                status: "published",
              }),
              makeSuccessReport({
                id: "sr-3",
                report_summary: "DRAFT-REPORT",
                verification_status: "verified",
                status: "submitted",
              }),
            ],
          }),
        ],
      }),
      OPTS,
    );
    assert.match(md, /VERIFIED-REPORT/);
    assert.ok(!md.includes("PENDING-REPORT"));
    assert.ok(!md.includes("DRAFT-REPORT"));
  });
});

// ---------- Frontmatter ----------

describe("problemToMarkdown — frontmatter", () => {
  it("emits canonical, status, created, updated, tags", () => {
    const md = problemToMarkdown(makeProblem(), OPTS);
    assert.match(md, /^---\n/);
    assert.match(md, /canonical: https:\/\/openclienting\.org\/en\/problems\/prob-123/);
    assert.match(md, /status: has_approaches/);
    assert.match(md, /created: 2025-01-10T10:00:00\.000Z/);
    assert.match(md, /updated: 2025-03-15T14:00:00\.000Z/);
    assert.match(md, /tags: \[manufacturing\]/);
  });

  it("omits updated when null", () => {
    const md = problemToMarkdown(makeProblem({ updated_at: null }), OPTS);
    assert.ok(!md.includes("updated:"));
  });
});
