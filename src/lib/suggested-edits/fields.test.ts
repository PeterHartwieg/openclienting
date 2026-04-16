/**
 * Tests for the suggested-edit field allowlist.
 *
 * Scope: `filterEditableDiff` must retain only fields listed in
 * `EDITABLE_FIELDS[targetType]` and report every rejected key in
 * `droppedKeys`. This is the single chokepoint that prevents a
 * malicious suggested edit from rewriting columns like `status`,
 * `author_id`, or `author_organization_id` on moderator approval.
 *
 * Run with Node's built-in test runner:
 *   node --test --experimental-strip-types src/lib/suggested-edits/fields.test.ts
 */

import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  EDITABLE_FIELDS,
  filterEditableDiff,
  isEditTargetType,
} from "./fields.ts";
import type { EditDiff } from "../types/database.ts";

describe("filterEditableDiff", () => {
  it("keeps allowlisted fields and drops the rest", () => {
    const diff: EditDiff = {
      title: { old: "A", new: "B" },
      description: { old: "x", new: "y" },
      status: { old: "submitted", new: "published" },
      author_id: { old: "u1", new: "u2" },
    };
    const { filtered, droppedKeys } = filterEditableDiff(
      "problem_template",
      diff,
    );
    assert.deepEqual(Object.keys(filtered).sort(), ["description", "title"]);
    assert.deepEqual(droppedKeys.sort(), ["author_id", "status"]);
  });

  it("returns an empty filtered object when every key is rejected", () => {
    const diff: EditDiff = {
      upvote_count: { old: "0", new: "999" },
      author_organization_id: { old: null, new: "spoofed" },
    };
    const { filtered, droppedKeys } = filterEditableDiff(
      "solution_approach",
      diff,
    );
    assert.deepEqual(filtered, {});
    assert.deepEqual(droppedKeys.sort(), [
      "author_organization_id",
      "upvote_count",
    ]);
  });

  it("passes through an all-allowlisted diff unchanged", () => {
    const diff: EditDiff = {
      body: { old: "old body", new: "new body" },
    };
    const { filtered, droppedKeys } = filterEditableDiff("requirement", diff);
    assert.deepEqual(filtered, diff);
    assert.deepEqual(droppedKeys, []);
  });

  it("handles every declared target type without crashing", () => {
    for (const targetType of Object.keys(EDITABLE_FIELDS)) {
      const diff: EditDiff = { bogus_field: { old: "a", new: "b" } };
      const { filtered, droppedKeys } = filterEditableDiff(
        targetType as keyof typeof EDITABLE_FIELDS,
        diff,
      );
      assert.deepEqual(filtered, {});
      assert.deepEqual(droppedKeys, ["bogus_field"]);
    }
  });
});

describe("isEditTargetType", () => {
  it("accepts each declared target type", () => {
    for (const t of Object.keys(EDITABLE_FIELDS)) {
      assert.equal(isEditTargetType(t), true);
    }
  });

  it("rejects strings that aren't declared target types", () => {
    assert.equal(isEditTargetType("profiles"), false);
    assert.equal(isEditTargetType(""), false);
    assert.equal(isEditTargetType("organization"), false);
  });
});

describe("EDITABLE_FIELDS invariants", () => {
  it("never allows columns that grant privilege escalation", () => {
    const forbidden = new Set([
      "status",
      "author_id",
      "author_organization_id",
      "upvote_count",
      "verification_status",
      "role",
      "id",
    ]);
    for (const [targetType, fields] of Object.entries(EDITABLE_FIELDS)) {
      for (const field of fields) {
        assert.equal(
          forbidden.has(field),
          false,
          `${targetType}.${field} must not be editable`,
        );
      }
    }
  });
});
