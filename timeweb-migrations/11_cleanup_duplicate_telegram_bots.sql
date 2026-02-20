/*
  # Cleanup duplicate telegram_bots records

  ## Problem
  The telegram_bots table accumulated duplicate records:
  - Multiple rows with the same bot_token but different course_id values
  - Rows with course_id = NULL (orphaned records from old registrations)
  - These duplicates caused webhook routing failures: Telegram sends updates to one
    webhook URL, but the backend validates against a different webhook_secret,
    causing 403 Forbidden and the bot not responding.

  ## Changes
  1. Remove orphaned rows where course_id IS NULL
  2. For tokens assigned to multiple courses, keep only the most recently created row
  3. Result: one bot record per unique token, always tied to a course

  ## How to apply
  Run this SQL directly on the Timeweb PostgreSQL database.
*/

DELETE FROM telegram_bots
WHERE course_id IS NULL;

DELETE FROM telegram_bots
WHERE id NOT IN (
  SELECT DISTINCT ON (bot_token) id
  FROM telegram_bots
  ORDER BY bot_token, created_at DESC
);
