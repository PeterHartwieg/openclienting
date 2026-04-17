/**
 * check-hardcoded-strings.mjs
 *
 * Warn-phase static guard that flags hardcoded string literals in localized
 * code paths. Reports JSX text content and JSX attribute values (title,
 * placeholder, alt, aria-label, aria-description) that are NOT inside a call
 * to t(), useTranslations(), or getTranslations().
 *
 * Usage:
 *   node scripts/check-hardcoded-strings.mjs
 *   node scripts/check-hardcoded-strings.mjs --strict   # exit 1 on findings
 *
 * Scopes:
 *   - src/app/[locale]/**\/*.{ts,tsx}
 *   - src/components/moderate/**\/*.{ts,tsx}
 *   - src/components/organizations/**\/*.{ts,tsx}
 *   - src/lib/queries/**\/*.ts
 *
 * Ignores:
 *   - *.test.ts / *.spec.ts files
 *   - Strings ≤ 3 chars
 *   - Purely numeric / whitespace strings
 *   - Strings that are clearly URLs, class names, IDs, route paths
 *   - Strings already inside a t() / useTranslations() / getTranslations() call
 *
 * Add an inline comment to suppress a specific line:
 *   // i18n-ignore: <reason>
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { resolve, relative, extname } from "path";
import { fileURLToPath } from "url";
import { parse } from "@typescript-eslint/typescript-estree";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Scoped directories to scan
// ---------------------------------------------------------------------------
const SCAN_ROOTS = [
  resolve(ROOT, "src/app/[locale]"),
  resolve(ROOT, "src/components/moderate"),
  resolve(ROOT, "src/lib/queries"),
];

// Optional: also scan org components if they exist
const orgComponentsDir = resolve(ROOT, "src/components/organizations");
try {
  statSync(orgComponentsDir);
  SCAN_ROOTS.push(orgComponentsDir);
} catch {
  // directory doesn't exist — skip silently
}

// ---------------------------------------------------------------------------
// JSX attribute names whose VALUES are user-visible strings
// ---------------------------------------------------------------------------
const USER_FACING_ATTRS = new Set([
  "title",
  "placeholder",
  "alt",
  "aria-label",
  "aria-description",
  "aria-placeholder",
]);

// ---------------------------------------------------------------------------
// Patterns to skip — strings matching these are intentional non-UI literals
// ---------------------------------------------------------------------------
const SKIP_PATTERNS = [
  /^https?:\/\//,          // URLs
  /^\//,                   // route paths / CSS classes starting with /
  /^[a-z][a-z-]*$/,         // single lowercase-kebab words (CSS modifiers, slugs)
  /^[A-Z_]+$/,             // ALL_CAPS constants
  /^\d[\d\s.,%-]*$/,       // numbers / numeric formats
  /^\s*$/,                 // whitespace-only
  /^#[0-9a-fA-F]{3,8}$/,  // hex colors
  /^text-|^bg-|^flex|^grid|^p-|^m-|^w-|^h-|^border|^rounded|^space-|^gap-|^items-|^justify-|^font-|^overflow|^cursor-|^pointer-|^z-|^opacity-|^transition|^duration-|^shadow|^ring|^sr-only|^absolute|^relative|^fixed|^sticky/, // Tailwind classes
];

function shouldSkip(str) {
  if (str.length <= 3) return true;
  if (SKIP_PATTERNS.some((re) => re.test(str.trim()))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// AST helpers
// ---------------------------------------------------------------------------

/**
 * Check if a node is inside a call to t(), useTranslations(), or
 * getTranslations().
 */
