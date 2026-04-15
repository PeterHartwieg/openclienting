/**
 * Pure, synchronous string helpers used by both the visible page and the
 * JSON-LD / metadata layer. Keep this file free of Next.js and next-intl
 * imports so it can be called from RSC pages, `route.ts` handlers, and
 * pure metadata generators without pulling in any server runtime.
 */

/**
 * Return the first sentence of a string, capped at `maxChars` characters.
 *
 * A "sentence" ends at `. `, `! `, or `? ` — or the equivalent followed by
 * a newline / end of string. If the text contains no sentence boundary
 * before `maxChars`, the string is hard-truncated at a word boundary and
 * suffixed with an ellipsis.
 *
 * Used to derive:
 *   1. The visible answer-ready summary line on problem detail pages.
 *   2. The `<meta description>` on those pages.
 *   3. The `description` field of the Article JSON-LD schema.
 *
 * All three consume the same helper so they stay in lockstep — if the
 * visible text is X, the schema and meta both say X.
 */
export function firstSentence(text: string, maxChars = 200): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const match = normalized.match(/^(.+?[.!?])(\s|$)/);
  const candidate = match ? match[1] : normalized;

  if (candidate.length <= maxChars) return candidate;

  // Hard cap at maxChars on a word boundary.
  const truncated = normalized.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  const cut = lastSpace > maxChars * 0.6 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut}…`;
}
