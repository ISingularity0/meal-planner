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

alter table recipes enable row level security;
alter table meal_slots enable row level security;
alter table shopping_list_items enable row level security;

create policy "authenticated full access" on recipes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on meal_slots
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on shopping_list_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

create policy "authenticated upload recipe photos" on storage.objects
  for insert with check (bucket_id = 'recipe-photos' and auth.role() = 'authenticated');

create policy "public read recipe photos" on storage.objects
  for select using (bucket_id = 'recipe-photos');

create policy "authenticated update recipe photos" on storage.objects
  for update using (bucket_id = 'recipe-photos' and auth.role() = 'authenticated');

create policy "authenticated delete recipe photos" on storage.objects
  for delete using (bucket_id = 'recipe-photos' and auth.role() = 'authenticated');
