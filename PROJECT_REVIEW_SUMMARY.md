# Project Review Summary

Date: 2026-04-15

Scope: whole-project review across technical architecture/scalability/security,
UI/UX coherence and best practices, and product feature landscape.

## Executive Summary

OpenClienting is a strong MVP-stage knowledge platform built on a modern
Next.js App Router and Supabase stack. The codebase has a healthy separation of
page, component, query, action, moderation, translation, and SEO concerns. It
also shows unusually good attention to trust-sensitive platform details:
moderation workflows, organization verification, anonymity rules, content
revision history, markdown alternatives for AI/LLM crawlers, JSON-LD, cookie
consent, and i18n-aware routing.

The main blockers before a production release are security issues in the
authorization and attribution model. Two issues are release-blocking: users can
promote themselves by updating their own profile role, and user email addresses
are exposed through the public profiles RLS policy. The organization attribution
and suggested-edit pipelines also need hardening before the platform can safely
rely on verified organizations and moderator approval as trust signals.

Automated checks run during review:

- `npm run build`: passed.
- `npm run lint`: passed with 2 warnings for unused `tCommon` variables.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- Node built-in tests: 51 passed, 0 failed.

## Critical Findings

### P0: Users Can Promote Themselves to Moderator/Admin

File: `supabase/migrations/002_rls_policies.sql`

The `profiles` table stores authorization role data, and the current profile
update policy allows users to update their own profile row with only
`id = auth.uid()` as the check. Since `role` is on that same row, a signed-in
user can call Supabase directly and set their role to `admin`. All
`get_user_role()` and moderator checks then trust the escalated value.

Recommended fix:

- Prevent ordinary users from updating `profiles.role`.
- Split mutable public profile fields from admin-managed authorization fields,
  or replace direct profile updates with narrow RPC/server actions.
- Add a migration that drops the broad profile update policy and replaces it
  with a policy that only allows safe user-editable fields, if using views/RPC.

### P0: Profile Emails Are Public

File: `supabase/migrations/018_profiles_email.sql`

Migration 018 adds `profiles.email` and backfills it from `auth.users`, but the
earlier `profiles_select_public` policy still allows public reads of all
profile rows. This exposes contributor emails via direct PostgREST queries and
joins.

Recommended fix:

- Move email addresses to a private table or moderator-only view.
- Or replace public `profiles` access with a safe public profile view that
  includes only `id` and `display_name`.
- Ensure moderator screens use a privileged path for email access.

## High Priority Findings

### P1: Contributors Can Spoof Organization Attribution

Files:

- `src/app/[locale]/submit/actions.ts`
- `src/lib/actions/comments.ts`
- `src/lib/actions/requirements.ts`
- `src/lib/actions/solution-approaches.ts`
- Related RLS migrations for insert policies

Several contribution actions accept `organizationId` from the client and write
it directly to `author_organization_id`. Insert RLS primarily checks that
`author_id = auth.uid()`, but not that the user is an active member of the
organization. A user could attribute work to another organization, including a
verified one, if they know the organization id.

Recommended fix:

- Add a server-side helper such as `resolveVerifiedMembership(userId, orgId)`.
- Reject submitted organization ids unless the user is an active member.
- Mirror the invariant in RLS using an `is_org_member(org_id, user_id)` security
  definer helper.
- Apply this to problems, requirements, pilot frameworks, solution approaches,
  comments, and any future attributed content.

### P1: Suggested Edits Can Update Arbitrary Columns

Files:

- `src/lib/actions/suggested-edits.ts`
- `src/app/[locale]/moderate/actions.ts`

Suggested edits store caller-provided diff keys, and approval later copies all
diff keys into a table update. A malicious suggestion could include fields such
as `status`, `author_id`, `author_organization_id`, or counters. If a moderator
approves from the UI, those fields are applied.

Recommended fix:

- Define per-target allowlists for editable fields.
- Validate diff keys both when suggestions are submitted and when they are
  applied.
- Reject unknown target types or unknown fields before writing anything.
- Consider reusing the same pattern already used for translation field
  allowlisting.

## Medium Priority Findings

### P2: Browse Page Loads and Filters the Entire Published Problem Set

File: `src/lib/queries/problems.ts`

The published problems query fetches all published problems with joined tags,
profiles, and organizations, then filters in memory. The page renders every
result without pagination. This is acceptable for seed data but will become slow
and memory-heavy as content grows.

