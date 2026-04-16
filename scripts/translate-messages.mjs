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
 *   node scripts/translate-messages.mjs
 *   node scripts/translate-messages.mjs --locale fr
 *   node scripts/translate-messages.mjs --locale fr,es,ja
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-messages.mjs
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
const SKIP_BY_DEFAULT = new Set(["en", "de"]);

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const localeArg = args.find((a) => a.startsWith("--locale="))?.split("=")[1]
  ?? args[args.indexOf("--locale") + 1];

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
// Translation prompt
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

// ---------------------------------------------------------------------------
// Translate one locale
// ---------------------------------------------------------------------------
async function translateLocale(locale) {
  const englishName = ALL_LOCALES[locale];
  const outPath = resolve(ROOT, `src/messages/${locale}.json`);

  console.log(`  [${locale}] Translating into ${englishName}…`);

  const raw = (await callClaude(buildPrompt(locale, englishName))).trim();

  // Strip accidental markdown fences if the model added them
  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error(`  [${locale}] ⚠  JSON parse failed — writing raw output to ${locale}.raw.txt`);
    writeFileSync(outPath.replace(".json", ".raw.txt"), raw, "utf8");
    throw err;
  }

  writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  console.log(`  [${locale}] ✓ Written to src/messages/${locale}.json`);
}

// ---------------------------------------------------------------------------
// Process in parallel batches of 5
// ---------------------------------------------------------------------------
async function runBatch(batch) {
  await Promise.all(batch.map(translateLocale));
}

async function main() {
  console.log(`\nTranslating UI messages into ${targetLocales.length} locale(s):`);
  console.log(`  ${targetLocales.join(", ")}\n`);

  const BATCH_SIZE = 5;
  for (let i = 0; i < targetLocales.length; i += BATCH_SIZE) {
    const batch = targetLocales.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`);
    await runBatch(batch);
    console.log();
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
