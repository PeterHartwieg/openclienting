-- ============================================================
-- OpenClienting.org — Initial Schema
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'contributor'
    check (role in ('contributor', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tags (moderator-managed taxonomy)
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null
    check (category in ('industry', 'function', 'problem_category', 'company_size', 'technology')),
  created_at timestamptz not null default now(),
  unique (name, category)
);

alter table public.tags enable row level security;

-- Problem Templates (central entity)
create table public.problem_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'in_review', 'published', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.problem_templates enable row level security;

-- Problem ↔ Tag junction
create table public.problem_tags (
  problem_id uuid not null references public.problem_templates(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (problem_id, tag_id)
);

alter table public.problem_tags enable row level security;

-- Requirements (N per problem)
create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problem_templates(id) on delete cascade,
  body text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),
  upvote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requirements enable row level security;

-- Pilot Frameworks (N per problem)
create table public.pilot_frameworks (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.problem_templates(id) on delete cascade,
  scope text,
  suggested_kpis text,
  success_criteria text,
  common_pitfalls text,
  duration text,
  resource_commitment text,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'published', 'rejected')),
  upvote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pilot_frameworks enable row level security;

-- Indexes
create index idx_problem_templates_status on public.problem_templates(status);
create index idx_problem_templates_author on public.problem_templates(author_id);
create index idx_requirements_problem on public.requirements(problem_id);
create index idx_pilot_frameworks_problem on public.pilot_frameworks(problem_id);
create index idx_tags_category on public.tags(category);

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.problem_templates
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.requirements
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.pilot_frameworks
  for each row execute function public.handle_updated_at();
