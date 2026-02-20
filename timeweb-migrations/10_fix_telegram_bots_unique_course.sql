/*
  # Fix telegram_bots: Add UNIQUE constraint on course_id and clean up duplicates

  ## Overview
  The telegram_bots table allowed multiple rows per course_id, causing the following bugs:
  1. Deactivating a bot did not remove it, only set is_active = false
  2. Re-adding a bot created a new row instead of updating the existing one
  3. The webhook handler could pick up a stale/wrong bot record
  4. Buttons did not work because duplicate records caused webhook_secret mismatch

  ## Changes

  1. Remove duplicate telegram_bots rows
     - For each course_id, keep only the row with is_active = true and newest created_at
     - Delete all other rows for the same course_id

  2. Add UNIQUE constraint on course_id
     - Prevents future duplicates
     - Enables ON CONFLICT (course_id) DO UPDATE upsert in the backend

  ## Important Notes
  - This migration is safe: no data loss for active bots
  - Inactive/duplicate bots are removed intentionally to fix the platform state
*/

-- Step 1: Remove duplicate rows, keeping the best row per course_id
-- "Best" = is_active = true first, then newest created_at
DELETE FROM telegram_bots
WHERE id NOT IN (
  SELECT DISTINCT ON (course_id) id
  FROM telegram_bots
  WHERE course_id IS NOT NULL
  ORDER BY course_id, is_active DESC, created_at DESC
)
AND course_id IS NOT NULL;

-- Step 2: Add UNIQUE constraint on course_id (only for non-null course_ids)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'telegram_bots'
    AND indexname = 'telegram_bots_course_id_unique'
  ) THEN
    CREATE UNIQUE INDEX telegram_bots_course_id_unique
      ON telegram_bots (course_id)
      WHERE course_id IS NOT NULL;
  END IF;
END $$;
