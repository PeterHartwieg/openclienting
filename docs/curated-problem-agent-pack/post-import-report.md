# Post Import Report

Phase 5 import succeeded for the curated SME batch.

## Results

- Imported packet count: `10`
- Already imported on first live run: `0`
- Errors on first live run: `0`
- Idempotency rerun: `10 already_imported`, `0 new rows`, `0 errors`

## Imported Packets

- `curated-sme-a-004-lakeside-cnc-group`
- `curated-sme-a-005-electric-mirror`
- `curated-sme-b-001-budgy-smuggler`
- `curated-sme-b-002-madhus`
- `curated-sme-b-003-my-wall-panels`
- `curated-sme-b-004-counter-culture`
- `curated-sme-b-005-rade-street`
- `curated-sme-b-006-green-endeavour`
- `curated-sme-c-001-curantis-solutions`
- `curated-sme-c-003-healthserve`

## Notes

- Rows land as `submitted` and remain in the moderation queue.
- The import RPC writes a `moderation_event` row for each problem.
- A moderator still needs to publish each imported row via `moderate_item_v1`.
- The dry run matched the import payload shape before the live write.
