# OpenClienting Information Architecture Proposal

Date: 2026-04-16
Last status update: 2026-04-17

## Status

This is the live status block. Update it at the end of every IA-touching session.

### Done ✅

- **Phase 1 — IA + shell foundation.** Central typed nav config (`src/lib/nav/config.ts`) with `NavItem`, `NavGroup`, role visibility, badges, match modes, `isNavItemActive`. Public header expanded to expose Problems / Organizations / Venture Clienting / Submit. Mobile drawer mirrors the same. Shipped in commit `0ebea4f`.
- **Phase 2 — Workspace shell.** Reusable `WorkspaceShell` + `WorkspaceNav` + `WorkspaceMobileBar` (sticky desktop sidebar, mobile drawer, role-aware groups, badge counts via `getWorkspaceCounts`). Dashboard layout wired through it. Shipped in commit `0ebea4f`.
- **Phase 3 — Moderation restructuring.** Old 517-line tab monolith split into a Moderation Overview page plus 10 deep-linkable per-queue routes under `src/app/[locale]/(shell)/moderate/`. `getModerationCounts()` (`cache()`-wrapped, 10 parallel head-only queries) drives sidebar badges. `requireRole("moderator")` enforced at the layout level. Shipped in commit `0ebea4f`.
- **Sidebar everywhere except landing.** Workspace shell extended via Next.js route group `[locale]/(shell)/...` so every page except the landing page (`[locale]/page.tsx`) gets the sidebar. Anonymous visitors see an `AnonymousNav` with sign-in CTA + public discovery links; signed-in users see the full workspace nav. Shipped in commit `e8ea890`.
- **Dashboard Overview command-center redesign** (proposal §C). Replaced the lists-of-things page with prioritized cards: unread notifications, pending review, drafts, recent organizations, recent submissions, quick actions, plus a moderator-only queue summary tile. Shipped in commit `56d076c`.
- **Problems list — filter context** (proposal §E). Added result count, applied-filters chip strip with per-chip remove, single reset action, and filtered empty state. Saved filters explicitly deferred. Shipped in commits `07475de`, `1b9c853`, `365f5c5`.
- **i18n tooling overhaul.** `scripts/translate-messages.mjs` now (a) auto-selects backend (Anthropic SDK if `ANTHROPIC_API_KEY` set, else Claude Code CLI subprocess), (b) defaults to **gap-fill mode** — only translates keys missing from the target locale file (~22× faster than full retranslation), (c) `--full` flag forces complete rewrite, (d) isolated per-locale failure handling, (e) German rejoined the auto-flow now that gap-fill preserves hand-tuned strings. Shipped in commit `3290ee0`.
- **30 locales fully in sync** with `en.json` — adds Mongolian (Cyrillic, Khalkha) at `mn` as the 30th. Shipped in commit `6784765`.
- **Dev tooling.** `scripts/dev-login.mjs` mints a Supabase magic-link URL for a seeded test moderator/admin so logged-in features are testable in the local preview without going through real OAuth. `scripts/hooks/notify-translation-needed.mjs` + `.claude/settings.json` adds a PostToolUse hook reminding Claude to run `translate-messages.mjs` whenever `src/messages/en.json` is modified.

### Open ⬜

In rough suggested order:

1. **Problem detail polish** (proposal §F). Confirm "Problems" section highlight is wired through breadcrumbs end-to-end now that the sidebar wraps every inner page. May already work; needs visual verification.
2. **Mobile drawer UX** (proposal §B). Drawer currently mirrors desktop nav 1:1. Proposal calls for an intentional small-screen redesign — task-flow-first rather than category-first.
3. **Phase 4 productivity.** Global search, recent items, saved filters (the deferred slot from §E), quick actions surface on workspace pages, command palette if justified.
4. **Measurement layer (Phase 5).** GA4 is wired but no IA-specific events defined. Need: time to first action after login, clicks to key destinations, dashboard return rate, multi-area-visit rate, before/after comparison once a baseline window exists.