Recommended fix:

- Add database-backed pagination.
- Move search and filters into Postgres/PostgREST or a safe RPC.
- Add indexed search, ideally full-text search with weighted title,
  description, and tag fields.
- Add sort options such as newest, most active, most upvoted, successful pilots,
  and unsolved.

## Technical Evaluation

Strengths:

- Modern Next.js 16 App Router architecture.
- Strict TypeScript configuration.
- Clear split between `queries`, `actions`, components, i18n, SEO, and Supabase
  clients.
- Supabase RLS is used throughout the domain model.
- Moderation, verification, revision history, notifications, translations, and
  anonymity are represented in the schema rather than only in the UI.
- Cache tagging is used for public lists and SEO/markdown surfaces.
- Existing tests cover important anonymity and SEO markdown behavior.
- Build and audit results are clean.

Risks:

- Authorization currently relies on mutable profile role data.
- Public profile access is too broad after adding email.
- Some server actions trust client-provided organization attribution.
- Suggested edits need stricter field validation.
- Edge notification functions use service-role clients and should verify
  callers defensively.
- There is no visible app-level rate limiting for comments, votes,
  translations, suggested edits, or submissions.
- Search and browse are not yet ready for a large catalog.
- There is no `npm test` script even though tests exist.

## UI/UX Evaluation

Strengths:

- The product has a coherent trust/community theme.
- The teal/blue and amber pairing maps well to SME/problem and
  startup/solution sides.
- Tag colors, status badges, cards, icons, and dark mode tokens create a clear
  visual system.
- Accessibility basics are present: skip link, semantic headings, reduced
  motion handling, labels, and keyboard-friendly primitives.
- The homepage persona switch gives SMEs and startups distinct entry points.
- The problem detail page is structured for scanning: hero, summary, sections,
  table of contents, contributors, and discussion.

Risks and improvements:

- The compact logo is fixed at 270px wide and may crowd the mobile header.
- The hero display font size is fixed at 3.5rem, which may be too large for
  mobile and translated copy.
- The language switcher exposes many locales while most UI chrome falls back to
  English, which can overpromise localization.
- RTL languages are listed, but the root layout does not set `dir="rtl"` for
  Arabic/Hebrew.
- The flat language dropdown may become unwieldy with the full configured
  language list.
- Some forms use plain inline expansion. As contribution flows grow, dialogs or
  dedicated steps may reduce page clutter.

## Feature Landscape

Implemented:

- Public problem browsing and detail pages.
- Problem submissions with requirements and pilot frameworks.
- Requirements, pilot frameworks, solution approaches, comments, and votes.
- Organization creation, membership, and verification.
- Verified success reports.
- Moderator queue and moderation actions.
- Suggested edits and revision history.
- Open-source content translations.
- Notifications and notification preferences.
- Dashboard and organization management.
- SEO metadata, JSON-LD, sitemaps, robots, markdown mirrors, and `llms.txt`.
- Cookie consent and analytics gating.
- Legal pages and i18n routing.

Design gaps and suggested features:

- Draft save/resume for problem submissions.
- Evidence attachments for success reports.
- Abuse reporting and flagging for public content/comments.
- Rate limiting and spam prevention for high-volume actions.
- Saved problems, watched problems, and notification subscriptions.
- Startup opportunity workflow: saved opportunities, fit notes, comparison
  views, and contact/intent signals.
- SME workflow support: private draft collaboration, problem readiness checks,
  and guided template quality scoring.
- Moderator tooling: duplicate detection, user/org history, risk flags, bulk
  actions, and audit search.
- Better browsing: pagination, sorting, facet counts, and full-text search.
- Translation maintenance: stale translation warnings when source content is
  edited.

## Recommended Roadmap

1. Fix profile role escalation and public email exposure.
2. Enforce organization membership for all attributed contributions in actions
   and RLS.
3. Add suggested-edit field allowlists and validate edge function callers.
4. Add rate limiting/spam controls for contribution actions.
5. Move problem browsing to database-backed search, filtering, sorting, and
   pagination.
6. Add `npm test` and include the existing Node test suite.
7. Polish mobile header, hero sizing, language switcher, and RTL direction.
8. Add drafts, evidence attachments, reporting/flagging, and saved/watch flows.

