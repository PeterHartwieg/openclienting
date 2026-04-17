# Platform Ingestion Spec — Curated Content

**Version:** 1.0  
**Audience:** Import Agent, content coordinators, on-call engineers  
**Status:** Active — this document is the authoritative reference for the import workflow.

---

## 1. Overview

This document describes how editorially curated problem packets are imported into OpenClienting.org without using the normal contributor submission flow.

The key elements are:

| Element | Description |
|---|---|
| **System profile** | A well-known platform account (`00000000-0000-0000-0000-000000000001`) that acts as the technical author of all curated content. Never displayed as a real person. |
| **System-managed org** | An `organizations` row with `is_system_managed = true`. Represents a real-world entity; administered by the system profile. |
| **content_origin** | Column on `problem_templates`. `'editorial_curated'` marks imported content; `'user_submitted'` marks regular contributions. |
| **packet_id** | Stable opaque string on `problem_templates` that makes re-imports a no-op. |
| **content_citations** | Normalized table for source URLs, access dates, and fact/inference labelling. |
| **import_curated_problem_v1** | Admin-only SECURITY DEFINER RPC that is the single entry point for batch import. |

---

## 2. System Profile

### Identity

| Field | Value |
|---|---|
| Profile UUID | `00000000-0000-0000-0000-000000000001` |
| Email | `system@internal.openclientorg.invalid` |
| Display name | `OpenClienting Editorial` |
| Role | `admin` |

The `.invalid` TLD is RFC-2606 reserved — the account cannot receive email or sign in through Supabase Auth. It exists purely as a FK anchor for curated content rows.

### What it owns

- All curated `problem_templates` rows (`author_id = system_profile_id`)
- All curated `requirements` and `pilot_frameworks` rows
- All `content_citations` rows (`created_by = system_profile_id`)
- Active admin membership in every system-managed org

### What it does NOT imply

- The system profile is **never displayed** as the visible author. All curated problems have `is_publicly_anonymous = true`. The UI should render the `content_origin` badge instead.
- The system profile is **not** a real organization representative. The real org is shown via `author_organization_id`.

### Setup verification

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/setup-system-profile.mjs
```

Expected output:
```
✅ System profile is correctly configured.
   ID:           00000000-0000-0000-0000-000000000001
   Display name: OpenClienting Editorial
   Role:         admin
```

---

## 3. Accountless Organizations

### What they are

System-managed organizations are real companies/entities that have no user account on the platform. Examples: an SME identified from a public source, a case-study employer.

### Data model

| Field | Value |
|---|---|
| `is_system_managed` | `true` |
| `verification_status` | `'unverified'` (see note below) |
| `created_by` | system profile UUID |
| Admin member | system profile, role=`'admin'`, status=`'active'` |

**Note on verification:** System-managed orgs are `unverified` in the platform trust model (they have not gone through the user-identity verification workflow). Their real-world identity is backed by `content_citations` on the associated problems. The UI **must not** display the "Verified" badge for `is_system_managed = true` orgs — a separate "Editorial" or "Curated" badge is appropriate.

### RLS visibility

System-managed orgs are publicly readable regardless of `verification_status`. This allows curated problem pages to render the org name correctly.

### Creating / deduplicating an org

The `ensure_system_org_v1` RPC handles this. It deduplicates in priority order:

1. Explicit `organization_id` in payload (match an existing org by UUID)
2. Normalized website URL (strips `https://`, `www.`, trailing `/`)
3. Case-insensitive name match
4. If nothing matches → creates a new system-managed org with a deduplicated slug

The import script calls this automatically. Manual use:

```sql
select ensure_system_org_v1('{
  "name":    "Acme Manufacturing GmbH",
  "website": "https://acme.example.com",
  "description": "Mid-size precision engineering firm",
  "_service_caller_id": "<admin-profile-uuid>"
}'::jsonb);
```

---

## 4. Import Payload Format

The import RPC accepts JSON. The YAML packet files from the curation workflow must be converted to JSON before import:

```bash
# Using yq (install via brew or apt):
yq -o=json packet.yaml > packet.json

# Or: write packets directly in JSON if your tooling supports it
```

### Full payload schema

