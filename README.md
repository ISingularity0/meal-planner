# Family Meal Planner

React + Vite single-page app on Supabase (Postgres + Auth + Storage), deployed to GitHub Pages.
One shared family login — no signup flow in the app. UI is in German.

## Local development

```bash
npm install
npm run dev
```

Requires a `.env` (see setup below).

## Setup checklist

Do these once, in order.

### Supabase

- [ ] Create a free Supabase project at https://supabase.com (e.g. `meal-planner`). Note the
      **Project URL** and **anon public key** (Project Settings → API).
- [ ] Open `supabase/migrations/0001_init.sql` **and** `0002_flexible_meal_entries.sql` and
      replace **every** `REPLACE_WITH_YOUR_FAMILY_EMAIL` with the email you'll use for the
      shared family login. Do this *before* running either migration. `0003_recipe_tags.sql`
      `0004_entry_servings.sql` and `0005_recipe_prep_minutes.sql` have no placeholder —
      nothing to edit there.
- [ ] Run `0001_init.sql`, then `0002_flexible_meal_entries.sql`, then `0003_recipe_tags.sql`,
      then `0004_entry_servings.sql`, then `0005_recipe_prep_minutes.sql`, in the Supabase
      dashboard → SQL Editor, in that order.
      Expected after 0001: `recipes`, `meal_slots`, `shopping_list_items` tables + a
      `recipe-photos` Storage bucket. Expected after 0002: `meal_slots` is replaced by
      `meal_entries` (an open list of recipes per day, not fixed meal slots). Expected after
      0003: `recipes` gets a `tags` column. Expected after 0004: `meal_entries` gets a
      `servings` column (a per-day multiplier for scaling ingredient amounts). Expected after
      0005: `recipes` gets an optional `prep_minutes` column.
- [ ] Authentication → Users → Add user: create the one shared family account, using the exact
      same email you put in the SQL.
- [ ] Authentication → Settings: disable **"Enable email confirmations"** so that account can
      sign in without a confirmation email.
- [ ] **Authentication → Providers → Email: disable "Allow new users to sign up".**
      **Required, not optional.** The anon key is public (it ships in the JS bundle), so with
      open sign-up any stranger could mint an `authenticated` JWT. The email-scoped RLS
      policies are only the second layer of defense.

### Local env

- [ ] Copy `.env.example` to `.env` (gitignored) and fill in:

```
VITE_SUPABASE_URL=<your project URL>
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

### GitHub Pages

- [ ] Create a **public** GitHub repo named `meal-planner` (public is required for free-tier
      Pages). The base path `/meal-planner/` is hard-coded in `vite.config.js`, the PWA
      manifest, and `src/App.jsx` — keep the repo name in sync.
- [ ] Settings → Secrets and variables → Actions: add repo secrets `VITE_SUPABASE_URL` and
      `VITE_SUPABASE_ANON_KEY` (same values as your local `.env`).
- [ ] Settings → Pages → Build and deployment → Source: **GitHub Actions**.
- [ ] Push to `main`. The `Deploy to GitHub Pages` workflow builds and deploys.
- [ ] Visit `https://<your-username>.github.io/meal-planner/`, sign in, and check
      Calendar / Recipes / Shopping list. Deep links and refreshes work via the `404.html`
      SPA fallback the workflow generates.

## Notes

- Never commit `.env` or real Supabase keys — the repo is public.
- No automated test suite by design; verification is manual.
