/**
 * Suite 4 — cache-tag coverage snapshot
 *
 * Static analysis: for every exported async function in actions files whose
 * body contains a Supabase mutation (.insert / .update / .delete / .upsert),
 * assert the same function body also calls a cache-invalidation primitive
 * (updateTag / revalidateTag / revalidatePath).
 *
 * This test does NOT fix offenders — it only prevents NEW ones from being
 * introduced silently. Known existing offenders are allowlisted below with
 * a TODO referencing PR 5 where they will be fixed.
 *
 * Approach: regex-based extraction of function bodies. We locate each
 * exported function's opening brace and then track brace depth to find
 * the closing brace, extracting the full body for analysis.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Files to scan — all actions.ts files under src/
// ---------------------------------------------------------------------------
function collectActionFiles(): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (
        (entry === "actions.ts" || dir.includes(join("src", "lib", "actions"))) &&
        entry.endsWith(".ts") &&
        !entry.endsWith(".test.ts")
      ) {
        files.push(full);
      }
    }
  }

  walk(join(ROOT, "src"));
  return files;
}

// ---------------------------------------------------------------------------
// Extract function bodies via brace-balancing
// Returns an array of { name, body } for each exported async function
// ---------------------------------------------------------------------------
interface FunctionEntry {
  name: string;
  filePath: string;
  body: string;
}

// NOTE: regex is created fresh per call (no /g module-level state leak)
const EXPORT_FN_PATTERN = /export\s+async\s+function\s+(\w+)\s*\(/g;

/**
 * Walk `source` from position `start` tracking nesting depth for the given
 * open/close pair. Returns the index of the closing character that brings
 * depth back to 0, or -1 if not found.
 *
 * `start` should point at the opening character itself.
 */