### How to use this status block

- **Starting a new IA session:** read this block first. It tells you what landed, what didn't, and what files own each piece.
- **Ending an IA session:** if you shipped something IA-related, move it from Open ⬜ to Done ✅ with the commit SHA, and update `Last status update`. Don't rewrite the rest of this document — it's the original proposal and stays as-is for context.

## Purpose

This document summarizes the current navigation and information architecture issues in OpenClienting and proposes a clearer structure for a future implementation session.

The goal is not just a visual redesign. The goal is to improve:

- user orientation
- discoverability of key features
- contributor productivity
- moderator efficiency
- return visits and ongoing engagement

## Executive Summary

OpenClienting has grown beyond a simple top-navigation website. It now contains multiple content domains and multiple user work modes:

- public discovery
- contributor workspace
- organization management
- moderator operations
- knowledge content

The current UI does not yet express that structure clearly. Core destinations are spread across:

- a minimal top header
- a mobile menu
- an avatar dropdown
- page-level action buttons
- footer links
- tabs inside complex tools

This creates avoidable cognitive load and weak information scent.

The recommended direction is:

1. Keep a top-header shell for public browsing pages.
2. Add a dedicated workspace shell with a collapsible left sidebar for authenticated and task-heavy areas.
3. Replace the moderation page's large horizontal tab set with a sidebar + subpages.
4. Preserve page-local sidebars where they already help, such as filters and table-of-contents navigation.
5. Make current location and next-best actions much more explicit across the product.

## Current Findings

### 1. Global navigation is too thin for the actual route inventory

The main desktop header currently exposes only:

- `Browse Problems`
- `Submit`
- theme toggle
- auth/user menu

Relevant code:

- [src/components/layout/header.tsx](./src/components/layout/header.tsx)

But the app now contains materially different destinations such as:

- dashboard
- organizations directory
- venture-clienting knowledge hub
- moderation
- account settings
- organization membership flows

This means users cannot build a reliable mental model from the main navigation.

### 2. Important destinations are hidden in secondary UI

Some core areas are discoverable mainly through:

- the avatar dropdown
- footer links
- one-off page buttons

Examples:

- `dashboard` and `moderate` are inside the user dropdown
- `venture-clienting` appears in the footer but not the main header
- dashboard subareas are exposed as page header buttons instead of stable navigation

Relevant code:

- [src/components/auth/user-menu.tsx](./src/components/auth/user-menu.tsx)
- [src/components/layout/footer.tsx](./src/components/layout/footer.tsx)
- [src/app/[locale]/dashboard/page.tsx](./src/app/[locale]/dashboard/page.tsx)

This is likely to suppress engagement with high-value features simply because users do not notice them.

### 3. Different parts of the app use conflicting navigation models

The product currently mixes:

- top navigation
- mobile dropdown menu
- page-level action buttons
- left filter rail
- right table of contents
- large horizontal tabs

Examples:

- problems list uses a left filter rail
- problem detail uses a right TOC
- moderation uses a large tab list

Relevant code:

- [src/app/[locale]/problems/page.tsx](./src/app/[locale]/problems/page.tsx)
- [src/app/[locale]/problems/[id]/page.tsx](./src/app/[locale]/problems/[id]/page.tsx)
- [src/app/[locale]/moderate/page.tsx](./src/app/[locale]/moderate/page.tsx)

The issue is not that multiple navigation patterns exist. The issue is that there is no clear hierarchy between product navigation, section navigation, and in-page navigation.

### 4. The dashboard behaves like a page, not a workspace

The dashboard contains useful information, but its structure is still a centered content page with action buttons at the top.

Current content:

- notifications
- submissions
- solution approaches

Missing from the overall IA:

- stable sub-navigation
- clear workspace hierarchy
- task-first prioritization
- stronger separation between overview and settings/management

