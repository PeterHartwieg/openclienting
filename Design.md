# OpenClienting.org — Design spec

Open-source venture clienting knowledge base where SMEs crowdsource problem templates and pilot playbooks, and startups discover unsolved challenges to position their solutions against.

## Tech stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- **Database**: PostgreSQL via Supabase (auth, row-level security, free tier)
- **Search**: Postgres full-text search (`tsvector`) — no external search engine needed at scale
- **Hosting**: Vercel (free tier), domain on Cloudflare
- **Email**: Supabase edge functions + Resend/SendGrid for transactional notifications
- **Domain**: openclienting.org (future: ventureclient.wiki for knowledge base layer)
- **i18n**: Next.js i18n routing enabled (`[locale]/` prefix), English strings inline. No string extraction for MVP — add locale files when a second language is needed.
- **Tier strategy**: Free tiers for Supabase and Vercel, upgrade when limits are hit.

## Users, roles & trust

| Role | Can do |
|------|--------|
| Viewer | Browse, search, read (no account needed) |
| Contributor | Submit problems, requirements, pilot frameworks, solution approaches, comments (auto-granted on signup) |
| Moderator | Approve/reject submissions, manage tags, review suggested edits, review verification requests, review live revisions |
| Admin | Manage users, tags, site config |

- Any authenticated user is automatically a Contributor. No vetting required.
- No public product-facing distinction between SMEs and startups — any contributor can submit anything.
- High-trust actions are controlled by a backend verification layer, not by the visible role label alone.
- Trust-sensitive actions:
  - Only users linked to a verified organization can submit a pilot success report
  - Only verified success reports can promote a solution/problem to `successful_pilot`
- Verification is available to both SMEs and startups, but verification means "real organization + real member", not endorsement of quality.
- Public badges can be shown later, but trust must already exist in the data model and moderation workflow from day one.

Auth: Google social login + email magic links via Supabase Auth.

### Verification layer

- Add `ORGANIZATION`, `ORGANIZATION_MEMBERSHIP`, and `VERIFICATION_REVIEW` entities behind the scenes.
- A user can belong to zero or more organizations.
- Organization verification is moderator-reviewed and may use company email domain, company website, business registry, LinkedIn/company profile, or manual review.
- Membership verification confirms that a user actually represents that organization.
- Public anonymity can hide both the person and the organization, but both are always stored server-side for moderation, abuse handling, and analytics.

## Data model

```
PROBLEM_TEMPLATE (central entity)
├── title, description
├── is_publicly_anonymous, is_org_anonymous
├── author_user_id, author_organization_id (always stored server-side)
├── status: draft → submitted → in_review → published | rejected (draft optional)
├── solution_status (computed, automatic):
│   ├── unsolved — no solution approaches
│   ├── has_approaches — ≥1 published solution approach
│   └── successful_pilot — ≥1 verified success report on any solution approach
│
├── VOTE (junction table — enforces one vote per user per target)
│   ├── user_id, target_type, target_id (unique constraint)
│   └── upvote_count on targets is a cached computed value from VOTE records
│
├── REQUIREMENT (N per problem, community-submitted, upvotable)
│   ├── body
│   ├── is_publicly_anonymous, is_org_anonymous
│   ├── author_user_id, author_organization_id
│   ├── upvote_count (cached, derived from VOTE table)
│   └── status (submitted → in_review → published | rejected)
│
├── PILOT_FRAMEWORK (N per problem, community-submitted, upvotable)
│   ├── scope, suggested_kpis, success_criteria, common_pitfalls
│   ├── duration, resource_commitment
│   ├── is_publicly_anonymous, is_org_anonymous
│   ├── author_user_id, author_organization_id
│   ├── upvote_count (cached, derived from VOTE table)
│   └── status (submitted → in_review → published | rejected)
│
├── SOLUTION_APPROACH (N per problem, community-submitted)
│   ├── title, description
│   ├── technology_type (software, hardware, platform, service)
│   ├── maturity (emerging, growing, established)
│   ├── complexity, price_range
│   ├── is_publicly_anonymous, is_org_anonymous
│   ├── author_user_id, author_organization_id
│   └── status (draft → submitted → in_review → published | rejected)
│
├── ORGANIZATION
│   ├── name, website, domain
│   ├── verification_status (unverified → pending → verified | rejected)
│   └── verification_notes, verified_at
│
├── ORGANIZATION_MEMBERSHIP
│   ├── user_id, organization_id
│   ├── membership_status (pending → active | revoked)
│   └── proof_type, proof_reference
│
├── SUCCESS_REPORT (N per solution approach, high-trust, moderated)
│   ├── solution_approach_id, problem_template_id
│   ├── submitted_by_user_id, submitted_by_organization_id
│   ├── is_publicly_anonymous, is_org_anonymous
│   ├── report_summary, pilot_date_range, deployment_scope
│   ├── kpi_summary, evidence_notes, optional_attachment_refs
│   ├── verification_status (submitted → in_review → verified | rejected)
│   └── only allowed when submitter is an active member of a verified organization
│
├── TAGS (M:N via PROBLEM_TAGS junction)
│   ├── name, category (industry, technology, function, problem_category, company_size)
│   └── Moderator-managed — no hardcoded enums. Seeded with initial values.
│   └── Submission form enforces: pick ≥1 tag from each required category
│
├── SUGGESTED_EDIT (Wikipedia-style, structured diffs)
│   ├── target_type, target_id (problem, requirement, pilot framework, or solution approach)
│   ├── patch_document (JSON patch: field-level old value → new value, including structured fields)
│   ├── author_user_id
│   └── status (submitted → in_review → published | rejected)
│
├── CONTENT_REVISION (audit log for all edits on published content)
│   ├── target_type, target_id, revision_number
│   ├── edited_by_user_id, edited_by_organization_id, timestamp
│   ├── patch_document or full_snapshot
│   ├── moderation_status (pending_recheck → approved | reverted)
│   └── edits go live immediately, but moderators can review and revert
│
└── COMMENTS (one-level threading, attachable to problem or solution approach)
    ├── body
    ├── is_publicly_anonymous, is_org_anonymous
    ├── author_user_id, author_organization_id
    └── parent_comment_id (null = top-level, non-null = reply, max 1 level deep)
```

