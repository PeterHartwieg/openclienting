# QA Findings

## Severity: High

### 1. Field-level citation links are lost during import

Phase 6 requires field-level claim-to-citation links to survive import, but the current v1 import path only preserves normalized problem-level citations. The import mapping explicitly flattens textual fields and does not carry packet `citation_refs` into the payload or database model, and the RPC only inserts `content_citations` rows at the problem level. This means editorial packets remain well-sourced before import, but the platform cannot reconstruct which claim was supported by which citation after import.  
References:
- [platform-ingestion-spec.md](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/docs/curated-problem-agent-pack/platform-ingestion-spec.md:352)
- [platform-ingestion-spec.md](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/docs/curated-problem-agent-pack/platform-ingestion-spec.md:360)
- [convert-curated-packets.mjs](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/scripts/convert-curated-packets.mjs:181)
- [20260418001900_enforce_iso_access_dates.sql](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/supabase/migrations/20260418001900_enforce_iso_access_dates.sql:181)
- [20260418001900_enforce_iso_access_dates.sql](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/supabase/migrations/20260418001900_enforce_iso_access_dates.sql:230)

## Severity: Medium

### 2. Solution-provider organizations are stored but not shown on public problem pages

The imported rows correctly populate `solution_provider_organization_id`, but the public problem queries only join the owner organization and the problem hero only accepts one organization row. That means provider provenance is present in the database yet not exposed on the public problem page, so QA cannot verify those links through the intended UI.  
References:
- [problems.ts](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/lib/queries/problems.ts:299)
- [problem-hero.tsx](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/components/problems/problem-hero.tsx:26)
- [problem-hero.tsx](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/components/problems/problem-hero.tsx:84)

### 3. Moderation queue labels curated imports as submitted by the system profile

This does not affect the public site, but moderators currently see imported problems as submitted `by OpenClienting Editorial` because the moderation queue reads `profiles.display_name` from the author relation. That is technically true for system-authored content, but it obscures the SME context on the moderation surface and makes the review UI less provenance-friendly than the workflow expects.  
References:
- [moderation.ts](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/lib/queries/moderation.ts:127)
- [page.tsx](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/app/[locale]/(shell)/moderate/problems/page.tsx:59)
- [page.tsx](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/app/[locale]/(shell)/moderate/problems/[id]/page.tsx:67)

## Severity: Low

### 4. Curated/editorial status is not surfaced on the public problem path

The import correctly writes `content_origin = editorial_curated`, but the public query/render path does not currently expose or badge that state. The QA prompt explicitly says to flag this without failing QA on its own, so this is a non-blocking visibility gap rather than the reason for the publish hold.  
References:
- [platform-ingestion-spec.md](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/docs/curated-problem-agent-pack/platform-ingestion-spec.md:303)
- [problems.ts](/C:/Users/Peter/OneDrive%20-%20University%20of%20Applied%20Sciences%20Europe%20GmbH%20(ehem.%20BiTS%20btk)%20-%20Berlin,%20Hamburg,%20Iserlohn/openclientorg/src/lib/queries/problems.ts:293)

## Verified Passes

- 10/10 imported packets exist in `problem_templates` as `submitted`.
- 10/10 imported packets have owner org links and moderation audit rows.
- 10/10 imported packets retain normalized citations and resolved tags.
- The public browse/detail queries filter to `status = published`, so submitted curated rows are not exposed before moderation.
