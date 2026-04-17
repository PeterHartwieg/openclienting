# Workflow

## Content Model

This pipeline produces editorially curated content, not user-generated content.

- The `system` profile (UUID `00000000-0000-0000-0000-000000000001`, `is_publicly_anonymous=true`) is used for all non-user-created content
- Content is imported as `submitted` via the `import_curated_problem_v1` RPC — the moderation lifecycle is NOT bypassed
- The RPC writes a `moderation_event` row for each import; moderators publish via the existing `moderate_item_v1` RPC
- Authorship is `system`; the visible organization entity remains the real SME
- No batch is imported to the live site before QA sign-off
- Imported rows land as `submitted` and are not rendered to anonymous users — no separate non-public environment is required

Sources: English-language sources only for this batch. No `locale` field in the packet.

## Phase 0: Coordinator Setup

Owner: Coordinator

Tasks:

- finalize the curation rubric
- define acceptance criteria
- assign sector slices
- create the shared tracker
- confirm duplicate prevention process
- confirm the operator guide (`platform-ingestion-spec.md`) and import path for the already-implemented `system` profile are available
- confirm that an admin or moderator UUID is available for the `--admin-id` flag on the import script (required for the audit trail)

Outputs:

- `curation-rubric.md`
- `sector-assignments.md`
- `tracking-sheet.csv`

Gate (all must pass):

- rubric, packet schema, and tracker are agreed
- operator guide (`platform-ingestion-spec.md`) and import path are available
- admin or moderator UUID for `--admin-id` is confirmed

## Phase 1: Parallel Research

Owner: Research Agents

Tasks:

- find 8 to 12 candidate SMEs each in assigned sectors
- collect source URLs and evidence notes
- capture named solution providers when publicly documented
- flag weak or ambiguous candidates

Outputs:

- one candidate CSV per research agent
- one notes file per research agent

Gate (all must pass):

- combined pool >= 20 non-duplicate candidates
- >= 70% of candidates have at least one primary source
- 0 candidates with dead URLs at submission time
- 100% of candidate sources are in English

## Phase 2: Curation

Owner: Curation Agent

Tasks:

- pick the best 10 candidates from the approved pool
- write final platform-ready packets
- keep all unsupported facts out
- label every inference explicitly

Outputs:

- 10 packet files following `packet-schema.yaml`

Gate (all must pass):

- every packet conforms to the schema and is self-contained
- >= 70% of packets carry 2+ sources
- 0 packets name a solution provider without source support
- 0 packets quote or attribute statements to named individuals outside their professional spokesperson capacity
- every direct claim has field-level `citation_refs`

## Phase 3: Validation

Owner: Validation Agent

Tasks:

- verify SME eligibility
- verify source quality and claim-to-source alignment
- verify provider attribution
- identify duplicates or thin entries

Outputs:

- `validation-report.md`
- annotated packets with status

Gate (all must pass):

- 10 packets reach `approved` or `approved-with-minor-fixes`
- 0 packets with unresolved `severity: high` findings
- 0 broken source URLs
- 0 packets missing required `citation_refs`
- 0 packets using non-English sources

## Phase 4: Tag Resolution And Import Prep

Owner: Import Agent

Tasks:

- resolve each packet's `proposed_tags` against the live taxonomy
- record accepted mappings and exclusions in `tag-resolution.csv`
- annotate each packet with resolved live tag IDs before import
- flag any missing taxonomy coverage to the coordinator
- verify importable field coverage against the operator guide
- prepare the import plan

Outputs:

- `tag-resolution.csv`
- updated packet files with resolved live tag IDs
- `import-plan.md`

Gate (all must pass):

- every proposed tag is marked `resolved`, `excluded`, or `deferred`
- every packet has at least one resolved live tag
- 0 unresolved tag decisions remain before import

## Phase 5: Import

Owner: Import Agent

Tasks:

- dry-run first; produce a preview diff before any write
- import into the real database using `import_curated_problem_v1` with `--admin-id` set to the confirmed admin or moderator UUID
- rows land as `submitted` (not public) and a `moderation_event` row is written by the RPC for each problem
- create or match organizations under `system` administration
- preserve source metadata and provenance

Outputs:

- `import-plan.md`
- `import-preview.csv`
- `post-import-report.md`

Gate (all must pass):

- dry run produces 0 duplicate-org creations
- import is idempotent: re-running the RPC on the same `packet_id` produces 0 new rows
- all imported rows appear in the moderation queue as `submitted`

## Phase 6: QA And Moderator Publish

Owner: QA Agent (QA tasks); Moderators (publish tasks)

Tasks:

- verify all imported records appear in the moderation queue as `submitted`
- verify problem-owner and solution-provider org links
- verify citations appear correctly
- verify field-level claim-to-citation links survive import correctly
- verify the UI does not misrepresent `system` as the real-world submitter
- verify content quality consistency
- if QA passes, moderators publish each problem via `moderate_item_v1` from the moderation queue
- if QA fails, moderators reject the queue items; re-enter Phase 2, 4, or 5 as appropriate
- coordinator signs final acceptance after moderator publish

Outputs:

- `qa-checklist.md`
- `qa-findings.md`
- `publish-recommendation.md`
- `final-acceptance-report.md`

Gate (all must pass):

- 10/10 packets appear in the moderation queue without error
- 0 orphaned relationships, 0 duplicate orgs, 0 broken slugs
- coordinator signs off for moderator publish
- on rejection, moderators reject the queue items and coordinator re-enters the earliest broken phase
