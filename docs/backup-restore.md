# Database backup & restore

Daily encrypted backups of the Supabase database run via [`.github/workflows/backup.yml`](../.github/workflows/backup.yml).

- **Schedule:** daily at 03:17 UTC
- **Manual trigger:** Actions tab → "Database backup" → Run workflow, or `gh workflow run "Database backup"`
- **Format:** `pg_dump --format=custom`, encrypted with GPG symmetric AES256
- **Retention:** 90 days as a workflow artifact
- **Why encrypted:** the repo is public, so artifacts are downloadable by any signed-in GitHub user. The GPG passphrase is the only protection — keep it safe.

## One-time setup

Two GitHub Actions secrets are required.

### 1. `SUPABASE_DB_URL`

Supabase Dashboard → Project Settings → Database → **Connection string** → **URI** tab.

Use the **session-mode pooler** URL on port `5432` (the transaction pooler on `6543` does not support `pg_dump`):

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Replace `<password>` with the database password (URL-encode any special characters).

### 2. `BACKUP_GPG_PASSPHRASE`

Generate a high-entropy passphrase (do this **once**, store in your password manager — losing it makes every backup unrecoverable):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

(`openssl rand -base64 48` also works on macOS/Linux but isn't available by default on Windows.)

### Set both secrets

```bash
gh secret set SUPABASE_DB_URL
gh secret set BACKUP_GPG_PASSPHRASE
```

(Each command prompts for the value so it never appears in shell history.)

### Smoke-test

```bash
gh workflow run "Database backup"
gh run watch
```

Then check the run page for the `db-backup-<timestamp>` artifact.

## Restore procedure

### 1. Download the artifact

```bash
# List recent runs
gh run list --workflow "Database backup" --limit 10

# Download artifact from a specific run
gh run download <run-id> --name db-backup-<timestamp>
```

### 2. Decrypt

```bash
gpg --batch --yes --passphrase "$BACKUP_GPG_PASSPHRASE" \
    --decrypt backup-<timestamp>.dump.gpg > backup.dump
```

### 3. Restore

**To a fresh local Postgres** (recommended for dry-runs):

```bash
createdb openclienting_restore
pg_restore --dbname=openclienting_restore --no-owner --no-privileges --verbose backup.dump
```

**To Supabase** — do not restore directly over a live production database. Restore to a staging project first, verify, then coordinate a cutover. Pseudocode:

```bash
pg_restore \
  --dbname="postgresql://postgres.<staging-ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  --no-owner --no-privileges --clean --if-exists \
  --verbose \
  backup.dump
```

The `--no-owner --no-privileges` flags are required because Supabase manages roles/RLS itself; restoring ownership would conflict.

## Limitations

- **Free-tier Supabase has no built-in automated backups.** This workflow is the *only* line of defense. Test the restore procedure at least once before launch.
- Auth users are stored in the `auth` schema, which `pg_dump` includes by default — but restoring `auth` into a different Supabase project will not transfer working sessions or preserve user IDs cleanly. Treat backups as data-recovery for the application schema (`public`), not as project migration.
- Storage bucket files (Supabase Storage) are **not** in the database dump. If you start using Storage, add a separate backup step.