```json
{
  "packet_id": "stable-string-required",

  "problem_owner_org": {
    "organization_id": "uuid-or-null",
    "name":            "Acme Manufacturing GmbH",
    "website":         "https://acme.example.com",
    "description":     "Short description",
    "country":         "DE"
  },

  "solution_provider_org": {
    "organization_id": "uuid-or-null",
    "name":            "Example Vendor Ltd",
    "website":         "https://vendor.example.com",
    "description":     "Optional short description",
    "country":         "GB"
  },

  "problem": {
    "title":           "Required: problem title",
    "description":     "Required: problem description",
    "source_language": "en",
    "tag_ids":         ["uuid1", "uuid2"]
  },

  "requirements": [
    { "body": "Requirement text" }
  ],

  "pilot_framework": {
    "scope":               "...",
    "suggested_kpis":      "...",
    "success_criteria":    "...",
    "common_pitfalls":     "...",
    "duration":            "...",
    "resource_commitment": "..."
  },

  "citations": [
    {
      "source_url":      "https://...",
      "source_title":    "Article title",
      "publisher":       "Publisher name",
      "source_type":     "primary",
      "access_date":     "2026-04-17",
      "evidence_note":   "What this source supports",
      "is_sourced_fact": true
    }
  ],

  "curator_note": "Optional: internal note for the import audit log",

  "_service_caller_id": "admin-profile-uuid"
}
```

### Field notes

| Field | Notes |
|---|---|
| `packet_id` | Must be stable and unique per problem. Use the `packet_id` from `packet-schema.yaml`. |
| `problem_owner_org.organization_id` | If the org was already matched/created in a previous run, pass its UUID to skip deduplication lookup. |
| `solution_provider_org.organization_id` | Optional. If present, the import RPC links the problem to the resolved provider organization without inventing a solution approach row. |
| `pilot_framework` | Optional. The import script also accepts the nested `{ text, source_basis, note }` format from YAML packets and flattens it automatically. |
| `citations[].is_sourced_fact` | `true` = a source directly states the claim (packet `source_basis: "direct"`). `false` = editorial inference (packet `source_basis: "inference"`). |
| `citations[].access_date` | Must use ISO `YYYY-MM-DD`. The import RPC rejects looser date formats so the batch stays machine-validated. |
| `_service_caller_id` | Required only in service-role context (script imports). Set to the admin's profile UUID for the audit trail. Omit when calling as an authenticated admin user. |

---

## 5. Import Workflow

### Prerequisites

1. Migrations `20260418001000` through `20260418001400` have been applied.
2. System profile verified: `node scripts/setup-system-profile.mjs`
3. Tag IDs resolved: look up tag UUIDs from `public.tags` by slug or name, and add them to the `problem.tag_ids` array in each packet.
4. Packet JSON files prepared (one per problem, named with a stable ID, e.g. `packet-001.json`).

### Step 1 — Dry run

Always run with `--dry-run` first to see what would be imported:

```bash
SUPABASE_URL=https://wruzfhglslxgjxmbguwd.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  node scripts/import-curated-content.mjs \
    --dir=docs/curated-problem-agent-pack/packets/ \
    --admin-id=<your-profile-uuid> \
    --dry-run
```

### Step 2 — Import

```bash
SUPABASE_URL=https://wruzfhglslxgjxmbguwd.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  node scripts/import-curated-content.mjs \
    --dir=docs/curated-problem-agent-pack/packets/ \
    --admin-id=<your-profile-uuid>
```

The script is idempotent. Re-running it skips packets that were already imported (matched by `packet_id`).

### Step 3 — Moderate

Imported problems land in `status = 'submitted'`. A moderator must review and publish each one using the existing moderation flow (`moderate_item_v1`):

```sql
-- Approve a curated problem (moderator must be logged in)
select moderate_item_v1(
  'problem_template',
  '<problem-id>',
  'approved',
  'Curated content reviewed and approved for publication.'
);
```

To find all submitted curated problems awaiting review:
```sql
select id, title, packet_id, created_at
from public.problem_templates
where content_origin = 'editorial_curated'
  and status = 'submitted'
order by created_at;
```

### Step 4 — Verify

```sql
-- Check citations are intact
select pt.title, count(cc.id) as citation_count
from public.problem_templates pt
left join public.content_citations cc
  on cc.target_type = 'problem_template'
 and cc.target_id   = pt.id
where pt.content_origin = 'editorial_curated'
group by pt.id, pt.title;

-- Check org links
select pt.title, o.name, o.is_system_managed
from public.problem_templates pt
join public.organizations o on o.id = pt.author_organization_id
where pt.content_origin = 'editorial_curated';
```

