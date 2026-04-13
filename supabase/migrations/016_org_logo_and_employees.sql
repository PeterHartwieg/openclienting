-- ============================================================
-- Add logo and employee count to organizations
-- ============================================================

alter table public.organizations
  add column logo_url text,
  add column employee_count integer check (employee_count is null or employee_count >= 0);

-- ============================================================
-- Supabase Storage: org-logos bucket (public read)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Anyone can read (public bucket)
create policy "org_logos_public_read" on storage.objects for select
  using (bucket_id = 'org-logos');

-- Authenticated org admins can upload logos for their org
-- Path convention: org-logos/{org_id}/{filename}
create policy "org_logos_admin_insert" on storage.objects for insert
  with check (
    bucket_id = 'org-logos'
    and auth.uid() is not null
    and public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
  );

-- Admins can update/overwrite their org's logos
create policy "org_logos_admin_update" on storage.objects for update
  using (
    bucket_id = 'org-logos'
    and auth.uid() is not null
    and public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
  );

-- Admins can delete their org's logos
create policy "org_logos_admin_delete" on storage.objects for delete
  using (
    bucket_id = 'org-logos'
    and auth.uid() is not null
    and public.is_org_admin((storage.foldername(name))[1]::uuid, auth.uid())
  );
