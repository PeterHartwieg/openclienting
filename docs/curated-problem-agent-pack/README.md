# Curated SME Problem Ingestion Agent Pack

This pack defines a content-operations workflow for adding 10 curated SME problem statements to OpenClienting.org.

## Goal

Deliver 10 well-filled-out problem statements based only on public information and backed by sources.

Each accepted entry must:

- come from an SME
- include at least one public source, ideally two
- include the problem-owner organization as an entity
- include the solution-provider organization as an entity if publicly named
- avoid any invented facts

## Content Model

This is editorially curated content, not user-generated content. Consequences:

- the `system` profile (UUID `00000000-0000-0000-0000-000000000001`, `is_publicly_anonymous=true`) is used for all non-user-created content
- content is imported as `submitted` via `import_curated_problem_v1` — the moderation lifecycle is NOT bypassed
- the RPC writes a `moderation_event` row for each import; moderators publish via the existing `moderate_item_v1` RPC
- the `system` profile administers accountless organizations; the visible org entity remains the real SME
- no batch is imported to the live site before QA sign-off; `submitted` rows are non-public by default

Source scope for this batch:

- English-language sources only
- no packet-level `locale` field is needed for v1
- each citation still records `source_language`

## Guardrails

The `system` profile is an operational identity, not a fake company owner.

Agents must preserve:

- the real organization as the visible organization entity
- the public source URL(s)
- evidence notes showing where each claim came from
- a clear distinction between sourced facts and editorial inference

Agents must not:

- imply that the `system` profile is the real-world representative of the organization
- create user-facing copy that suggests an account holder personally submitted the record
- fill unsupported fields just to make a packet look complete
- attribute statements to named natural persons unless those persons are public spokespeople speaking in their professional capacity

## Recommended Agent Topology

Use these roles:

1. Coordinator
2. Research Agent A
3. Research Agent B
4. Research Agent C
5. Curation Agent
6. Validation Agent
7. Import Agent
8. QA Agent

## Phase Workflow

See [workflow.md](./workflow.md) for the authoritative phase definitions and gate criteria. Summary:

- Phase 0 - Coordinator Setup
- Phase 1 - Parallel Research
- Phase 2 - Curation
- Phase 3 - Validation
- Phase 4 - Tag Resolution And Import Prep
- Phase 5 - Import (lands as `submitted`)
- Phase 6 - QA And Moderator Publish

## Required Shared Artifacts

- `curation-rubric.md`
- `sector-assignments.md`
- `tracking-sheet.csv`
- `packet-schema.yaml`
- `validation-checklist.md`
- `tag-resolution.csv`
- `final-acceptance-report.md`

## Suggested Research Sector Split

- Research Agent A: manufacturing and logistics SMEs
- Research Agent B: retail, hospitality, and food SMEs
- Research Agent C: healthcare, education, and professional-services SMEs

## Definition Of Done

A packet is ready only if it includes:

- confirmed or strongly evidenced SME status
- at least one live public source
- English-language sources only for v1
- a concrete problem statement
- a strong description
- 3 to 5 requirements
- a pilot framework with at least scope, KPIs, success criteria, and resource commitment, limited to subfields the platform can store according to the operator guide
- proposed free-form tag names
- resolved live tags before import
- organization data for the problem owner
- solution-provider organization data if publicly named
- field-level citation references for SME evidence, description, requirements, provider evidence, and any direct pilot-framework claims
- explicit inference notes for anything not directly stated

## File Guide

- [workflow.md](./workflow.md)
- [coordinator.md](./coordinator.md)
- [research-agent.md](./research-agent.md)
- [curation-agent.md](./curation-agent.md)
- [validation-agent.md](./validation-agent.md)
- [import-agent.md](./import-agent.md)
- [qa-agent.md](./qa-agent.md)
