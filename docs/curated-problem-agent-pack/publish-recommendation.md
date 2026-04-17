# Publish Recommendation

Recommendation: `reject`

## Decision

Do not publish the current curated batch yet.

The imported rows are structurally sound and the moderation queue is healthy, but Phase 6 does not pass because two workflow-critical expectations are still unmet:

- field-level claim-to-citation links from the editorial packets are not preserved after import
- solution-provider organizations are stored in the database but not surfaced on the public problem path

## Why This Is A Reject Instead Of A Pass With Notes

The workflow for this batch explicitly requires QA to verify:

- citations appear correctly
- field-level claim-to-citation links survive import correctly
- problem-owner and solution-provider org links are correct

The first item passes at a normalized citation-row level. The second does not. The third passes in the database for owners and providers, but providers are not currently verifiable on the public page UI because that relationship is not rendered there.

## Earliest Broken Phase

Re-enter at `Phase 5` for import-model/platform handling, with coordinated frontend follow-through for public rendering.

## Required Fixes Before Moderator Publish

1. Persist field-level citation-link metadata from packet fields through import in a retrievable platform shape.
2. Expose `solution_provider_organization_id` on the public problem query/render path.
3. Re-run QA on the affected batch after those changes.

## Moderator Action

Do not approve/publish the 10 submitted curated problems yet.

If the workflow is followed strictly, moderators should reject the current queue items and the batch should be re-imported after the Phase 5 fixes are in place.
