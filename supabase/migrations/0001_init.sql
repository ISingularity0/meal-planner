create extension if not exists pgcrypto;

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  ingredients jsonb not null default '[]'::jsonb,
  steps text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists meal_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  recipe_id uuid references recipes(id) on delete set null,
  unique (date, slot)
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity numeric,
  unit text,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tables created via the SQL Editor don't always inherit Supabase's default role
-- grants — without this, every query fails with "permission denied for table X"
-- regardless of RLS, before RLS is even evaluated.
grant select, insert, update, delete on recipes to authenticated;
grant select, insert, update, delete on meal_slots to authenticated;
grant select, insert, update, delete on shopping_list_items to authenticated;

alter table recipes enable row level security;
alter table meal_slots enable row level security;
alter table shopping_list_items enable row level security;

-- IMPORTANT: replace every 'REPLACE_WITH_YOUR_FAMILY_EMAIL' below with the actual email
-- you'll use for the shared family login BEFORE running this migration.
-- Also disable public sign-ups in the Supabase dashboard (Authentication ->
-- Providers -> Email -> "Allow new users to sign up"); these policies are the second layer
-- of defense, not the first.

create policy "family full access" on recipes
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');

create policy "family full access" on meal_slots
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');

create policy "family full access" on shopping_list_items
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

-- No SELECT policy on purpose: the bucket is public, so reads via
-- /storage/v1/object/public/... bypass RLS. A SELECT policy would additionally allow
-- listing/enumerating every file in the bucket, which we don't want.

create policy "family upload recipe photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-photos' and (auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');

create policy "family update recipe photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-photos' and (auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check (bucket_id = 'recipe-photos' and (auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');

create policy "family delete recipe photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-photos' and (auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');