function findMatchingClose(
  source: string,
  start: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1] ?? "";

    // Line comment start
    if (!inString && !inBlockComment && ch === "/" && next === "/") {
      inLineComment = true;
      continue;
    }
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }

    // Block comment start
    if (!inString && ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") { inBlockComment = false; i++; }
      continue;
    }

    // String literals — handle escape sequences minimally
    if (!inString && (ch === '"' || ch === "'" || ch === "`")) {
      inString = ch;
      continue;
    }
    if (inString) {
      if (ch === "\\" ) { i++; continue; } // skip escaped char
      if (ch === inString) inString = null;
      // For template literals, nested ${...} would need recursive handling;
      // we skip that complexity — the brace inside ${...} is in a string
      // so we won't count it (inString !== null guards it).
      continue;
    }

    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractExportedFunctions(source: string, filePath: string): FunctionEntry[] {
  const results: FunctionEntry[] = [];
  // Reset regex each call by creating a new one (avoids lastIndex state leak)
  const re = new RegExp(EXPORT_FN_PATTERN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(source)) !== null) {
    const name = match[1];
    // match[0] ends just before the opening paren of the parameter list.
    // We need to skip the paren group (which may contain typed params with
    // nested braces like `params: { foo: string }`) to reach the function body `{`.
    const parenStart = match.index + match[0].length - 1; // index of '('
    if (source[parenStart] !== "(") continue;

    const parenEnd = findMatchingClose(source, parenStart, "(", ")");
    if (parenEnd === -1) continue;

    // After the closing paren there may be a return-type annotation `: Promise<...>`
    // or just whitespace before the opening `{`. Scan forward to find `{`.
    let bodyStart = -1;
    for (let j = parenEnd + 1; j < source.length; j++) {
      const ch = source[j];
      if (ch === "{") { bodyStart = j; break; }
      // If we hit another function keyword or `export` first, something went wrong
      if (ch === "e" && source.slice(j, j + 6) === "export") break;
    }
    if (bodyStart === -1) continue;

    const bodyEnd = findMatchingClose(source, bodyStart, "{", "}");
    if (bodyEnd === -1) continue;

    results.push({
      name,
      filePath,
      body: source.slice(bodyStart, bodyEnd + 1),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Pattern matchers
// ---------------------------------------------------------------------------
const MUTATION_RE = /\.(insert|update|delete|upsert)\s*\(/;
const CACHE_INVALIDATION_RE = /\b(updateTag|revalidateTag|revalidatePath)\s*\(/;

function hasMutation(body: string): boolean {
  return MUTATION_RE.test(body);
}

function hasCacheInvalidation(body: string): boolean {
  return CACHE_INVALIDATION_RE.test(body);
}

// ---------------------------------------------------------------------------
// EXPECTED_OFFENDERS allowlist
//
// Format: "relative/path/to/file.ts::functionName"
// Relative to project root (src/... or full path pattern)
//
// TODO (PR 5): add cache invalidation to all allowlisted functions and
// remove them from this list.
// ---------------------------------------------------------------------------
const EXPECTED_OFFENDERS = new Set<string>([
  // organizations.ts — requestOrganizationVerification: updates org.verification_status, no cache.
  "src/lib/actions/organizations.ts::requestOrganizationVerification",

  // organizations.ts — requestMembership: updates/inserts membership, no cache.
  "src/lib/actions/organizations.ts::requestMembership",

  // organizations.ts — uploadOrgLogo: updates organizations.logo_url, no cache invalidation.
  "src/lib/actions/organizations.ts::uploadOrgLogo",

  // organizations.ts — leaveOrganization: updates membership_status, no cache.
  "src/lib/actions/organizations.ts::leaveOrganization",

  // organizations.ts — reviewMembership: updates membership_status, no cache.
  "src/lib/actions/organizations.ts::reviewMembership",

  // account.ts — profile/avatar mutations don't invalidate any Next.js cache tags.
  "src/lib/actions/account.ts::updateProfile",
  "src/lib/actions/account.ts::uploadAvatar",
  "src/lib/actions/account.ts::removeAvatar",
  "src/lib/actions/account.ts::setOrChangePassword",

  // comments.ts — submitComment: inserts a comment, no cache invalidation.
  "src/lib/actions/comments.ts::submitComment",

  // knowledge-articles.ts — proposeKnowledgeArticle: inserts, no cache.
  "src/lib/actions/knowledge-articles.ts::proposeKnowledgeArticle",

  // notifications.ts — notification reads/prefs don't need cache invalidation.
  "src/lib/actions/notifications.ts::markNotificationRead",
  "src/lib/actions/notifications.ts::markAllNotificationsRead",
  "src/lib/actions/notifications.ts::updateNotificationPreferences",

  // pilot-frameworks.ts — submitPilotFramework: inserts, no cache.
  "src/lib/actions/pilot-frameworks.ts::submitPilotFramework",

  // requirements.ts — submitRequirement: inserts, no cache.
  "src/lib/actions/requirements.ts::submitRequirement",

  // solution-approaches.ts — submitSolutionApproach: inserts, no cache.
  "src/lib/actions/solution-approaches.ts::submitSolutionApproach",

  // success-reports.ts — submitSuccessReport: inserts, no cache.
  "src/lib/actions/success-reports.ts::submitSuccessReport",

  // suggested-edits.ts — submitSuggestedEdit: inserts, no cache.
  "src/lib/actions/suggested-edits.ts::submitSuggestedEdit",

  // vote.ts — toggleVote: insert/delete on votes table, no cache invalidation.
  "src/lib/actions/vote.ts::toggleVote",

  // moderate/actions.ts — approveRevision: updates content_revisions, no cache invalidation.
  "src/app/[locale]/(shell)/moderate/actions.ts::approveRevision",

  // translate/actions.ts — proposeTranslation: inserts content_translations, no cache.
  "src/app/[locale]/(shell)/translate/actions.ts::proposeTranslation",

  // translate/actions.ts — rejectTranslation: updates content_translations, no cache.
  "src/app/[locale]/(shell)/translate/actions.ts::rejectTranslation",
]);

// ---------------------------------------------------------------------------
// The test
// ---------------------------------------------------------------------------
describe("cache-tag coverage snapshot", () => {
  it("all mutation-containing action functions call cache invalidation — or are allowlisted", () => {
    const actionFiles = collectActionFiles();
    expect(actionFiles.length).toBeGreaterThan(0);

    const newOffenders: string[] = [];
    const allowlistedButClean: string[] = []; // allowlisted yet has no mutation (stale entry warning)

    for (const filePath of actionFiles) {
      const source = readFileSync(filePath, "utf-8");
      const functions = extractExportedFunctions(source, filePath);

      // Compute relative key
      const relPath = filePath.replace(ROOT + "/", "").replace(ROOT + "\\", "").replace(/\\/g, "/");

      for (const fn of functions) {
        const key = `${relPath}::${fn.name}`;
        const mutates = hasMutation(fn.body);
        const invalidates = hasCacheInvalidation(fn.body);

        if (mutates && !invalidates) {
          if (!EXPECTED_OFFENDERS.has(key)) {
            newOffenders.push(key);
          }
          // else: known offender, allowlisted — OK
        }

        // Warn if something is in the allowlist but no longer has mutations
        // (indicates the allowlist entry is stale after a refactor)
        if (EXPECTED_OFFENDERS.has(key) && !mutates) {
          allowlistedButClean.push(key);
        }
      }
    }

    if (allowlistedButClean.length > 0) {
      console.warn(
        "\n[cache-tags] Stale allowlist entries (no longer have mutations — remove from EXPECTED_OFFENDERS):\n" +
          allowlistedButClean.map((k) => `  - ${k}`).join("\n"),
      );
    }

    if (newOffenders.length > 0) {
      const msg =
        "\n[cache-tags] NEW mutation functions missing cache invalidation.\n" +
        "Either add updateTag/revalidateTag/revalidatePath to these functions,\n" +
        "or add them to EXPECTED_OFFENDERS in tests/cache-tags.test.ts with a TODO:\n\n" +
        newOffenders.map((k) => `  - ${k}`).join("\n") +
        "\n";
      expect.fail(msg);
    }
  });

  it("EXPECTED_OFFENDERS set is not empty (self-test: allowlist is being read)", () => {
    expect(EXPECTED_OFFENDERS.size).toBeGreaterThan(0);
  });
});
