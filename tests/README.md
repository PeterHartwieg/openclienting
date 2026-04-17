# Test Suites

Four narrow Vitest suites + one Playwright smoke test. No broad coverage push — each suite targets a specific regression surface.

## Prerequisites

Add to `.env.local`:
```
SUPABASE_JWT_SECRET=<from Supabase dashboard → Settings → API → JWT Secret>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>
```

## Running each suite

### Suites 1, 3, 4 — Vitest (unit/integration)
```bash
npm test            # run all vitest suites once
npm run test:watch  # watch mode during development
```

Suite 1 (RLS matrix) requires `SUPABASE_JWT_SECRET` + `SUPABASE_SERVICE_ROLE_KEY`. It will be **skipped** automatically if `SUPABASE_JWT_SECRET` is missing.

### Suite 2 — pgTAP (hosted DB)
```bash
npm run test:db -- --linked
# or with the explicit flag:
supabase db test --linked
```

Fallback (if `--linked` not supported in your CLI version):
```bash
psql "$DATABASE_URL" -f supabase/tests/moderation_state_machine.sql
```

The test wraps everything in `begin; … rollback;` — no permanent rows are written.

### Suite 5 — Playwright (e2e)
```bash
# With a dev server already running on :3000:
npm run test:e2e

# Or point at a preview deployment:
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:e2e

# Single spec only:
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/submit-moderate-publish.spec.ts
```

The spec is **skipped** when `CI=true` and `PLAYWRIGHT_BASE_URL` is not set, to avoid blocking the PR pipeline without a live server.

## What each suite covers

| Suite | File | What it tests |
|-------|------|---------------|
| 1 — RLS matrix | `tests/rls/rls-matrix.test.ts` | Critical table × role × operation boundaries. Encodes what current RLS policies promise: anon denied inserts, regular users can't see others' submitted content, moderators can read/update anything. |
| 2 — moderation state machine | `supabase/tests/moderation_state_machine.sql` | `moderate_item_v1` RPC: approved→published transition, rejected→rejected, moderation_event row correctness, permission denied for non-moderators, invalid decision/type raises. |
| 3 — storage upload | `tests/storage/org-logos.test.ts` | `uploadOrgLogo` server action: MIME allowlist (jpeg/png/webp pass; svg/gif/pdf rejected), filename vs content-type (server uses `file.type` not filename), 512 KB size limit, auth/membership checks. |
| 4 — cache-tag snapshot | `tests/cache-tags.test.ts` | Static AST walk: every exported action function with a `.insert/.update/.delete/.upsert` call must also call `updateTag/revalidateTag/revalidatePath`. Known offenders are allowlisted with a TODO referencing PR 5. Fails fast on new mutations that skip cache invalidation. |
| 5 — Playwright smoke | `tests/e2e/submit-moderate-publish.spec.ts` | Golden path: sign in as moderator → submit problem → approve in queue → assert visible on public list → cleanup. |

## Adding new tests

- **New RLS rule**: add a case to the `describe` block matching the table in `tests/rls/rls-matrix.test.ts`.
- **New server action with mutations**: if it intentionally omits cache invalidation, add it to `EXPECTED_OFFENDERS` in `tests/cache-tags.test.ts` with a TODO. Otherwise the snapshot test will fail CI.
- **New moderation RPC**: add pgTAP assertions to `supabase/tests/moderation_state_machine.sql` and update `select plan(N)`.
- **New e2e flow**: add a `test()` block inside `maybeDescribe` in `submit-moderate-publish.spec.ts`, or create a new spec file under `tests/e2e/`.

## Helpers

- `tests/helpers/supabase-roles.ts` — `roleClient(role)` returns a Supabase client with a minted JWT for the given Postgres role. Use in integration tests that talk to the real DB.
- `tests/setup.ts` — loads `@testing-library/jest-dom` matchers and English i18n messages into the global.
