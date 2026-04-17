-- ============================================================
-- 20260418000200_review_organization_verification_rpc.sql
-- Atomic RPC for moderator/admin org verification decisions.
--
-- Wraps the two-step write (update organizations.verification_status
-- + insert verification_reviews) in a single implicit transaction so
-- the org state and its audit row are always consistent.
--
-- SECURITY INVOKER: RLS on both tables still applies.
-- The function additionally checks the caller's profile role so
-- it fails fast with a clear message rather than an RLS silence.
-- ============================================================

create or replace function public.review_organization_verification(
  p_org      uuid,
  p_decision text,   -- 'approved' | 'rejected'
  p_notes    text    -- nullable
)
returns void
language plpgsql
security invoker
as $$
declare
  v_new_status text;
begin
  -- Validate decision value
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid decision: %', p_decision;
  end if;

  -- Check caller is moderator or admin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('moderator', 'admin')
  ) then
    raise exception 'permission denied: moderator or admin role required';
  end if;

  -- Map decision -> verification_status
  v_new_status := case p_decision
    when 'approved' then 'verified'
    else 'rejected'
  end;

  -- 1) Update org status
  update public.organizations
  set verification_status = v_new_status
  where id = p_org;

  if not found then
    raise exception 'organization not found: %', p_org;
  end if;

  -- 2) Insert audit row (same transaction)
  insert into public.verification_reviews (
    target_type,
    target_id,
    reviewer_id,
    decision,
    notes
  ) values (
    'organization',
    p_org,
    auth.uid(),
    p_decision,
    nullif(trim(coalesce(p_notes, '')), '')
  );
end;
$$;

grant execute on function public.review_organization_verification(uuid, text, text) to authenticated;
