# Curation Rubric

## Batch Scope

- Batch type: editorially curated SME problem statements for OpenClienting.org
- Source scope: English-language public sources only
- Authorship model: final packets use `provenance.authored_by_profile: system`
- Content model: imported via `import_curated_problem_v1` as `submitted`; moderation is not bypassed
- Hard rule: no invented facts

## Mandatory Acceptance Criteria

Every candidate that advances from Research into Curation must meet all of the following:

- The problem owner is a real organization with an identifiable website or equivalent public presence.
- SME status is confirmed or strongly evidenced from public information and captured in `problem_owner_organization.sme_evidence`.
- The problem is concrete, operational, and specific enough to structure into the packet schema.
- At least one live public source supports the problem claim.
- All sources used for this batch are in English and every citation records `source_language: en`.
- Any named solution provider is supported by a public source and documented in `solution_provider_organization.provider_evidence`.
- Unsupported details are left blank rather than inferred without support.
- Every direct claim in final packets has field-level `citation_refs`.
- Every inference is explicitly labeled with `source_basis: inference` and explained in `note` or `inference_notes`.

## Packet Schema Expectations

Use `packet-schema.yaml` as written. Do not add fields or change meanings.

Required packet expectations:

- `packet_id`: stable, unique, and reusable for idempotent import.
- `problem_owner_organization`: fully populated for the visible SME; `existing_org_match` stays evidence-based.
- `problem_statement.title`: source-supported and specific; no marketing phrasing.
- `problem_statement.description`: grounded in cited facts and written as a clear business problem.
- `problem_statement.proposed_tags`: concise free-form candidates only; live IDs are resolved later in Phase 4.
- `problem_statement.requirements`: include 3 to 5 requirements, each with `source_basis`, `citation_refs`, and `note` when inferred.
- `problem_statement.pilot_framework`: include all schema subfields and keep claims inside what the platform stores.
- `citations`: every cited source must have URL, title, publisher, source type, language, access date, and evidence note.
- `solution_provider_organization`: set `present: false` unless a provider is publicly named.
- `provenance`: keep `authored_by_profile: system` and `content_origin: curated`.
- `validation.status`: remains workflow-driven; Phase 2 outputs should still be ready for formal validation.

## Preferred Quality Criteria

- Two or more quality sources, with at least one primary source when available.
- A clear implementation context that explains why the problem matters now.
- A pilot framework that is testable, concrete, and credible for an SME.
- Tags that are obvious, consistent, and likely to resolve cleanly in Phase 4.
- Evidence notes that let Validation trace claims quickly without reopening every source in full.

## Reject Or Return For Fixes If

- The organization is clearly not an SME or SME status is too weak to defend.
- The problem is too vague, generic, or marketing-led to convert into a concrete packet.
- The source is non-public, dead, non-English, or too thin to support the claim.
- The packet would require invention to complete required fields.
- A solution provider is named without source support.
- Citations exist at the source list level but are missing at the field level.
- Inferences are presented as direct facts.
- The visible organization would be misrepresented as the `system` profile.

## Phase 1 Exit Gate

Research is ready to hand off only when all of the following are true:

- Combined pool is at least 20 non-duplicate candidates.
- At least 70 percent of candidates include a primary source.
- Zero candidates have dead URLs at submission time.
- One hundred percent of candidate sources are English-language.
- Every candidate row has enough evidence notes for Coordinator or Curation review.

## Batch Acceptance Standard For Downstream Use

Phase 0 is considered execution-ready when:

- this rubric, `packet-schema.yaml`, and `tracking-sheet.csv` align on what researchers must capture
- sector ownership is explicit and low-overlap
- duplicate handling is defined before agents start claiming candidates
- the team understands that a real admin or moderator UUID must be available for `--admin-id` before Phase 4 begins
