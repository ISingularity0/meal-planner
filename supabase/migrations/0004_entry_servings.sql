alter table meal_entries add column if not exists servings numeric not null default 1 check (servings > 0);