### Tag categories (seeded, moderator can extend)

| Category | Initial values |
|----------|---------------|
| industry | manufacturing, logistics, retail, energy, construction, healthcare |
| function | operations, quality, procurement, IT, finance |
| problem_category | efficiency, compliance, visibility, cost_reduction |
| company_size | micro, small, medium |
| technology | (empty — grows organically as solution approaches are submitted) |

## Key screens

1. **Homepage**: hero + search bar, category grid (industries from tags), stats bar, "for startups" CTA
2. **Browse/search**: search bar + left sidebar filters (tag categories as filter groups, solution status, sort). Cards show: title, summary, tag pills, solution status badge
3. **Problem detail**: single scrollable page — description → requirements (upvotable) → pilot frameworks (upvotable) → solution approaches → discussion thread
4. **Submit form**: single page, three sections (problem definition, requirements, pilot framework). Anonymity toggle. Save draft + submit for review
5. **Dashboard**: contributor's submissions with status indicators, notification history
6. **Moderator queue**: submissions, verification requests, live revisions pending recheck, and success reports

### Stats bar (homepage)

Outcome-oriented metrics:
- Problems with successful pilots
- Industries covered
- Solution approaches proposed

## Contribution flow

1. Contributor fills problem template (problem + initial requirements + initial pilot framework) in one form
2. Chooses whether to hide personal identity and/or organization identity from the public UI
3. Status set to `submitted` → moderator reviews → `published` or `rejected`
4. Contributor notified via email on status change
5. Once published:
   - Other contributors can add requirements and pilot frameworks (moderated, upvotable)
   - Contributors can propose solution approaches (moderated)
   - Anyone can suggest edits to existing content (Wikipedia-style structured diffs, moderator-approved)
   - Only contributors who are active members of verified organizations can submit a success report on a solution approach
6. Original author can edit their own published content instantly. Every live edit creates a `CONTENT_REVISION` record with `pending_recheck` moderation status.
7. Moderators review live revisions after publication:
   - approve = revision remains as-is and is marked approved
   - revert = content returns to the last approved revision and the rejected revision remains in the audit trail

### High-trust success reporting

- A success report is not a normal comment or vote; it is a privileged claim.
- Submission requires:
  - authenticated user
  - active membership in a verified organization
  - moderation review
  - enough structured evidence to make the claim meaningful
- Public UI may still show the report anonymously if the contributor chose anonymity, but the backend always retains the real user and organization linkage.
- `successful_pilot` is only computed from `SUCCESS_REPORT.verification_status = verified`.

### Unified lifecycle

All moderated content follows one status flow: `submitted → in_review → published | rejected`. Problem templates and solution approaches additionally support a `draft` state before submission. This ensures one moderation queue, one set of notification rules, and one status component across the platform.

### Live edit policy

- Published edits go live immediately for speed.
- Every live edit is automatically queued for moderator recheck.
- Moderators can compare diffs, approve the revision, or revert to the last approved state.
- Repeated abuse can disable instant editing for specific users or organizations.

### Future: post-first moderation

When platform traction is sufficient, switch from pre-publication moderation to post-first with flagging (per content type, gradually).

## Notifications

- Email notifications via Supabase on:
  - Submission status changes (approved/rejected)
  - Suggested edits on your content (for original authors)
  - Verification request outcomes
  - Success report decisions (verified/rejected)
  - Live revision reverted after moderator review
  - Replies to your comments

## Design principles

- Independent of 27pilots branding — neutral community platform
- No specific startup names in solution approaches — technology categories only
- Public anonymity can hide both contributor identity and organization identity, but real attribution is always stored server-side for moderation, abuse handling, and analytics
- Trust-sensitive platform signals must be backed by verification, audit trails, and reversible moderation decisions
- English-only MVP, i18n routing in place for future languages
