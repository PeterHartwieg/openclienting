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

## Users & roles

| Role | Can do |
|------|--------|
| Viewer | Browse, search, read (no account needed) |
| Contributor | Submit problems, requirements, pilot frameworks, solution approaches, comments (auto-granted on signup) |
| Moderator | Approve/reject submissions, manage tags, review suggested edits |
| Admin | Manage users, tags, site config |

- Any authenticated user is automatically a Contributor. No vetting required.
- No system-level distinction between SMEs and Startups — any contributor can submit anything.
- Future: verified badges (similar to Twitter checkmarks) for trusted SMEs and startups with a product on the market.

Auth: Google social login + email magic links via Supabase Auth.

## Data model

```
PROBLEM_TEMPLATE (central entity)
├── title, description
├── anonymous (boolean — author chooses per submission whether to show their identity)
├── status: draft → submitted → in_review → published | rejected (draft optional)
├── solution_status (computed, automatic):
│   ├── unsolved — no solution approaches
│   ├── has_approaches — ≥1 published solution approach
│   └── successful_pilot — ≥1 approved success report on any solution approach
│
├── VOTE (junction table — enforces one vote per user per target)
│   ├── user_id, target_type, target_id (unique constraint)
│   └── upvote_count on targets is a cached computed value from VOTE records
│
├── REQUIREMENT (N per problem, community-submitted, upvotable)
│   ├── body, author_id, anonymous
│   ├── upvote_count (cached, derived from VOTE table)
│   └── status (submitted → in_review → published | rejected)
│
├── PILOT_FRAMEWORK (N per problem, community-submitted, upvotable)
│   ├── scope, suggested_kpis, success_criteria, common_pitfalls
│   ├── duration, resource_commitment
│   ├── upvote_count (cached, derived from VOTE table), author_id, anonymous
│   └── status (submitted → in_review → published | rejected)
│
├── SOLUTION_APPROACH (N per problem, community-submitted)
│   ├── title, description
│   ├── technology_type (software, hardware, platform, service)
│   ├── maturity (emerging, growing, established)
│   ├── complexity, price_range
│   ├── author_id, anonymous
│   └── status (draft → submitted → in_review → published | rejected)
│
├── SUCCESS_REPORT (N per solution approach, moderated, visible with attribution)
│   ├── body (evidence/context), author_id, anonymous
│   ├── solution_approach_id
│   └── status (submitted → in_review → published | rejected)
│
├── TAGS (M:N via PROBLEM_TAGS junction)
│   ├── name, category (industry, technology, function, problem_category, company_size)
│   └── Moderator-managed — no hardcoded enums. Seeded with initial values.
│   └── Submission form enforces: pick ≥1 tag from each required category
│
├── SUGGESTED_EDIT (Wikipedia-style, full structured diffs)
│   ├── target_type, target_id (problem, requirement, pilot framework, or solution approach)
│   ├── diff (JSON patch: old value → new value for any field, including structured fields)
│   ├── author_id
│   └── status (submitted → in_review → published | rejected)
│
├── EDIT_HISTORY (audit log for author edits on published content)
│   ├── target_type, target_id, author_id, timestamp
│   └── diff (JSON patch of what changed — moderators can view and revert)
│
└── COMMENTS (one-level threading, attachable to problem or solution approach)
    ├── body, author_id, anonymous
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

### Stats bar (homepage)

Outcome-oriented metrics:
- Problems with successful pilots
- Industries covered
- Solution approaches proposed

## Contribution flow

1. Contributor fills problem template (problem + initial requirements + initial pilot framework) in one form
2. Chooses anonymous or public attribution per submission
3. Status set to `submitted` → moderator reviews → `published` or `rejected`
4. Contributor notified via email on status change
5. Once published:
   - Other contributors can add requirements and pilot frameworks (moderated, upvotable)
   - Contributors can propose solution approaches (moderated)
   - Anyone can suggest edits to existing content (Wikipedia-style structured diffs, moderator-approved)
   - Any contributor can submit a success report on a solution approach (moderated, visible with attribution)
6. Original author can edit their own published content freely (no re-moderation). All edits are logged in EDIT_HISTORY — moderators can view diffs and revert if needed.

### Unified lifecycle

All moderated content follows one status flow: `submitted → in_review → published | rejected`. Problem templates and solution approaches additionally support a `draft` state before submission. This ensures one moderation queue, one set of notification rules, and one status component across the platform.

### Future: post-first moderation

When platform traction is sufficient, switch from pre-publication moderation to post-first with flagging (per content type, gradually).

## Notifications

- Email notifications via Supabase on:
  - Submission status changes (approved/rejected)
  - Suggested edits on your content (for original authors)
  - Replies to your comments

## Design principles

- Independent of 27pilots branding — neutral community platform
- No specific startup names in solution approaches — technology categories only
- Anonymized problem data — per-submission toggle, author identity always stored server-side for moderation
- English-only MVP, i18n routing in place for future languages