Relevant code:

- [src/app/[locale]/dashboard/page.tsx](./src/app/[locale]/dashboard/page.tsx)
- [src/app/[locale]/dashboard/account/page.tsx](./src/app/[locale]/dashboard/account/page.tsx)
- [src/app/[locale]/dashboard/organizations/page.tsx](./src/app/[locale]/dashboard/organizations/page.tsx)

### 5. Moderation has outgrown tabs

The moderation page currently places many operational queues into one tab set:

- problems
- requirements
- frameworks
- solutions
- success reports
- suggested edits
- organization verification
- live revisions
- knowledge articles
- translations

This is no longer a lightweight tab use case. It is effectively a small application living inside one page.

Relevant code:

- [src/app/[locale]/moderate/page.tsx](./src/app/[locale]/moderate/page.tsx)

This will scale poorly for scanability, deep linking, and mobile usability.

### 6. Current-location cues are inconsistent across the product

Some pages have breadcrumbs, some rely on layout alone, and some hide the most important context inside controls rather than navigation.

There is no consistent system of:

- active product section
- active subsection
- open parent section
- current page title
- badge counts or task urgency

This makes orientation slower than it needs to be.

### 7. There is no visible measurement layer for UX improvement

No product analytics or event tracking was found in the repository during review.

That means future IA work should ship with a small measurement plan, otherwise impact on satisfaction, retention, and productivity will remain mostly anecdotal.

## IA Principles

The future structure should follow these principles:

### 1. Separate product-level navigation from local page navigation

Global app navigation should answer: "What area of the product am I in?"

Local page navigation should answer: "What can I do inside this area?"

In-page navigation should answer: "Where am I inside this long document?"

### 2. Organize around user goals, not code ownership

Users do not think in terms of route trees. They think in tasks such as:

- explore problems
- submit a challenge
- manage my profile
- manage my organization
- review moderation queues
- learn from venture clienting articles

### 3. Make key destinations visible on larger screens

Desktop users should not have to open dropdowns to discover major product areas.

### 4. Use the left sidebar for workspace complexity, not everywhere

A sidebar is helpful when users perform repeated, task-heavy, multi-step work. It is less useful if it simply adds chrome to otherwise simple public pages.

### 5. Highlight current location aggressively

Users should always be able to answer:

- where am I
- what else is nearby
- what should I do next

### 6. Preserve successful local patterns

The problems page filter rail and problem detail TOC already serve real user needs. They should remain local patterns, not be collapsed into one overloaded global sidebar.

## Proposed Navigation Model

## Shell 1: Public Discovery Shell

Use for:

- homepage
- problems list
- problem detail
- organizations directory
- organization detail
- venture-clienting hub and article pages
- legal pages

Pattern:

- top header navigation
- no permanent app sidebar
- local sidebars only where the page itself benefits from them

### Proposed top-level public navigation

- Problems
- Organizations
- Venture Clienting
- Submit

Secondary utilities:

- search
- language switcher
- theme toggle
- login/account entry

Notes:

- `Submit` can remain visually emphasized as a CTA.
- `Problems` should remain the primary browse entry.
- `Organizations` and `Venture Clienting` should move out of hidden/secondary locations into the main discovery model.

## Shell 2: Workspace Shell

Use for:

- dashboard
- account
- personal notifications
- personal submissions
- personal solution approaches
- organization management
- moderator tools

Pattern:

- left sidebar on desktop
- collapsible icon/label mode on larger screens
- temporary drawer on mobile
- compact top bar for page title, search, and contextual actions

### Proposed workspace sidebar groups

#### Home

- Overview

#### My Work

- My Submissions
- My Approaches
- Notifications

#### Organization

- Organizations
- Join Organization
- Create Organization

#### Settings

- Account

#### Moderation

Only shown for moderator/admin roles:

