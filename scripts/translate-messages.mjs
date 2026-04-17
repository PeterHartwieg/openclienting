/**
 * Generates src/messages/{locale}.json by translating en.json into every
 * supported locale.
 *
 * Two backends, auto-selected:
 *   1. Anthropic SDK     — used when ANTHROPIC_API_KEY is set in the env or
 *                          .env.local. Fast, billed per-token.
 *   2. Claude Code CLI   — fallback. Spawns `claude -p` per request, using
 *                          your Claude Code subscription auth. No API key
 *                          needed. Slightly slower, billed against the
 *                          subscription's session/rate limits.
 *
 * Usage:
 *   node scripts/translate-messages.mjs                # gap-fill mode
 *   node scripts/translate-messages.mjs --locale fr
 *   node scripts/translate-messages.mjs --locale fr,es,ja
 *   node scripts/translate-messages.mjs --full         # force full retranslate
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-messages.mjs
 *
 * Default behavior is **gap-fill**: if a locale file already exists, the
 * script diffs it against en.json and asks Claude to translate ONLY the
 * keys that are missing, then merges them in. Existing translations are
 * preserved. Pass --full to force a complete retranslation that overwrites
 * the file (useful when you want the model to re-do everything in a
 * consistent voice).
 *
 * Processes locales in parallel batches of 5.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load .env.local for ANTHROPIC_API_KEY if not already set
// ---------------------------------------------------------------------------
if (!process.env.ANTHROPIC_API_KEY) {
  const envPath = resolve(ROOT, ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const m = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
      if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
    }
  }
}

// ---------------------------------------------------------------------------
// Backend selection — API key wins; CLI fallback otherwise.
// The SDK import is done lazily so installs without @anthropic-ai/sdk still
// work via the CLI path.
// ---------------------------------------------------------------------------
const USE_API = !!process.env.ANTHROPIC_API_KEY;

let apiClient = null;
if (USE_API) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  apiClient = new Anthropic();
}

console.log(
  USE_API
    ? "Backend: Anthropic SDK (ANTHROPIC_API_KEY detected)"
    : "Backend: Claude Code CLI (no ANTHROPIC_API_KEY; using subscription auth)",
);

/**
 * Send a prompt via the Claude Code CLI (`claude -p`). The prompt is piped
 * through stdin because translation prompts are ~13 KB and would blow past
 * argv length limits on Windows. Tools are disabled (`--tools ""`) so the
 * subprocess can't accidentally edit files; slash commands are disabled to
 * avoid surprise skill invocations.
 */
function callClaudeCli(prompt) {
  return new Promise((resolve, reject) => {
    // Use the platform-specific binary name so we can spawn without
    // shell:true (which triggers a Node deprecation warning and isn't
    // needed once the executable is unambiguous).
    const cmd = process.platform === "win32" ? "claude.exe" : "claude";
    const proc = spawn(
      cmd,
      [
        "-p",
        "--model",
        "sonnet",
        "--tools",
        "",
        "--disable-slash-commands",
        "--output-format",
        "text",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    proc.stderr.on("data", (d) => (stderr += d.toString("utf8")));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(`claude CLI exited ${code}\nstderr:\n${stderr.trim()}`),
        );
      } else {
        resolve(stdout);
      }
    });
    proc.stdin.end(prompt, "utf8");
  });
}

async function callClaude(prompt) {
  if (USE_API) {
    const message = await apiClient.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16384,
      messages: [{ role: "user", content: prompt }],
    });
    return message.content[0].text;
  }
  return callClaudeCli(prompt);
}

// ---------------------------------------------------------------------------
// All 30 supported locales (code → English name)
// ---------------------------------------------------------------------------
const ALL_LOCALES = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  hi: "Hindi",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  ko: "Korean",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian (Bokmål)",
  fi: "Finnish",
  cs: "Czech",
  el: "Greek",
  he: "Hebrew",
  hu: "Hungarian",
  ro: "Romanian",
  uk: "Ukrainian",
  vi: "Vietnamese",
  id: "Indonesian",
  th: "Thai",
  bn: "Bengali",
  sw: "Swahili",
};

// Locales that already have complete translation files — skip by default.
// Only English is skipped (it's the source). German used to be hand-
// maintained and skipped here; it's now part of the auto-translated set
// so new keys don't drift out of sync.
const SKIP_BY_DEFAULT = new Set(["en"]);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const localeArg = args.find((a) => a.startsWith("--locale="))?.split("=")[1]
  ?? args[args.indexOf("--locale") + 1];
const fullMode = args.includes("--full");

