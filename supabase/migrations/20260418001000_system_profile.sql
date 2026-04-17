-- ============================================================
-- 20260418001000_system_profile.sql
--
-- Creates a well-known "system" auth user and profile for
-- non-user-created (editorially curated) content.
--
-- UUID: 00000000-0000-0000-0000-000000000001
-- Email: system@internal.openclientorg.invalid
--   (.invalid TLD is RFC-2606 reserved — cannot receive mail
--    or be used for real logins via Supabase Auth)
-- Password: empty string — this account cannot sign in via
--   password auth. Magic-link delivery is impossible because
--   the domain is unresolvable. The account exists purely as
--   a FK anchor and audit identity.
-- Role: admin — needed so that is_moderator_or_admin() returns
--   true when the import RPCs run in a service-role context
--   and supply this profile as the explicit caller id.
--
-- This migration is idempotent:
--   - ON CONFLICT (id) DO NOTHING on auth.users
--   - ON CONFLICT (id) DO UPDATE on profiles, so the correct
--     role and display_name are guaranteed even on a partial
--     previous run.
-- ============================================================

-- 1. Insert system auth user
-- The on_auth_user_created trigger will fire and create a
-- profiles row with role='contributor'. Step 2 corrects that.
insert into auth.users (
  id,
  email,
  role,
  aud,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  encrypted_password
) values (
  '00000000-0000-0000-0000-000000000001',
  'system@internal.openclientorg.invalid',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '{"provider":"internal","providers":["internal"]}',
  '{"full_name":"OpenClienting Editorial"}',
  false,
  ''  -- empty → cannot sign in; no valid bcrypt hash
) on conflict (id) do nothing;

-- 2. Upsert the profile with the correct role and bio.
-- Covers both: trigger-created row and a clean initial insert.
insert into public.profiles (
  id,
  display_name,
  role,
  bio
) values (
  '00000000-0000-0000-0000-000000000001',
  'OpenClienting Editorial',
  'admin',
  'Editorial account for OpenClienting.org. '
  || 'Content attributed to this profile is editorially curated and sourced — not user-generated.'
) on conflict (id) do update set
  display_name = excluded.display_name,
  role         = excluded.role,
  bio          = excluded.bio,
  updated_at   = now();
