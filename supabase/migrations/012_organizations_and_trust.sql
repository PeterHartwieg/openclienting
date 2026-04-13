-- ============================================================
-- OpenClienting.org — Phase 1: Organizations, Memberships,
--   Verification Reviews, and Content Revisions
-- ============================================================

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_verification on public.organizations(verification_status);
create index idx_organizations_created_by on public.organizations(created_by);

create trigger set_updated_at before update on public.organizations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ORGANIZATION MEMBERSHIPS
-- ============================================================

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('member', 'admin')),
  membership_status text not null default 'pending'
    check (membership_status in ('pending', 'active', 'rejected', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

alter table public.organization_memberships enable row level security;

create index idx_memberships_org on public.organization_memberships(organization_id);
create index idx_memberships_user on public.organization_memberships(user_id);
create index idx_memberships_status on public.organization_memberships(membership_status);

create trigger set_updated_at before update on public.organization_memberships
  for each row execute function public.handle_updated_at();

-- ============================================================
-- VERIFICATION REVIEWS (moderator decisions on org/membership)
-- ============================================================

create table public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('organization', 'membership')),
  target_id uuid not null,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (decision in ('approved', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.verification_reviews enable row level security;

create index idx_verification_reviews_target on public.verification_reviews(target_type, target_id);
create index idx_verification_reviews_reviewer on public.verification_reviews(reviewer_id);

-- ============================================================
-- CONTENT REVISIONS (replaces edit_history)
-- ============================================================

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in (
    'problem_template', 'requirement', 'pilot_framework', 'solution_approach'
  )),
  target_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  diff jsonb not null, -- { fieldName: { old: "...", new: "..." } }
  snapshot jsonb, -- full field snapshot at time of edit (approved baseline)
  revision_status text not null default 'pending_recheck'
    check (revision_status in ('pending_recheck', 'approved', 'reverted')),
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now()
);

alter table public.content_revisions enable row level security;

create index idx_content_revisions_target on public.content_revisions(target_type, target_id);
create index idx_content_revisions_author on public.content_revisions(author_id);
create index idx_content_revisions_status on public.content_revisions(revision_status);
