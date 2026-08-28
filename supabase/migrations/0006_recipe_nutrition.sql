-- Nutrition per portion. The base recipe (servings = 1) counts as one portion, so the
-- calendar's day total is simply the sum of each entry's values times its servings.
alter table recipes add column if not exists kcal int;
alter table recipes add column if not exists protein_g numeric;
alter table recipes add column if not exists fat_g numeric;
alter table recipes add column if not exists carbs_g numeric;
