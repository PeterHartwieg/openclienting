/**
 * Markdown alternatives for problem detail and the venture-clienting explainer.
 *
 * These builders are pure and synchronous: they accept all locale-specific
 * strings as input (section labels, attribution labels, tag labels) and return
 * a Markdown string. No next-intl, no Next.js, no Supabase client. Keeping the
 * builders translation-free makes them trivially testable from Node's built-in
 * test runner and keeps anonymity gating visible to the reader — every row
 * that carries an identity runs through `attribution()` exactly once.
 *
 * Anonymity is enforced **per row**, not at the top level: a problem author
 * may be anonymous while a requirement on that same problem is named (or vice
 * versa). This matches `src/app/[locale]/problems/[id]/page.tsx` which applies
 * `is_publicly_anonymous` / `is_org_anonymous` to each nested entity
 * independently. The route handlers that consume these builders MUST NOT
 * apply a single "problem is anonymous -> hide everything" gate.
 */

// ---------- Types ----------

interface Profile {
  display_name: string | null;
}

interface Org {
  id?: string;
  name: string;
}

/**
 * Pre-resolved tag — the caller (route handler) is responsible for turning
 * raw `problem_tags` rows into `{ label, slug }` pairs using
 * `getTagLabel(tag, locale)`. Keeping tag resolution out of this module means
 * `markdown.ts` has no dependency on next-intl, `getTagLabel`, or any other
 * project module, which lets it be tested by Node's built-in test runner
 * without path-alias gymnastics.
 */
export interface ResolvedTag {
  label: string; // already localized
  slug: string;
}

/**
 * Minimal shape every identity-carrying row must satisfy. Each nested entity
 * (requirement, pilot_framework, solution_approach, success_report) and the
 * top-level problem matches this structure independently — there is no
 * inheritance from parent to child.
 */
export interface AttributedRow {
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean | null;
  profiles?: Profile | null;
  organizations?: Org | null;
}

export interface AttributionLabels {
  anonymous: string; // "Anonymous" / "Anonym"
  unknown: string;   // "Unknown"   / "Unbekannt"
}

export interface ProblemMarkdownLabels extends AttributionLabels {
  author: string;              // "Author"
  organization: string;        // "Organization"
  description: string;         // "Description" (section heading)
  requirements: string;        // "Requirements"
  requirementsEmpty: string;   // "No requirements published yet."
  pilotFrameworks: string;     // "Pilot frameworks"
  pilotFrameworksEmpty: string;
  solutionApproaches: string;  // "Solution approaches"
  solutionApproachesEmpty: string;
  verifiedOutcomes: string;    // "Verified success reports"
  source: string;              // "Source"
  canonical: string;           // "Canonical"
  license: string;             // "License"
  upvotes: string;             // "upvotes" (unit)
  technology: string;          // "Technology"
  maturity: string;            // "Maturity"
  complexity: string;          // "Complexity"
  price: string;               // "Price"
  scope: string;               // "Scope"
  duration: string;            // "Duration"
  suggestedKpis: string;       // "Suggested KPIs"
  successCriteria: string;     // "Success criteria"
  commonPitfalls: string;      // "Common pitfalls"
  resourceCommitment: string;  // "Resource commitment"
  pilotPeriod: string;         // "Pilot period"
  deploymentScope: string;     // "Deployment scope"
  kpiSummary: string;          // "Key results"
  evidenceNotes: string;       // "Evidence"
}

export interface ProblemRequirement extends AttributedRow {
  id: string;
  body: string;
  upvote_count: number;
  status: string;
}

export interface ProblemPilotFramework extends AttributedRow {
  id: string;
  scope: string | null;
  suggested_kpis: string | null;
  success_criteria: string | null;
  common_pitfalls: string | null;
  duration: string | null;
  resource_commitment: string | null;
  upvote_count: number;
  status: string;
}

export interface ProblemSuccessReport extends AttributedRow {
  id: string;
  report_summary: string;
  pilot_date_range: string | null;
  deployment_scope: string | null;
  kpi_summary: string | null;
  evidence_notes: string | null;
  verification_status: string | null;
  status: string;
}