---

## 6. Citation / Provenance Model

### content_citations table

```
content_citations
  id              uuid (PK)
  target_type     text  ('problem_template' | 'requirement' | 'solution_approach')
  target_id       uuid  (FK into the corresponding table)
  source_url      text  (required)
  source_title    text
  publisher       text
  source_type     text  ('primary' | 'secondary')
  access_date     date
  evidence_note   text  (what the source supports)
  is_sourced_fact bool  (true = direct; false = inference)
  created_by      uuid  (FK → profiles; always system profile for imported content)
  created_at      timestamptz
```

Duplicate protection:

- `content_citations` are unique per `(target_type, target_id, source_url)`.
- Deleting a supported parent row (`problem_template`, `requirement`, `solution_approach`) cleans up its citations automatically.

### Provenance on problem_templates

```
problem_templates
  content_origin  text  ('user_submitted' | 'editorial_curated')
  packet_id       text  (unique; NULL for user content)
```

### Audit trail

Each import also writes a `moderation_event` row:
```
target_type = 'problem_template'
action      = 'submitted'
metadata    = {
  "content_origin": "editorial_curated",
  "packet_id":      "<packet-id>",
  "curator_note":   "<note>",
  "imported_by":    "<admin-profile-uuid>"
}
```

---

## 7. Security Model

| Concern | Mechanism |
|---|---|
| System profile cannot sign in | Empty bcrypt hash + `.invalid` email domain |
| Import requires admin/moderator | `is_moderator_or_admin()` check inside RPC |
| Service-role imports audited | `_service_caller_id` must be a real admin profile UUID |
| Curated content still reviewed | Lands in `status='submitted'`; moderator approves before public |
| Existing user content unaffected | All new columns default to user-content values; no behavior change |
| No RLS bypass for users | RPCs are SECURITY DEFINER; user-facing insert paths are unchanged |

---

## 8. Field Mapping: packet-schema.yaml → Import Payload

| packet-schema field | Import payload field | Notes |
|---|---|---|
| `packet_id` | `packet_id` | Direct |
| `problem_owner_organization.name` | `problem_owner_org.name` | Required for org dedup |
| `problem_owner_organization.website` | `problem_owner_org.website` | Used for website dedup |
| `problem_owner_organization.short_description` | `problem_owner_org.description` | |
| `problem_owner_organization.existing_org_match.organization_id` | `problem_owner_org.organization_id` | If matched, skips dedup logic |
| `solution_provider_organization.name` | `solution_provider_org.name` | Optional; import only when `present: true` and publicly named |
| `solution_provider_organization.website` | `solution_provider_org.website` | |
| `solution_provider_organization.short_description` | `solution_provider_org.description` | |
| `solution_provider_organization.existing_org_match.organization_id` | `solution_provider_org.organization_id` | If matched, skips dedup logic |
| `problem_statement.title` | `problem.title` | |
| `problem_statement.description` | `problem.description` | |
| `problem_statement.tags.*` | `problem.tag_ids` | Requires resolving tag UUIDs first |
| `problem_statement.requirements[].text` | `requirements[].body` | `source_basis`/`note` not stored on requirement row |
| `problem_statement.pilot_framework.*.text` | `pilot_framework.*` | Script flattens nested `{text, ...}` objects |
| `citations[].source_url` | `citations[].source_url` | |
| `citations[].source_title` | `citations[].source_title` | |
| `citations[].publisher` | `citations[].publisher` | |
| `citations[].source_type` | `citations[].source_type` | `'primary'` or `'secondary'` |
| `citations[].access_date` | `citations[].access_date` | ISO 8601 date |
| `citations[].evidence_note` | `citations[].evidence_note` | |
| `citations[].source_basis` | `citations[].is_sourced_fact` | `'direct'` → `true`; `'inference'` → `false` |
| `provenance.curator_note` | `curator_note` | Stored in moderation_event.metadata |

---

## 9. Running the pgTAP Test Suite

```bash
# Against the linked hosted project (supabase CLI ≥ 2.84.2):
supabase db test --linked

# Fallback via psql:
psql "$DATABASE_URL" -f supabase/tests/curated_import.sql
```

The test suite covers: system profile existence, schema columns, org deduplication, import happy path, idempotency, and permission denial.
