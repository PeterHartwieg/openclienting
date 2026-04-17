# Phase 6 QA Checklist

Batch: curated SME import batch  
Date: 2026-04-17  
Reviewer: Codex QA pass

## Queue And Import Integrity

- `PASS` 10/10 imported packets are present in `problem_templates` with `status = submitted`.
- `PASS` 10/10 imported packets have `content_origin = editorial_curated`.
- `PASS` 10/10 imported packets have a matching `moderation_event` with `action = submitted`, `after_status = submitted`, and `metadata.imported_by = a51cabf5-09f6-4c37-aec3-98024cd06bbc`.
- `PASS` 10/10 imported packets have at least one resolved live tag.

## Organization And Relationship Checks

- `PASS` 10/10 imported packets have a problem-owner organization linked through `author_organization_id`.
- `PASS` 10/10 imported packets that name a provider have `solution_provider_organization_id` populated.
- `PASS` No orphaned owner/provider org references were found in the imported batch.
- `PASS` No duplicate org slugs were found in the imported owner/provider org set.
- `FAIL` The public problem query/render path does not currently expose the linked solution-provider organization, so provider links are correct in the database but not verifiable in the public page UI.

## Citation And Provenance Checks

- `PASS` 10/10 imported packets have normalized `content_citations` rows.
- `PASS` Citation counts are present for every imported problem.
- `FAIL` Field-level packet `citation_refs` do not survive import as field-level links in the current v1 platform model; only normalized problem-level citations are persisted.
- `PASS` Moderation-event provenance retains `packet_id`, `content_origin`, and `imported_by`.

## UI Representation Checks

- `PASS` Public problem pages are filtered to `status = published`, so submitted curated rows are not exposed to anonymous visitors before moderation.
- `PASS` Public problem rendering uses anonymous authorship plus the linked owner organization, so it does not expose the `system` profile as the real-world submitter on the public path.
- `WARN` The moderation queue currently labels imported items as submitted `by OpenClienting Editorial`, which is operationally true but does not foreground the real-world SME on the moderation surface.
- `WARN` The public problem query/render path does not currently expose a curated/editorial badge based on `content_origin`.

## Recommendation

- Publish readiness: `NO`
- Required next step: fix the citation-link persistence gap and provider-org public rendering gap before moderator publish
