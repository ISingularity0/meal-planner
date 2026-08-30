-- Your own product database. Filled automatically: a scanned barcode is looked up here
-- first, and only fetched from Open Food Facts (and then stored) when it is missing.
-- Values stay editable, so corrections survive instead of being overwritten on the next scan.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique,
  name text not null,
  brand text,
  kcal_100 numeric,
  protein_100 numeric,
  fat_100 numeric,
  carbs_100 numeric,
  -- For units counted in pieces ("1 Stück = 60 g"). Null when unknown.
  grams_per_piece numeric,
  created_at timestamptz not null default now()
);

-- Tables created via the SQL Editor don't always inherit Supabase's default role grants —
-- without this every query fails with "permission denied", before RLS is even evaluated.
grant select, insert, update, delete on products to authenticated;

alter table products enable row level security;

-- Replace with the shared family login's email before running.
create policy "family full access" on products
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');
