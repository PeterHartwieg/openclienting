/**
 * Registry sanity test — prevents CACHE_TAGS from rotting.
 *
 * Two assertions:
 *  1. Every entity that has tags in CACHE_TAGS has at least one tag string
 *     consumed by an unstable_cache() loader in src/lib/queries/**.
 *  2. Every entity key in CACHE_TAGS that is referenced by an invalidateFor()
 *     / invalidateForMany() call in src/ has a non-empty tag list.
 *
 * Intent: if someone adds a new entity to CACHE_TAGS with the wrong tag name,
 * or deletes a loader without removing the tag, this test fails loudly.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { CACHE_TAGS } from "../../src/lib/cache/tags";

const ROOT = resolve(__dirname, "../..");

// ---------------------------------------------------------------------------
// Helpers to collect file contents
// ---------------------------------------------------------------------------
function walkFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...walkFiles(full, ext));
    } else if (entry.endsWith(ext) && !entry.endsWith(".test" + ext)) {
      results.push(full);
    }
  }
  return results;
}

function readAll(files: string[]): string {
  return files.map((f) => readFileSync(f, "utf-8")).join("\n");
}

// ---------------------------------------------------------------------------
// Build ground-truth: tags actually consumed by unstable_cache() loaders
// ---------------------------------------------------------------------------
function extractUnstableCacheTags(source: string): Set<string> {
  const tags = new Set<string>();
  // Match tags arrays inside unstable_cache options objects.
  // Pattern: tags: ["tag1", "tag2", ...]
  const tagsBlockRe = /tags\s*:\s*\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = tagsBlockRe.exec(source)) !== null) {
    const inner = m[1];
    const stringRe = /["']([^"']+)["']/g;
    let sm: RegExpExecArray | null;
    while ((sm = stringRe.exec(inner)) !== null) {
      tags.add(sm[1]);
    }
  }
  return tags;
}

// ---------------------------------------------------------------------------
// Build: entities used in invalidateFor() / invalidateForMany() calls
// ---------------------------------------------------------------------------
function extractUsedEntities(source: string): Set<string> {
  const entities = new Set<string>();
  // Match invalidateFor("entityName") and invalidateForMany(["e1", "e2"])
  const singleRe = /invalidateFor\s*\(\s*["']([^"']+)["']/g;
  const manyRe = /invalidateForMany\s*\(\s*\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;

  while ((m = singleRe.exec(source)) !== null) {
    entities.add(m[1]);
  }
  while ((m = manyRe.exec(source)) !== null) {
    const inner = m[1];
    const stringRe = /["']([^"']+)["']/g;
    let sm: RegExpExecArray | null;
    while ((sm = stringRe.exec(inner)) !== null) {
      entities.add(sm[1]);
    }
  }
  return entities;
}

// ---------------------------------------------------------------------------
// The tests
// ---------------------------------------------------------------------------
describe("CACHE_TAGS registry sanity", () => {
  const queryFiles = walkFiles(join(ROOT, "src", "lib", "queries"), ".ts");
  const querySource = readAll(queryFiles);
  const loaderTags = extractUnstableCacheTags(querySource);

  const srcFiles = walkFiles(join(ROOT, "src"), ".ts");
  const srcSource = readAll(srcFiles);
  const usedEntities = extractUsedEntities(srcSource);

  it("every tag in CACHE_TAGS is consumed by at least one unstable_cache() loader", () => {
    const unusedTags: string[] = [];

    for (const [entity, tags] of Object.entries(CACHE_TAGS)) {
      for (const tag of tags) {
        if (!loaderTags.has(tag)) {
          unusedTags.push(`${entity} → "${tag}" (not found in any unstable_cache tags array)`);
        }
      }
    }

    if (unusedTags.length > 0) {
      expect.fail(
        "\n[cache-tags registry] Tags in CACHE_TAGS with no unstable_cache consumer.\n" +
          "Either add a loader that uses this tag, or remove it from the registry:\n\n" +
          unusedTags.map((t) => `  - ${t}`).join("\n") +
          "\n",
      );
    }
  });

  it("every entity passed to invalidateFor/invalidateForMany has a non-empty tag list", () => {
    const emptyEntities: string[] = [];

    for (const entity of usedEntities) {
      const tags = (CACHE_TAGS as Record<string, readonly string[]>)[entity];
      if (!tags || tags.length === 0) {
        emptyEntities.push(
          `invalidateFor("${entity}") — entity missing from CACHE_TAGS or has no tags`,
        );
      }
    }

    if (emptyEntities.length > 0) {
      expect.fail(
        "\n[cache-tags registry] Entities used in invalidateFor() calls that are missing or empty in CACHE_TAGS.\n" +
          "Add the entity with its correct tags to src/lib/cache/tags.ts:\n\n" +
          emptyEntities.map((e) => `  - ${e}`).join("\n") +
          "\n",
      );
    }
  });
});
