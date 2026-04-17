-- ============================================================
-- 20260418000100_org_logos_reject_svg.sql
-- Remove image/svg+xml from the org-logos bucket's allowed MIME
-- types. SVG files served from a public bucket are an XSS vector:
-- a browser that follows the direct storage URL renders the SVG as
-- a live HTML/script document in the storage origin's context.
-- Restrict to the same safe set already enforced for avatars
-- (see 029_profile_account_fields.sql).
-- ============================================================

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'org-logos';