export interface ProblemSolutionApproach extends AttributedRow {
  id: string;
  title: string;
  description: string;
  technology_type: string | null;
  maturity: string | null;
  complexity: string | null;
  price_range: string | null;
  upvote_count: number;
  status: string;
  success_reports?: ProblemSuccessReport[] | null;
}

export interface ProblemForMarkdown extends AttributedRow {
  id: string;
  title: string;
  description: string;
  solution_status: string | null;
  created_at: string;
  updated_at: string | null;
  requirements?: ProblemRequirement[] | null;
  pilot_frameworks?: ProblemPilotFramework[] | null;
  solution_approaches?: ProblemSolutionApproach[] | null;
}

// ---------- Attribution ----------

/**
 * Build a "{author} · {org}" attribution string, applying the per-row
 * anonymity flags. Exported so the route handlers (and tests) can exercise it
 * directly.
 *
 * Rules:
 *   - `is_publicly_anonymous` true  -> author label becomes `labels.anonymous`
 *     regardless of whether `profiles.display_name` is set.
 *   - `is_publicly_anonymous` false -> author label is `profiles.display_name`
 *     or `labels.unknown` as a fallback. This matches the HTML page so the
 *     markdown and HTML stay in lockstep.
 *   - `is_org_anonymous` true  -> org is omitted entirely (no " · Org" suffix).
 *   - `is_org_anonymous` false -> org is `organizations.name` if present.
 *
 * The function never back-links an anonymous row to its real identity: if a
 * row has `is_publicly_anonymous: true` and a known `display_name`, the real
 * name is discarded, not appended alongside "Anonymous".
 */
export function attribution(
  row: AttributedRow,
  labels: AttributionLabels,
): string {
  const authorLabel = row.is_publicly_anonymous
    ? labels.anonymous
    : row.profiles?.display_name ?? labels.unknown;
  const orgLabel = row.is_org_anonymous
    ? null
    : row.organizations?.name ?? null;
  // U+00B7 middle dot matches the HTML attribution separator.
  return orgLabel ? `${authorLabel} \u00B7 ${orgLabel}` : authorLabel;
}

// ---------- Helpers ----------

