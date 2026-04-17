/**
 * Suite 4 — cache-tag coverage snapshot
 *
 * Static analysis: for every exported async function in actions files whose
 * body contains a Supabase mutation (.insert / .update / .delete / .upsert),
 * assert the same function body also calls a cache-invalidation primitive
 * (updateTag / revalidateTag / revalidatePath / invalidateFor / invalidateForMany).
 *
 * This test does NOT fix offenders — it only prevents NEW ones from being
 * introduced silently. Known existing offenders are allowlisted below with
 * a documented reason.
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
// Recognise all current and future cache-invalidation call forms:
//   - updateTag("...") / revalidateTag("...") / revalidatePath("...")  — direct Next.js API
//   - invalidateFor(...)  / invalidateForMany(...)                      — registry helpers (PR 6+)
const CACHE_INVALIDATION_RE =
  /\b(updateTag|revalidateTag|revalidatePath|invalidateFor|invalidateForMany)\s*\(/;

function hasMutation(body: string): boolean {
  return MUTATION_RE.test(body);
}

function hasCacheInvalidation(body: string): boolean {
  return CACHE_INVALIDATION_RE.test(body);
}

// ---------------------------------------------------------------------------
// EXPECTED_OFFENDERS allowlist
//
// Format: { file, function, reason }
//   file     — relative path from project root (src/...)
//   function — exported function name
//   reason   — one-line justification for why this offender is acceptable
//
// Remove an entry when you add proper cache invalidation to that function.
// ---------------------------------------------------------------------------
interface AllowlistEntry {
  file: string;
  function: string;
  reason: string;
}

const ALLOWLIST: AllowlistEntry[] = [
  {
    file: "src/lib/actions/organizations.ts",
    function: "requestOrganizationVerification",
    reason:
      "sets org.verification_status to 'pending'; org remains hidden from cached directory (verified-only filter) until a moderator approves",
  },
  {
    file: "src/lib/actions/organizations.ts",
    function: "requestMembership",
    reason:
      "writes to organization_memberships which has no unstable_cache reader; getUserOrganizations and getUserVerifiedMemberships use per-request createClient calls",
  },
  {
    file: "src/lib/actions/organizations.ts",
    function: "leaveOrganization",
    reason:
      "updates organization_memberships.membership_status; membership table has no unstable_cache reader",
  },
  {
    file: "src/lib/actions/organizations.ts",
    function: "reviewMembership",
    reason:
      "updates organization_memberships.membership_status; membership table has no unstable_cache reader",
  },
  {
    file: "src/lib/actions/account.ts",
    function: "setOrChangePassword",
    reason:
      "updates auth credentials only; no row in any cached Supabase table changes",
  },
  {
    file: "src/lib/actions/comments.ts",
    function: "submitComment",
    reason:
      "inserts into comments; no unstable_cache reader for comments exists (comment lists are per-request React.cache or live-fetched)",
  },
  {
    file: "src/lib/actions/knowledge-articles.ts",
    function: "proposeKnowledgeArticle",
    reason:
      "inserts with status='submitted'; the only cached reader (getPublishedArticlesCached) filters status='published', so no cached data changes",
  },
  {
    file: "src/lib/actions/notifications.ts",
    function: "markNotificationRead",
    reason:
      "updates notifications.read; getDashboardOverview uses React.cache (per-request RPC), no persistent unstable_cache",
  },
  {
    file: "src/lib/actions/notifications.ts",
    function: "markAllNotificationsRead",
    reason:
      "updates notifications.read for all rows; same — no persistent unstable_cache reader",
  },
  {
    file: "src/lib/actions/notifications.ts",
    function: "updateNotificationPreferences",
    reason:
      "upserts notification_preferences; no unstable_cache reader for this table",
  },
  {
    file: "src/lib/actions/suggested-edits.ts",
    function: "submitSuggestedEdit",
    reason:
      "inserts into suggested_edits with status='submitted'; no unstable_cache reader for the suggested_edits table in submitted state",
  },
  {
    file: "src/app/[locale]/(shell)/moderate/actions.ts",
    function: "approveRevision",
    reason:
      "updates content_revisions.revision_status to 'approved' only; the live content was already updated (and its cache busted) when the author called editProblem/editSolutionApproach — approving the revision record does not change public content again",
  },
  {
    file: "src/app/[locale]/(shell)/translate/actions.ts",
    function: "proposeTranslation",
    reason:
      "inserts content_translations with status='submitted'; getPublishedTranslations uses React.cache (per-request) and filters status='published', so no persistent cached data changes",
  },
  {
    file: "src/app/[locale]/(shell)/translate/actions.ts",
    function: "rejectTranslation",
    reason:
      "sets status='rejected' on a non-published translation row; no published cached data changes (same React.cache reasoning as proposeTranslation)",
  },
];

// Build a Set of "file::function" keys for fast lookup
const EXPECTED_OFFENDERS = new Set<string>(
  ALLOWLIST.map((e) => `${e.file}::${e.function}`),
);

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
        "\n[cache-tags] Stale allowlist entries (no longer have mutations — remove from ALLOWLIST):\n" +
          allowlistedButClean.map((k) => `  - ${k}`).join("\n"),
      );
    }

    if (newOffenders.length > 0) {
      const msg =
        "\n[cache-tags] NEW mutation functions missing cache invalidation.\n" +
        "Either add invalidateFor/invalidateForMany to these functions,\n" +
        "or add them to ALLOWLIST in tests/cache-tags.test.ts with a reason:\n\n" +
        newOffenders.map((k) => `  - ${k}`).join("\n") +
        "\n";
      expect.fail(msg);
    }
  });

  it("ALLOWLIST has documented reasons for each entry", () => {
    for (const entry of ALLOWLIST) {
      expect(entry.reason, `${entry.file}::${entry.function} is missing a reason`).toBeTruthy();
    }
  });

  it("ALLOWLIST is ≤15 entries — keep the list tight", () => {
    // If this fails, it means new offenders were added without proper
    // cache invalidation. Either fix them or document a genuine reason.
    expect(ALLOWLIST.length).toBeLessThanOrEqual(15);
    if (ALLOWLIST.length > 0) {
      console.info(
        "\n[cache-tags] Current allowlist (" + ALLOWLIST.length + " entries):\n" +
          ALLOWLIST.map((e) => `  ${e.file}::${e.function}\n    → ${e.reason}`).join("\n"),
      );
    }
  });
});