- Moderation Overview
- Problems
- Requirements
- Frameworks
- Solutions
- Success Reports
- Suggested Edits
- Organization Verification
- Live Revisions
- Knowledge Articles
- Translations
- Tags
- History

Notes:

- Badge counts should appear next to moderation queues and notifications.
- The active item and open section must be visually obvious.
- This sidebar should be the user's main orientation tool after login.

## Proposed Route/Section Mapping

### Public discovery

- `/{locale}` -> Home
- `/{locale}/problems` -> Problems
- `/{locale}/problems/[id]` -> Problems
- `/{locale}/organizations` -> Organizations
- `/{locale}/organizations/[slug]` -> Organizations
- `/{locale}/venture-clienting` -> Venture Clienting
- `/{locale}/venture-clienting/[slug]` -> Venture Clienting
- `/{locale}/submit` -> Submit

### Workspace

- `/{locale}/dashboard` -> Overview
- `/{locale}/dashboard/account` -> Account
- `/{locale}/dashboard/organizations` -> Organizations
- `/{locale}/dashboard/organizations/join` -> Join Organization
- `/{locale}/dashboard/organizations/new` -> Create Organization
- `/{locale}/dashboard/organizations/[id]` -> Organization detail/management

### Moderation workspace

Suggested future shape:

- `/{locale}/moderate` -> Moderation Overview
- `/{locale}/moderate/problems`
- `/{locale}/moderate/requirements`
- `/{locale}/moderate/frameworks`
- `/{locale}/moderate/solutions`
- `/{locale}/moderate/success-reports`
- `/{locale}/moderate/suggested-edits`
- `/{locale}/moderate/organization-verification`
- `/{locale}/moderate/live-revisions`
- `/{locale}/moderate/knowledge-articles`
- `/{locale}/moderate/translations`
- `/{locale}/moderate/tags`
- `/{locale}/moderate/history`

This is more scalable than keeping all moderation modes in a single tabbed page.

## Page-Level Recommendations

### A. Header

Current issue:

- too few destinations
- not enough product visibility

Recommendation:

- expose `Problems`, `Organizations`, `Venture Clienting`, and `Submit` in desktop header
- keep auth/account on the right
- consider adding visible search in the header for medium+ screens later

### B. Mobile navigation

Current issue:

- mobile menu currently mirrors the minimal desktop model
- current location and section structure are weak

Recommendation:

- make mobile menu reflect true top-level IA
- expose major destinations directly
- highlight active destination
- if in workspace shell, use a drawer that mirrors the desktop sidebar structure

### C. Dashboard / Workspace overview

Current issue:

- reads as a page of lists rather than a command center

Recommendation:

- make `Overview` a dedicated workspace landing page
- prioritize:
  - unread notifications
  - drafts or pending reviews
  - recently touched organizations
  - recent submissions
  - one-click actions

### D. Moderation

Current issue:

- too many tabs
- weak deep-linking
- difficult scaling on small screens

Recommendation:

- create a moderation overview page
- move each queue to its own page
- use sidebar navigation with counts
- preserve queue-specific controls and summaries on each page

### E. Problems list

Current issue:

- the local filter rail is good, but it is not framed as part of a broader navigation hierarchy

Recommendation:

- keep left filters as local navigation
- add stronger results context:
  - result count
  - applied filters summary
  - clear reset action
  - saved filter support in a later phase

### F. Problem detail

Current issue:

- content page itself is strong, but relation to product-level navigation could be clearer

Recommendation:

- keep right-side TOC
- ensure global section highlight says user is in `Problems`
- keep breadcrumbs
- avoid adding a left product sidebar to this page unless testing shows real benefit

## Proposed Content Taxonomy

The site should communicate these top-level domains clearly:

### 1. Problems

Core marketplace/discovery layer:

- problem browsing
- problem detail
- solutions and pilot evidence

### 2. Organizations

Trust and identity layer:

