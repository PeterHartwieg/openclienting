-- ============================================================
-- OpenClienting.org — Seed Tags
-- ============================================================

-- Industry tags
insert into public.tags (name, slug, category) values
  ('Manufacturing', 'manufacturing', 'industry'),
  ('Logistics', 'logistics', 'industry'),
  ('Retail', 'retail', 'industry'),
  ('Energy', 'energy', 'industry'),
  ('Construction', 'construction', 'industry'),
  ('Healthcare', 'healthcare', 'industry');

-- Function tags
insert into public.tags (name, slug, category) values
  ('Operations', 'operations', 'function'),
  ('Quality', 'quality', 'function'),
  ('Procurement', 'procurement', 'function'),
  ('IT', 'it', 'function'),
  ('Finance', 'finance', 'function');

-- Problem category tags
insert into public.tags (name, slug, category) values
  ('Efficiency', 'efficiency', 'problem_category'),
  ('Compliance', 'compliance', 'problem_category'),
  ('Visibility', 'visibility', 'problem_category'),
  ('Cost Reduction', 'cost_reduction', 'problem_category');

-- Company size tags
insert into public.tags (name, slug, category) values
  ('Micro', 'micro', 'company_size'),
  ('Small', 'small', 'company_size'),
  ('Medium', 'medium', 'company_size');
