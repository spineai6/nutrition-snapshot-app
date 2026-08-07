# Nutrition Snapshot — Frontend (Phase 1 MVP)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` (already points at the live Supabase project)
3. `npm run dev`

## What's built
- **Auth** (`AuthScreen.jsx`) — email/password signup + login via Supabase Auth. A `profiles` row is auto-created on signup (DB trigger, already live).
- **Photo scan** (`PhotoScan.jsx`) — uploads to the `meal-photos` bucket, calls the `analyze-meal` edge function (Gemini vision → nutrition_db match), shows the breakdown. Enforces the 1-scan/day free quota server-side.
- **Manual logging** (`ManualLogForm.jsx`) — search `nutrition_db`, add items with adjustable gram quantities, save as a meal. This is what free users fall back to once the daily photo scan is used.
- **Milestone progress** (`MilestoneProgress.jsx`) — shows X/5 toward the free AI Weekly Plan unlock, per the build spec's no-trial flow.
- **Savings teaser** (`SavingsTeaser.jsx`) — greyed-out weekly savings figure, computed server-side via `get_weekly_savings_teaser()` — zero AI cost.
- **Ledger card** (`LedgerCard.jsx`) — renders the three states from the spec: `preview` (the one-time AI week), `frozen` (loss-aversion reminder), `active_paid` (ongoing paid tier).
- **Meal history** (`MealCard.jsx` + Dashboard) — last 20 meals, photo or manual.

## Not built yet (next steps)
- The actual milestone → Claude weekly-replan trigger (build-spec item 5's second half — the trigger exists in the DB, but nothing calls Claude yet when `milestone_5_hit_at` gets set)
- Razorpay subscription flow (item 7)
- The rule-based swap suggestion UI on a logged meal (item 3 — `swap_rules` table is seeded, nothing surfaces it in the UI yet)
- Onboarding/first-run polish, password reset, profile/settings screen

## Notes
- Styling reuses the landing page's cream/lime/navy palette so the app and marketing site feel like one product.
- All Supabase calls go through the shared `src/lib/supabaseClient.js` — RLS handles per-user data isolation, so there's no manual `user_id` filtering needed beyond what's already in each query.