function isInsideTranslationCall(node, ancestors) {
  for (const ancestor of ancestors) {
    if (
      ancestor.type === "CallExpression" &&
      ancestor.callee
    ) {
      const callee = ancestor.callee;
      // t("key"), t('key')
      if (callee.type === "Identifier" && callee.name === "t") return true;
      // useTranslations("ns"), getTranslations("ns")
      if (
        callee.type === "Identifier" &&
        (callee.name === "useTranslations" || callee.name === "getTranslations")
      ) return true;
      // namespace.t("key") — any member access ending in t
      if (callee.type === "MemberExpression" && callee.property?.name === "t")
        return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Collect findings from one file
// ---------------------------------------------------------------------------
function checkFile(filePath) {
  const src = readFileSync(filePath, "utf8");
  const lines = src.split("\n");
  const findings = [];

  // Check for suppress comments per line.
  // Honour both:
  //   // i18n-ignore: <reason>   (preferred — no ESLint conflict)
  //   // eslint-disable-next-line i18n/no-hardcoded-string  (legacy)
  const suppressedLines = new Set();
  lines.forEach((line, idx) => {
    if (
      line.includes("i18n-ignore") ||
      line.includes("eslint-disable-next-line i18n/no-hardcoded-string")
    ) {
      suppressedLines.add(idx + 2); // 1-based, next line
    }
  });

  let ast;
  try {
    ast = parse(src, {
      jsx: true,
      loc: true,
      range: false,
      tokens: false,
      comment: false,
      errorOnUnknownASTType: false,
    });
  } catch {
    // Parse errors in edge-case files — skip silently
    return findings;
  }

  // Walk the AST collecting ancestors
  function walk(node, ancestors) {
    if (!node || typeof node !== "object") return;

    const nextAncestors = [...ancestors, node];

    // 1. JSX text content: <button>Approve</button>
    if (node.type === "JSXText") {
      const text = node.value.trim();
      if (
        text.length > 0 &&
        !shouldSkip(text) &&
        !isInsideTranslationCall(node, ancestors)
      ) {
        const line = node.loc?.start?.line ?? 0;
        if (!suppressedLines.has(line)) {
          findings.push({ line, text, kind: "JSXText" });
        }
      }
    }

    // 2. JSX attribute values for user-facing attrs
    if (
      node.type === "JSXAttribute" &&
      node.name?.type === "JSXIdentifier" &&
      USER_FACING_ATTRS.has(node.name.name)
    ) {
      const val = node.value;
      // <input placeholder="Hardcoded" />
      if (val?.type === "Literal" && typeof val.value === "string") {
        const text = val.value;
        if (!shouldSkip(text) && !isInsideTranslationCall(node, ancestors)) {
          const line = val.loc?.start?.line ?? 0;
          if (!suppressedLines.has(line)) {
            findings.push({ line, text, kind: `attr:${node.name.name}` });
          }
        }
      }
    }

    // Recurse into all child nodes
    for (const key of Object.keys(node)) {
      if (key === "parent" || key === "loc" || key === "range") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === "object" && item.type) {
            walk(item, nextAncestors);
          }
        }
      } else if (child && typeof child === "object" && child.type) {
        walk(child, nextAncestors);
      }
    }
  }

  walk(ast, []);
  return findings;
}

// ---------------------------------------------------------------------------
// Collect files recursively
// ---------------------------------------------------------------------------
function collectFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = resolve(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      out.push(...collectFiles(full));
    } else {
      const ext = extname(entry);
      if (![".ts", ".tsx"].includes(ext)) continue;
      if (entry.endsWith(".test.ts") || entry.endsWith(".spec.ts")) continue;
      if (entry.endsWith(".test.tsx") || entry.endsWith(".spec.tsx")) continue;
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const strictMode = process.argv.includes("--strict");
let totalFindings = 0;

for (const scanRoot of SCAN_ROOTS) {
  const files = collectFiles(scanRoot);
  for (const file of files) {
    const findings = checkFile(file);
    if (findings.length > 0) {
      const rel = relative(ROOT, file);
      for (const f of findings) {
        console.warn(`[i18n] ${rel}:${f.line}  [${f.kind}]  "${f.text}"`);
        totalFindings++;
      }
    }
  }
}

if (totalFindings === 0) {
  console.log("[i18n] check-hardcoded-strings: no findings. Clean.");
} else {
  console.warn(
    `\n[i18n] check-hardcoded-strings: ${totalFindings} finding(s) in warn mode.`,
  );
  console.warn(
    "[i18n] To suppress a specific line, add a comment above it:",
  );
  console.warn(
    "[i18n]   // i18n-ignore: <reason>",
  );
  if (strictMode) {
    process.exit(1);
  }
}
