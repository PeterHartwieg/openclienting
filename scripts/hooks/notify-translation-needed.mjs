#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook.
 * Wired in .claude/settings.json under PostToolUse → "Edit|Write".
 *
 * Reads the standard hook payload on stdin, checks whether the modified
 * file is `src/messages/en.json`, and if so emits a system reminder
 * telling Claude to run the translation gap-fill script.
 *
 * Always exits 0 so it never blocks tool calls. Silent on non-matching
 * files (no output → no context injection).
 */

let raw = "";
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  const filePath =
    payload?.tool_input?.file_path ?? payload?.tool_response?.filePath ?? "";
  // Normalise to forward slashes so the regex works on both Windows and
  // POSIX paths.
  const normalised = String(filePath).replace(/\\/g, "/");
  if (!/\/src\/messages\/en\.json$/.test(normalised)) {
    process.exit(0);
  }
  const reminder = {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        "src/messages/en.json was just modified. Before ending the turn, run `node scripts/translate-messages.mjs` to gap-fill the other 29 locales. The script auto-detects what changed, skips up-to-date locales, and usually finishes in well under a minute when only a few keys are new.",
    },
  };
  process.stdout.write(JSON.stringify(reminder));
  process.exit(0);
});