let targetLocales;
if (localeArg) {
  targetLocales = localeArg.split(",").map((l) => l.trim()).filter(Boolean);
  const unknown = targetLocales.filter((l) => !ALL_LOCALES[l]);
  if (unknown.length) {
    console.error(`Unknown locale(s): ${unknown.join(", ")}`);
    process.exit(1);
  }
} else {
  targetLocales = Object.keys(ALL_LOCALES).filter((l) => !SKIP_BY_DEFAULT.has(l));
}

// ---------------------------------------------------------------------------
// Load English source
// ---------------------------------------------------------------------------
const enPath = resolve(ROOT, "src/messages/en.json");
const enMessages = JSON.parse(readFileSync(enPath, "utf8"));
const enJson = JSON.stringify(enMessages, null, 2);

// ---------------------------------------------------------------------------
// Flatten / unflatten — used by gap-fill mode to diff against the existing
// locale file and merge translations back without disturbing untouched keys.
// Arrays are leaf values (we don't recurse into them), which matches the
// shape of next-intl message files.
// ---------------------------------------------------------------------------
function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

function setDeep(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// Reorder `target` to match the key order of `template` (en.json) so diffs
// stay clean even after a gap-fill merge.
function reorderLike(template, target) {
  if (template === null || typeof template !== "object" || Array.isArray(template)) {
    return target;
  }
  const out = {};
  for (const key of Object.keys(template)) {
    if (key in target) {
      out[key] = reorderLike(template[key], target[key]);
    }
  }
  // Preserve any extra keys present in target but absent from template, at
  // the end. (Shouldn't happen in practice, but defensive.)
  for (const key of Object.keys(target)) {
    if (!(key in out)) out[key] = target[key];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Translation prompts
// ---------------------------------------------------------------------------
function buildPrompt(locale, englishName) {
  return `You are a professional localisation engineer. Translate the following Next.js i18n JSON message file from English into ${englishName} (locale code: "${locale}").

STRICT RULES — follow every rule exactly:
1. Return ONLY valid JSON. No markdown, no code fences, no explanations.
2. Preserve ALL JSON keys exactly as-is. Never translate or rename keys.
3. Preserve ALL ICU MessageFormat patterns character-for-character:
   - Placeholders like {name}, {date}, {count} — keep the variable name.
   - Plural selectors like {count, plural, =0 {…} one {…} other {…}} — keep the ICU syntax and keywords (plural, =0, one, other); only translate the human-readable text inside the curly braces.
   - Select selectors like {status, select, …} — same rule.
4. Do NOT translate these specific strings (keep them in English / their original form):
   - "OpenClienting" (brand name)
   - "GitHub" (brand name)
   - "Google Tag Manager" (brand name)
   - "Google Analytics" (brand name)
   - "Google Analytics 4" (brand name)
   - "CC BY-SA 4.0" (license identifier)
   - "Impressum" (German legal term, keep as-is in all locales)
   - "you@example.com" (example email placeholder)
   - "SME" / "SMEs" (industry acronym — keep as-is)
   - URL slugs in help text (e.g. "my-new-article")
   - "Q: ... A: ..." format hints
   - "PKCE", "RFP" (technical/acronym terms)
5. For ${locale === "zh" ? "Chinese" : locale === "ja" ? "Japanese" : locale === "ko" ? "Korean" : "this language"}, use natural, professional business language appropriate for a B2B SaaS platform.
6. Preserve the exact same JSON structure and key order as the input.
7. Numbers, punctuation characters used as separators, and HTML entities (like &mdash;) should remain as-is.

INPUT JSON:
${enJson}`;
}

// Gap-fill prompt: given a flat map of dotted-path → English string, ask
// for a JSON object with the same dotted-path keys mapped to translations.
// Much smaller payload than the full file, so verbose locales don't risk
// hitting the response token cap.
function buildGapFillPrompt(locale, englishName, missingFlat) {
  return `You are a professional localisation engineer. Translate the following message strings into ${englishName} (locale code: "${locale}") for a B2B SaaS platform.

STRICT RULES — follow every rule exactly:
1. Return ONLY valid JSON. No markdown, no code fences, no explanations.
2. The JSON must be a flat object keyed by the EXACT dotted paths shown below. Do NOT nest, do NOT rename, do NOT drop any keys.
3. Preserve ALL ICU MessageFormat patterns character-for-character:
   - Placeholders like {name}, {date}, {count} — keep the variable name.
   - Plural selectors like {count, plural, =0 {…} one {…} other {…}} — keep the ICU syntax and keywords (plural, =0, one, other); only translate the human-readable text inside the curly braces.
   - Select selectors like {status, select, …} — same rule.
4. Do NOT translate these specific strings (keep them in English / their original form):
   - "OpenClienting" (brand name)
   - "GitHub" (brand name)
   - "Google Tag Manager" (brand name)
   - "Google Analytics" (brand name)
   - "Google Analytics 4" (brand name)
   - "CC BY-SA 4.0" (license identifier)
   - "Impressum" (German legal term, keep as-is in all locales)
   - "you@example.com" (example email placeholder)
   - "SME" / "SMEs" (industry acronym — keep as-is)
   - URL slugs in help text (e.g. "my-new-article")
   - "Q: ... A: ..." format hints
   - "PKCE", "RFP" (technical/acronym terms)
5. Use natural, professional business language appropriate for ${englishName}.
6. Numbers, punctuation characters used as separators, and HTML entities (like &mdash;) should remain as-is.
7. Escape any inner double quotes inside string values as \\". Do NOT leave bare " characters inside a string value — they will break JSON parsing. If the source uses quotes for emphasis, prefer the locale's native quotation marks (e.g. „…" in German, « … » in French, “…” in English-style, 「…」 in CJK) or escape them as \\".

INPUT (English source, flat object):
${JSON.stringify(missingFlat, null, 2)}`;
}

function parseClaudeJson(raw, locale, outPath) {
  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error(`  [${locale}] ⚠  JSON parse failed — writing raw output to ${locale}.raw.txt`);
    writeFileSync(outPath.replace(".json", ".raw.txt"), raw, "utf8");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Translate one locale — gap-fill if existing file present, full otherwise
// ---------------------------------------------------------------------------
async function translateLocale(locale) {
  const englishName = ALL_LOCALES[locale];
  const outPath = resolve(ROOT, `src/messages/${locale}.json`);
  const exists = existsSync(outPath);

  if (exists && !fullMode) {
    // Gap-fill: figure out which keys are missing, translate just those.
    const existing = JSON.parse(readFileSync(outPath, "utf8"));
    const enFlat = flatten(enMessages);
    const existingFlat = flatten(existing);
    const missingFlat = {};
    for (const [key, value] of Object.entries(enFlat)) {
      if (!(key in existingFlat)) missingFlat[key] = value;
    }
    const missingCount = Object.keys(missingFlat).length;
    if (missingCount === 0) {
      console.log(`  [${locale}] ✓ Already up to date, skipping`);
      return;
    }
    console.log(`  [${locale}] Gap-fill: ${missingCount} missing key(s) → ${englishName}…`);

    const raw = (
      await callClaude(buildGapFillPrompt(locale, englishName, missingFlat))
    ).trim();
    const translatedFlat = parseClaudeJson(raw, locale, outPath);

    // Defensive: only merge keys we asked for, skip anything extra.
    const merged = JSON.parse(JSON.stringify(existing));
    let mergedCount = 0;
    for (const key of Object.keys(missingFlat)) {
      if (key in translatedFlat) {
        setDeep(merged, key, translatedFlat[key]);
        mergedCount++;
      }
    }
    if (mergedCount < missingCount) {
      console.warn(
        `  [${locale}] ⚠  model returned ${mergedCount}/${missingCount} keys; missing ones stay English fallback`,
      );
    }

    const reordered = reorderLike(enMessages, merged);
    writeFileSync(outPath, JSON.stringify(reordered, null, 2) + "\n", "utf8");
    console.log(`  [${locale}] ✓ Merged ${mergedCount} key(s) into src/messages/${locale}.json`);
    return;
  }

  // Full translation (no existing file, or --full passed)
  console.log(`  [${locale}] Full translation → ${englishName}…`);
  const raw = (await callClaude(buildPrompt(locale, englishName))).trim();
  const parsed = parseClaudeJson(raw, locale, outPath);
  writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  console.log(`  [${locale}] ✓ Written to src/messages/${locale}.json`);
}

// ---------------------------------------------------------------------------
// Process in parallel batches of 5. allSettled so one bad locale doesn't
// abort the whole run; failures are reported in the summary.
// ---------------------------------------------------------------------------
async function runBatch(batch) {
  const results = await Promise.allSettled(batch.map(translateLocale));
  const failures = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failures.push({ locale: batch[i], error: r.reason });
    }
  });
  return failures;
}

async function main() {
  console.log(`\nTranslating UI messages into ${targetLocales.length} locale(s):`);
  console.log(`  ${targetLocales.join(", ")}\n`);

  const allFailures = [];
  const BATCH_SIZE = 5;
  for (let i = 0; i < targetLocales.length; i += BATCH_SIZE) {
    const batch = targetLocales.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`);
    const failures = await runBatch(batch);
    allFailures.push(...failures);
    console.log();
  }

  if (allFailures.length === 0) {
    console.log("Done. All locales succeeded.");
  } else {
    console.log(`Done with ${allFailures.length} failure(s):`);
    for (const { locale, error } of allFailures) {
      console.log(`  - ${locale}: ${error?.message ?? error}`);
    }
    console.log(
      `\nRe-run with --locale=${allFailures.map((f) => f.locale).join(",")} to retry just the failures.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
