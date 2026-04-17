# Import Plan

## Scope

Validated packet set targeted for import:

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

Confirmed audit-trail admin ID for later import steps:

- `a51cabf5-09f6-4c37-aec3-98024cd06bbc`

## Tag Resolution Status

Tag resolution is now backed by live IDs from the hosted project `wruzfhglslxgjxmbguwd`, and those mappings are recorded in `tag-resolution.csv`.

Live tags retrieved during Phase 4:

- `manufacturing` → `b62612f5-4cb2-4a26-aa5c-a10edd416374`
- `retail` → `6ddafadc-942e-4b42-a05b-9b7c3adbdd52`
- `healthcare` → `4a38b7b8-5af8-413a-a3aa-9563598ebe08`
- `operations` → `7facd157-fd0a-4e75-9fda-53cc3e8c336a`
- `it` → `c0ac22e3-d753-4c96-807d-e646c3a4672c`
- `finance` → `101a20de-f7ba-4988-ae4e-88f46ca1c33e`
- `efficiency` → `97a2cec3-d2d0-499b-9348-7a761f95670c`
- `compliance` → `9e24245f-8c27-43c5-b82c-9bf711f0970d`
- `visibility` → `02bb6ae2-908c-4990-9222-b62b9ea5df5a`

Deferred proposed tags remain documented where no exact live taxonomy tag exists.

## Payload Conversion Status

The validated YAML packets have now been converted into the JSON payload shape expected by `scripts/import-curated-content.mjs`.

Generated payload directory:

- `docs/curated-problem-agent-pack/import-payloads/`

Converter script:

- `scripts/convert-curated-packets.mjs`

What the converter does:

- reads validated packet YAML from `docs/curated-problem-agent-pack/packets/`
- reads resolved live tag IDs from `tag-resolution.csv`
- writes one import-ready JSON payload per packet
- flattens pilot framework fields into the RPC payload shape
- carries citations into the import payload with `is_sourced_fact` flags
- omits deferred tag proposals from `problem.tag_ids` while leaving the deferrals documented in `tag-resolution.csv`

Prepared import command shape for the next dry run:

```bash
SUPABASE_URL=https://wruzfhglslxgjxmbguwd.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  node scripts/import-curated-content.mjs \
    --dir=docs/curated-problem-agent-pack/import-payloads \
    --admin-id=a51cabf5-09f6-4c37-aec3-98024cd06bbc \
    --dry-run
```

## Provider Organization Status

The import path has been extended to accept a nullable `solution_provider_org` payload object and persist its resolved organization ID on `problem_templates.solution_provider_organization_id`.

Implementation status:

- schema migration added: `supabase/migrations/20260418001500_curated_import_provider_orgs.sql`
- import RPC extended: `import_curated_problem_v1` now resolves and stores provider organizations
- converter updated: generated payloads now include `solution_provider_org` when the packet contains a public source-supported provider
- import script updated: `scripts/import-curated-content.mjs` forwards `solution_provider_org` to the RPC

Remaining note:

- the linked database migration stack through `20260418001500` has been applied, so provider-org persistence is now available for dry run and import

## Ready Decisions

The following work is ready:

- the 10-packet validated import set is fixed
- tag decisions are mapped to live tag UUIDs in `tag-resolution.csv`
- import payload JSON files have been generated in `docs/curated-problem-agent-pack/import-payloads/`
- duplicate-risk review across the 10 packets is clean at the organization level
- `--admin-id` is confirmed for audit trail use

## Next Recommended Move

Phase 5 is complete.

The 10 validated packets were dry-run checked, imported successfully with `--admin-id a51cabf5-09f6-4c37-aec3-98024cd06bbc`, and re-run idempotently with 10 `already_imported` results and 0 errors.

Next phase:

1. Reuse the imported rows in moderation QA.
2. Verify each row remains `submitted` in the moderation queue.
3. Proceed to moderator publish when QA is satisfied.
