-- ============================================================
-- 029_profile_account_fields.sql
-- Adds editable profile fields (avatar, bio, website, public_email,
-- locale), provisions an avatars storage bucket with owner-only write,
-- and relaxes organizations.created_by so self-deletion cannot orphan
-- organizations that still have remaining members.
-- ============================================================

-- 1. Editable profile fields. All nullable — `profile` rows may predate
--    this migration (handle_new_user trigger only sets display_name + role).
alter table public.profiles
  add column avatar_url   text,
  add column bio          text,
  add column website      text,
  add column public_email text,
  add column locale       text;

-- 2. Lightweight length / format constraints. The locale allow-list lives
--    in src/i18n/languages.ts — keep this CHECK format-only so adding a
--    language never requires a migration. The server action validates
--    against LANGUAGE_CODES before writing.
alter table public.profiles
  add constraint profiles_locale_format
    check (locale is null or locale ~ '^[a-z]{2}$'),
  add constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 500),
  add constraint profiles_website_length
    check (website is null or char_length(website) <= 200),
  add constraint profiles_public_email_length
    check (public_email is null or char_length(public_email) <= 320);

-- RLS: no change needed. profiles_update_own (002) and
-- profiles_select_public (redefined in 026) already cover the new
-- columns. prevent_profile_role_change (025) still guards role.

-- ============================================================
-- 3. Avatars storage bucket — mirrors org-logos (016/017) but scopes
--    writes to the owner via {user_id}/... path convention. Public read
--    so <Image src={avatarUrl}> works unauthenticated in list pages.
--    SVG and GIF are excluded on purpose: SVG is a script-XSS surface
--    even from a public bucket, and animated avatars aren't desired.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  2097152,  -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "avatars_owner_update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "avatars_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

-- ============================================================
-- 4. Protect organizations from cascade-delete on account removal.
--    Until now deleting a user CASCADEd through organizations.created_by,
--    which would wipe verified orgs that still have remaining members.
--    Switch to ON DELETE SET NULL; the app-level delete route refuses to
--    proceed when the caller is the last active admin of any org.
-- ============================================================
alter table public.organizations
  drop constraint organizations_created_by_fkey;

alter table public.organizations
  alter column created_by drop not null,
  add constraint organizations_created_by_fkey
    foreign key (created_by)
    references public.profiles(id)
    on delete set null;
