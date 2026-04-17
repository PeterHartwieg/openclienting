# Validation Report

## Phase 3 Outcome

Validation completed for the 10 drafted packets in `docs/curated-problem-agent-pack/packets/`.

Decision summary:

- Approved: 9
- Approved with minor fixes: 1
- Rejected: 0

## Packet Decisions

- `curated-sme-a-004-lakeside-cnc-group` — Approved with minor fixes
- `curated-sme-a-005-electric-mirror` — Approved
- `curated-sme-b-001-budgy-smuggler` — Approved
- `curated-sme-b-002-madhus` — Approved
- `curated-sme-b-003-my-wall-panels` — Approved
- `curated-sme-b-004-counter-culture` — Approved
- `curated-sme-b-005-rade-street` — Approved
- `curated-sme-b-006-green-endeavour` — Approved
- `curated-sme-c-001-curantis-solutions` — Approved
- `curated-sme-c-003-healthserve` — Approved

## Findings

### High Severity

None remaining.

### Medium Severity

- Packet: `curated-sme-a-004-lakeside-cnc-group`
  - Severity: medium
  - Affected field: `citations`
  - Reason: the originally cited primary website root URL returned `503` during validation, so it could not remain as a validation-safe citation source.
  - Recommended fix: completed during validation by removing the broken primary citation and relying on the live Zoho case-study source for supported claims.

### Low Severity

None material enough to block Phase 3.

## Validation Checks Performed

- Confirmed SME evidence is present for all 10 packets.
- Confirmed all cited sources are English-language.
- Checked claim-to-source alignment for SME evidence, descriptions, requirements, provider evidence, and pilot-framework fields.
- Confirmed all direct claims carry field-level `citation_refs`.
- Confirmed requirements and pilot-framework content are marked as `inference` where editorially derived.
- Confirmed no packet names a solution provider without source support.
- Checked for obvious duplicate organizations or near-duplicate problem packets in the 10-item set.
- Re-checked cited URLs using live web fetches during validation; after the Lakeside citation cleanup, no cited source URL remained broken in the packet set.

## Gate Assessment

Phase 3 gate: **passed**.

Why it passes:

- 10 packets are now at `approved` or `approved-with-minor-fixes`
- 0 packets have unresolved high-severity findings
- 0 packets use non-English sources
- 0 packets are missing required field-level `citation_refs`
- 0 cited source URLs remain broken after validation fixes

## Next Recommended Move

Proceed to Phase 4 Tag Resolution And Import Prep on the validated 10-packet set.
