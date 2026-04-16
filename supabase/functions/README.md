# Supabase edge functions — email notifications

This directory contains the 8 edge functions that send branded HTML emails for
OpenClienting notification events. They are called by database triggers via
`pg_net` webhooks (see `supabase/migrations/*_webhooks.sql` and
`20260416120000_email_notifications_improvements.sql`).

## Functions

| Function | Fires on | Recipient |
|---|---|---|
| `notify-status-change` | `problem_templates.status`, `requirements.status`, `pilot_frameworks.status`, `solution_approaches.status`, `success_reports.status` → `published` or `rejected` | content submitter |
| `notify-success-report-decision` | `success_reports.verification_status` → `verified` or `rejected` | success-report submitter |
| `notify-comment-reply` | `INSERT` on `comments` where `parent_comment_id` is not null | parent-comment author |
| `notify-suggested-edit` | `INSERT` on `suggested_edits` | original content author |
| `notify-verification-outcome` | `organizations.verification_status` → `verified`/`rejected`, or `organization_memberships.membership_status` → `active`/`rejected` | org creator or membership requester |
| `notify-revision-reverted` | `content_revisions.revision_status` → `reverted` | edit author |
| `notify-new-solution` | `solution_approaches.status` → `published` | **problem** author (not the solution author) |
| `notify-new-success-report` | `success_reports.status` → `published` | **problem** author **and** solution author |

Each function:

1. Resolves the recipient's user id from the record.
2. Looks up the recipient's notification preference for that category (defaults
   to `true` if no row exists).
3. Inserts an in-app notification row into `notifications` (always, regardless
   of email preference).
4. If the email preference is on **and** `BREVO_API_KEY` is set, sends a
   branded HTML + text email via Brevo using the helpers in `_shared/email.ts`.

All links in emails are localized using the recipient's `profiles.locale`
(fallback: `en`).

## Required secrets

The webhook chain requires three separate pieces of configuration. The first
two are set **once per project** on the database side; the third is set on
each edge function.

### 1. Vault secrets (Postgres side — read by the webhook triggers)

Set in **Supabase Dashboard → Settings → Vault**:

| Secret name | Value |
|---|---|
| `edge_functions_base_url` | `https://wruzfhglslxgjxmbguwd.supabase.co/functions/v1` |
| `service_role_key` | your project's `service_role` key (Settings → API) |

Or via SQL (one-time):

```sql
select vault.create_secret(
  'https://wruzfhglslxgjxmbguwd.supabase.co/functions/v1',
  'edge_functions_base_url'
);
select vault.create_secret(
  '<service_role_key>',
  'service_role_key'
);
```

Without these, `net.http_post()` in the trigger functions calls
`null/notify-…` and the webhook silently fails.

### 2. Edge function environment (Supabase side — read by the Deno runtime)

Set in **Supabase Dashboard → Edge Functions → Secrets** (applies to all
functions in the project):

| Env var | Value |
|---|---|
| `BREVO_API_KEY` | your Brevo transactional-email API key |
| `SITE_URL` | `https://openclienting.org` (optional; defaults to prod URL) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase
automatically — do not override.

If `BREVO_API_KEY` is missing the function still inserts the in-app
notification but silently skips the email (`sendBrandedEmail` returns `false`).

### 3. Brevo sender verification

The sender address `noreply@openclienting.org` must be a verified sender in
Brevo. Configure in Brevo dashboard → Senders, Domains & dedicated IPs.

## Deploying

After editing any function (including `_shared/email.ts`):

```bash
# Deploy a single function
npx supabase functions deploy notify-status-change
npx supabase functions deploy notify-comment-reply
npx supabase functions deploy notify-suggested-edit
npx supabase functions deploy notify-success-report-decision
npx supabase functions deploy notify-verification-outcome
npx supabase functions deploy notify-revision-reverted
npx supabase functions deploy notify-new-solution
npx supabase functions deploy notify-new-success-report

# Or all at once
npx supabase functions deploy
```

Changes to `_shared/email.ts` require **redeploying every function** — each
deployed function gets its own frozen snapshot of the shared module.

## Verifying

1. **Check migrations are applied** (triggers exist):

   ```sql
   select tgname, tgrelid::regclass
   from pg_trigger
   where tgname like 'on_%'
   order by tgname;
   ```

   You should see: `on_status_change_*` (5 rows), `on_comment_reply`,
   `on_suggested_edit`, `on_new_solution_published`,
   `on_new_success_report_published`, plus the org/membership/revision
   triggers from earlier migrations.

2. **Check vault secrets are readable**:

   ```sql
   select public._get_secret('edge_functions_base_url');
   select length(public._get_secret('service_role_key'));
   ```

   Both must return non-null values.

3. **End-to-end smoke test** — approve a submitted problem in the
   moderation queue; the submitter should receive a branded HTML email
   within ~30s and see a matching notification in their dashboard.

4. **Inspect function logs** in Supabase Dashboard → Edge Functions →
   `<function>` → Logs. `Brevo send failed …` lines indicate the call
   reached Brevo but was rejected (check sender verification and payload).

## Editing the email template

The shared branded template is in `supabase/functions/_shared/email.ts`. It
mirrors the hand-crafted HTML in `supabase/templates/*.html` (auth emails):

- Logo image served from `https://openclienting.org/brand/email-logo.png`
- Light/dark mode handled via `prefers-color-scheme` media queries
- Responsive mobile breakpoint at 620px
- All user-supplied text (titles, snippets) is HTML-escaped

If you change the template, preview by temporarily writing the output of
`renderBrandedEmailHtml({...})` to an `.html` file and opening it in a
browser — there's no live preview for Deno edge functions.
