-- Replaces the fixed breakfast/lunch/dinner slots with a simple list of recipes per day.
-- Safe to run even if 0001 already ran and you've been testing — this only affects
-- calendar assignments, not your recipes or shopping list.

drop table if exists meal_slots cascade;

create table if not exists meal_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Tables created fresh via the SQL Editor don't always inherit Supabase's default
-- role grants the way tables from the very first migration did — without this, every
-- query fails with "permission denied for table meal_entries" regardless of RLS.
grant select, insert, update, delete on meal_entries to authenticated;

alter table meal_entries enable row level security;

-- Same rule as before: replace this with the exact email you use for the shared family
-- login before running.
create policy "family full access" on meal_entries
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL')
  with check ((auth.jwt() ->> 'email') = 'REPLACE_WITH_YOUR_FAMILY_EMAIL');
