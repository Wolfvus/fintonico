-- Migration: Fix income table amount_cents NOT NULL constraint
-- Problem: Migration 002 created `amount_cents BIGINT NOT NULL`, migration 004 added `amount DECIMAL(12,2)`
--          but never made amount_cents nullable. The app service uses `amount` column exclusively,
--          so inserts fail with "null value in column amount_cents violates not-null constraint".
-- Solution: Make amount_cents nullable and drop the CHECK constraint.

-- Step 1: Drop the CHECK constraint on amount_cents
ALTER TABLE public.income DROP CONSTRAINT IF EXISTS income_amount_cents_check;

-- Step 2: Make amount_cents nullable
ALTER TABLE public.income ALTER COLUMN amount_cents DROP NOT NULL;

-- Step 3: Ensure `amount` column has NOT NULL for new records (it's the active column)
-- First backfill any rows where amount is null but amount_cents exists
UPDATE public.income SET amount = amount_cents / 100.0 WHERE amount IS NULL AND amount_cents IS NOT NULL;

-- Make amount NOT NULL now that it's the primary column
ALTER TABLE public.income ALTER COLUMN amount SET NOT NULL;
ALTER TABLE public.income ALTER COLUMN amount SET DEFAULT 0;

-- Add CHECK constraint on amount (> 0) to replace the old amount_cents check
ALTER TABLE public.income DROP CONSTRAINT IF EXISTS income_amount_check;
ALTER TABLE public.income ADD CONSTRAINT income_amount_check CHECK (amount > 0);