const YAML_SPECIAL = /[:#&*!|>'"%@`{}\[\],]/;

function yamlString(value: string): string {
  // Escape double quotes and backslashes and wrap in double quotes when the
  // value contains any YAML-significant character. Keep pure alphanumerics
  // unquoted for readability.
  if (value === "") return '""';
  if (YAML_SPECIAL.test(value) || /^\s|\s$/.test(value) || /\n/.test(value)) {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return value;
}

function yamlList(values: string[]): string {
  if (values.length === 0) return "[]";
  return `[${values.map(yamlString).join(", ")}]`;
}

function ensureTrailingNewline(md: string): string {
  return md.endsWith("\n") ? md : `${md}\n`;
}

// ---------- Problem builder ----------

export interface ProblemMarkdownOptions {
  canonicalUrl: string;
  labels: ProblemMarkdownLabels;
  licenseName: string; // e.g. "CC BY-SA 4.0"
  /**
   * Tags for the problem, already localized by the caller. The route handler
   * resolves these via `getTagLabel(tag, locale)` before calling us.
   */
  tags: ResolvedTag[];
}

export function problemToMarkdown(
  problem: ProblemForMarkdown,
  opts: ProblemMarkdownOptions,
): string {
  const { canonicalUrl, labels, licenseName, tags } = opts;

  // --- Frontmatter ---
  const tagSlugs = tags.map((t) => t.slug);
  const tagLabels = tags.map((t) => t.label);

  const frontmatterLines = [
    "---",
    `title: ${yamlString(problem.title)}`,
    `canonical: ${canonicalUrl}`,
    `status: ${problem.solution_status ?? "unsolved"}`,
    `created: ${problem.created_at}`,
  ];
  if (problem.updated_at) {
    frontmatterLines.push(`updated: ${problem.updated_at}`);
  }
  if (tagSlugs.length > 0) {
    frontmatterLines.push(`tags: ${yamlList(tagSlugs)}`);
  }
  frontmatterLines.push("---", "");

  // --- Title + top-level attribution ---
  const body: string[] = [];
  body.push(`# ${problem.title}`, "");

  const problemAuthor = problem.is_publicly_anonymous
    ? labels.anonymous
    : problem.profiles?.display_name ?? labels.unknown;
  body.push(`**${labels.author}:** ${problemAuthor}`);
  if (!problem.is_org_anonymous && problem.organizations?.name) {
    body.push(`**${labels.organization}:** ${problem.organizations.name}`);
  }
  body.push("");

  // Tags (visible list, mirrors the hero on HTML)
  if (tagLabels.length > 0) {
    body.push(`_${tagLabels.join(" · ")}_`, "");
  }

  // --- Description ---
  body.push(`## ${labels.description}`, "");
  body.push(problem.description.trim(), "");

  // --- Requirements ---
  const publishedRequirements = (problem.requirements ?? [])
    .filter((r) => r.status === "published")
    .slice()
    .sort((a, b) => b.upvote_count - a.upvote_count);

  body.push(`## ${labels.requirements}`, "");
  if (publishedRequirements.length === 0) {
    body.push(labels.requirementsEmpty, "");
  } else {
    publishedRequirements.forEach((req, idx) => {
      const attr = attribution(req, labels);
      body.push(
        `${idx + 1}. ${req.body.trim()} (${req.upvote_count} ${labels.upvotes}) — ${attr}`,
      );
    });
    body.push("");
  }

  // --- Pilot frameworks ---
  const publishedFrameworks = (problem.pilot_frameworks ?? [])
    .filter((f) => f.status === "published")
    .slice()
    .sort((a, b) => b.upvote_count - a.upvote_count);

  body.push(`## ${labels.pilotFrameworks}`, "");
  if (publishedFrameworks.length === 0) {
    body.push(labels.pilotFrameworksEmpty, "");
  } else {
    publishedFrameworks.forEach((fw, idx) => {
      const attr = attribution(fw, labels);
      body.push(
        `### ${labels.pilotFrameworks} #${idx + 1} — ${attr} (${fw.upvote_count} ${labels.upvotes})`,
        "",
      );
      const fields: Array<[string, string | null]> = [
        [labels.scope, fw.scope],
        [labels.duration, fw.duration],
        [labels.suggestedKpis, fw.suggested_kpis],
        [labels.successCriteria, fw.success_criteria],
        [labels.commonPitfalls, fw.common_pitfalls],
        [labels.resourceCommitment, fw.resource_commitment],
      ];
      for (const [label, value] of fields) {
        if (value) body.push(`- **${label}:** ${value.trim()}`);
      }
      body.push("");
    });
  }

  // --- Solution approaches ---
  const publishedApproaches = (problem.solution_approaches ?? [])
    .filter((sa) => sa.status === "published")
    .slice()
    .sort((a, b) => b.upvote_count - a.upvote_count);

  body.push(`## ${labels.solutionApproaches}`, "");
  if (publishedApproaches.length === 0) {
    body.push(labels.solutionApproachesEmpty, "");
  } else {
    for (const sa of publishedApproaches) {
      const attr = attribution(sa, labels);
      body.push(
        `### ${sa.title} — ${attr} (${sa.upvote_count} ${labels.upvotes})`,
        "",
      );
      body.push(sa.description.trim(), "");
      const fields: Array<[string, string | null]> = [
        [labels.technology, sa.technology_type],
        [labels.maturity, sa.maturity],
        [labels.complexity, sa.complexity],
        [labels.price, sa.price_range],
      ];
      const rendered = fields.filter(([, v]) => v);
      if (rendered.length > 0) {
        for (const [label, value] of rendered) {
          body.push(`- **${label}:** ${value!.trim()}`);
        }
        body.push("");
      }

      // Only verified, published success reports — unverified reports are
      // noise for citation per the plan.
      const verifiedReports = (sa.success_reports ?? []).filter(
        (r) => r.status === "published" && r.verification_status === "verified",
      );
      if (verifiedReports.length > 0) {
        body.push(`#### ${labels.verifiedOutcomes}`, "");
        for (const report of verifiedReports) {
          const reportAttr = attribution(report, labels);
          // Headline: quoted summary + attribution
          body.push(
            `- \u201C${report.report_summary.trim()}\u201D — ${reportAttr}`,
          );
          const details: Array<[string, string | null]> = [
            [labels.pilotPeriod, report.pilot_date_range],
            [labels.deploymentScope, report.deployment_scope],
            [labels.kpiSummary, report.kpi_summary],
            [labels.evidenceNotes, report.evidence_notes],
          ];
          for (const [label, value] of details) {
            if (value) {
              body.push(`  - **${label}:** ${value.trim()}`);
            }
          }
        }
        body.push("");
      }
    }
  }

  // --- Source block ---
  body.push(`## ${labels.source}`, "");
  body.push(`- **${labels.canonical}:** ${canonicalUrl}`);
  body.push(`- **${labels.license}:** ${licenseName}`);
  body.push("");

  return ensureTrailingNewline([...frontmatterLines, ...body].join("\n"));
}

// ---------- Venture-clienting builder ----------

export interface VentureClientingMarkdownLabels {
  title: string;
  lede: string;
  sections: Array<{ title: string; body: string }>;
  source: string;
  canonical: string;
  license: string;
}

export interface VentureClientingMarkdownOptions {
  canonicalUrl: string;
  licenseName: string;
  labels: VentureClientingMarkdownLabels;
  updatedAt: string; // ISO — build time is fine
}

export function ventureClientingToMarkdown(
  opts: VentureClientingMarkdownOptions,
): string {
  const { canonicalUrl, licenseName, labels, updatedAt } = opts;
  const lines: string[] = [];
  lines.push(
    "---",
    `title: ${yamlString(labels.title)}`,
    `canonical: ${canonicalUrl}`,
    `updated: ${updatedAt}`,
    "---",
    "",
    `# ${labels.title}`,
    "",
    labels.lede.trim(),
    "",
  );
  for (const section of labels.sections) {
    lines.push(`## ${section.title}`, "", section.body.trim(), "");
  }
  lines.push(
    `## ${labels.source}`,
    "",
    `- **${labels.canonical}:** ${canonicalUrl}`,
    `- **${labels.license}:** ${licenseName}`,
    "",
  );
  return ensureTrailingNewline(lines.join("\n"));
}

// ---------- Organization profile builder ----------

/**
 * Organization profile → Markdown.
 *
 * Unlike the problem Markdown builder, there is no per-row anonymity gate
 * here: the data fed in has already been filtered at the query layer to only
 * include submissions where `is_org_anonymous = false`. The profile only
 * shows verified orgs whose identity is public by definition, so there is no
 * author anonymity to consider either — all we render about authors here is
 * that they work at the profiled org, which is already an attribution they
 * opted into when toggling the org-visible flag on their submission.
 *
 * Pure and synchronous: all locale-specific strings come in via `labels`.
 * No dependency on next-intl or Next.js, so it's trivially testable with
 * Node's built-in test runner.
 */
export interface OrganizationMarkdownLabels {
  website: string;                 // "Website"
  employees: string;               // "Employees"
  verified: string;                // "Verified"
  problems: string;                // "Problems authored"
  problemsEmpty: string;
  solutionApproaches: string;      // "Solution approaches offered"
  solutionApproachesEmpty: string;
  verifiedOutcomes: string;        // "Verified pilot outcomes as client"
  verifiedOutcomesEmpty: string;
  source: string;                  // "Source"
  canonical: string;               // "Canonical"
  license: string;                 // "License"
  about: string;                   // "About"
  inProblem: string;               // "In problem:"
}

export interface OrganizationProfileForMarkdown {
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  employeeCount: number | null;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface OrgMdProblem {
  id: string;
  title: string;
  description: string;
  solution_status: string | null;
}

export interface OrgMdSolutionApproach {
  id: string;
  title: string;
  description: string;
  technology_type: string | null;
  maturity: string | null;
  problem_id: string;
  problem_title: string;
}

export interface OrgMdSuccessReport {
  id: string;
  report_summary: string;
  solution_approach_title: string;
  problem_id: string;
  problem_title: string;
}

export interface OrganizationMarkdownOptions {
  canonicalUrl: string;
  labels: OrganizationMarkdownLabels;
  licenseName: string;
  problems: OrgMdProblem[];
  solutionApproaches: OrgMdSolutionApproach[];
  verifiedSuccessReports: OrgMdSuccessReport[];
  siteUrl: string; // absolute, no trailing slash — used to build problem links
  locale: string;
}

export function organizationToMarkdown(
  org: OrganizationProfileForMarkdown,
  opts: OrganizationMarkdownOptions,
): string {
  const {
    canonicalUrl,
    labels,
    licenseName,
    problems,
    solutionApproaches,
    verifiedSuccessReports,
    siteUrl,
    locale,
  } = opts;

  const frontmatter: string[] = [
    "---",
    `title: ${yamlString(org.name)}`,
    `canonical: ${canonicalUrl}`,
    `slug: ${yamlString(org.slug)}`,
  ];
  if (org.website) frontmatter.push(`website: ${yamlString(org.website)}`);
  if (org.employeeCount != null)
    frontmatter.push(`employees: ${org.employeeCount}`);
  frontmatter.push(`verified: true`);
  frontmatter.push(`created: ${org.createdAt}`);
  if (org.updatedAt) frontmatter.push(`updated: ${org.updatedAt}`);
  frontmatter.push("---", "");

  const body: string[] = [];
  body.push(`# ${org.name}`, "");

  // Metadata block — mirrors the hero.
  const meta: string[] = [];
  if (org.website) meta.push(`- **${labels.website}:** ${org.website}`);
  if (org.employeeCount != null)
    meta.push(`- **${labels.employees}:** ${org.employeeCount}`);
  meta.push(`- **${labels.verified}**`);
  body.push(...meta, "");

  // About
  if (org.description && org.description.trim().length > 0) {
    body.push(`## ${labels.about}`, "");
    body.push(org.description.trim(), "");
  }

  // Problems authored
  body.push(`## ${labels.problems}`, "");
  if (problems.length === 0) {
    body.push(labels.problemsEmpty, "");
  } else {
    for (const p of problems) {
      const problemUrl = `${siteUrl}/${locale}/problems/${p.id}`;
      body.push(`- [${p.title}](${problemUrl})`);
    }
    body.push("");
  }

  // Solution approaches offered
  body.push(`## ${labels.solutionApproaches}`, "");
  if (solutionApproaches.length === 0) {
    body.push(labels.solutionApproachesEmpty, "");
  } else {
    for (const sa of solutionApproaches) {
      const problemUrl = `${siteUrl}/${locale}/problems/${sa.problem_id}`;
      body.push(
        `- **${sa.title}** — ${labels.inProblem} [${sa.problem_title}](${problemUrl})`,
      );
    }
    body.push("");
  }

  // Verified pilot outcomes (as client)
  body.push(`## ${labels.verifiedOutcomes}`, "");
  if (verifiedSuccessReports.length === 0) {
    body.push(labels.verifiedOutcomesEmpty, "");
  } else {
    for (const r of verifiedSuccessReports) {
      const problemUrl = `${siteUrl}/${locale}/problems/${r.problem_id}`;
      body.push(
        `- \u201C${r.report_summary.trim()}\u201D — ${labels.inProblem} [${r.problem_title}](${problemUrl})`,
      );
    }
    body.push("");
  }

  // Source block
  body.push(`## ${labels.source}`, "");
  body.push(`- **${labels.canonical}:** ${canonicalUrl}`);
  body.push(`- **${labels.license}:** ${licenseName}`);
  body.push("");

  return ensureTrailingNewline([...frontmatter, ...body].join("\n"));
}