- verified organizations directory
- organization pages
- membership and organization management

### 3. Venture Clienting

Knowledge layer:

- hub content
- topic articles
- article proposals and edits

### 4. Workspace

Personal productivity layer:

- overview
- notifications
- submissions
- account

### 5. Moderation

Operational governance layer:

- all review queues
- tags
- audit/history

## Suggested Rollout Plan

### Phase 1: IA and shell foundation ✅ done

- define nav schema in code
- expand public header navigation
- create reusable workspace sidebar component
- add active-state handling and badges

### Phase 2: Workspace migration ✅ done

- move dashboard/account/organizations into workspace shell
- redesign overview page (command-center version shipped in commit 56d076c)
- standardize page headers and actions

### Phase 3: Moderation restructuring ✅ done

- split moderation tabs into dedicated routes
- add moderation sidebar
- add queue counts and better deep links

### Phase 4: Productivity enhancements ⬜ open

- global search improvements
- recent items
- saved filters
- quick actions
- command palette if justified

### Phase 5: Measurement and iteration ⬜ open

- instrument events
- compare before/after task completion and route usage
- refine based on actual user behavior

## Success Metrics

These metrics should be added alongside implementation:

- time to first meaningful action after login
- average clicks to reach key destinations
- dashboard return rate
- percentage of authenticated users who visit more than one workspace area
- submit start -> submit complete conversion
- moderation items processed per session
- notification click-through rate
- visits to `Organizations` and `Venture Clienting` from primary navigation

## Risks and Guardrails

### Risk: too much chrome

Guardrail:

- do not put a permanent left sidebar on all public pages

### Risk: sidebar becomes a dumping ground

Guardrail:

- keep strict separation between:
  - product navigation
  - section navigation
  - in-page navigation

### Risk: moderation becomes fragmented

Guardrail:

- use a shared moderation shell and shared queue patterns

### Risk: mobile gets worse

Guardrail:

- design mobile drawer behavior intentionally
- do not simply shrink the desktop IA

## Research References

These sources informed the proposal:

- NN/g Menu Design Checklist: visible navigation, left-side nav for applications, descriptive labels, current-location cues  
  [https://media.nngroup.com/media/articles/attachments/PDF_Menu-Design-Checklist.pdf](https://media.nngroup.com/media/articles/attachments/PDF_Menu-Design-Checklist.pdf)

- MOJ Design System, Side Navigation: use side nav for subsections in a system or service, not for global navigation  
  [https://design-patterns.service.justice.gov.uk/components/side-navigation/](https://design-patterns.service.justice.gov.uk/components/side-navigation/)

- GOV.UK Tabs: tabs are not appropriate as page navigation  
  [https://design-system.service.gov.uk/components/tabs/](https://design-system.service.gov.uk/components/tabs/)

- MUI Drawer: standard responsive behavior for temporary mobile drawers and persistent desktop side navigation  
  [https://mui.com/material-ui/react-drawer/](https://mui.com/material-ui/react-drawer/)

- Baymard mobile navigation findings: current scope visibility, better taxonomy, and navigation clarity remain common weaknesses  
  [https://baymard.com/blog/mobile-ux-ecommerce](https://baymard.com/blog/mobile-ux-ecommerce)

## Implementation Notes For Next Session

Suggested first implementation slice:

1. Introduce a central navigation config that defines:
   - label
   - href
   - icon
   - role visibility
   - badge source
   - shell type
2. Expand the public header to expose the real top-level discovery areas.
3. Add a reusable `WorkspaceSidebar` component and workspace layout.
4. Move dashboard/account/organizations under that layout first.
5. Leave moderation route-splitting for a second pass unless time allows.

## Recommendation

Proceed with a two-shell IA:

- public discovery shell with stronger top navigation
- authenticated workspace shell with a left sidebar

Do not implement "sidebar everywhere". Implement "sidebar where repeated work and feature density justify it".
