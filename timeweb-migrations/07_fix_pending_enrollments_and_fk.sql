/*
  # Fix pending_enrollments schema and course_enrollments FK

  ## Overview
  Two database issues causing errors:

  1. **pending_enrollments** table has wrong column names:
     - Has `telegram_user_id` (bigint, NOT NULL) but backend queries/inserts `telegram_id` (text, nullable)
     - Missing `granted_by` column (uuid, references users)
     - Missing `expires_at` column (timestamptz)
     - The old UNIQUE constraint on `telegram_user_id` needs to be dropped

  2. **course_enrollments.student_id** FK still references `users(id)` instead of `students(id)`:
     - The migration 05 was conditional and may not have applied if `student_ref_id` already existed
     - This migration force-fixes it safely

  ## Changes

  ### pending_enrollments
  - Rename `telegram_user_id` to `telegram_id` and change type to text (nullable)
  - Add `granted_by` column (uuid)
  - Add `expires_at` column (timestamptz)
  - Drop old NOT NULL constraint and UNIQUE constraint
  - Migrate existing data

  ### course_enrollments
  - Drop FK constraint referencing `users`
  - Re-create FK referencing `students`
  - Auto-create student records for any enrolled users that don't have one yet
*/

-- ============================================================
-- Fix 1: pending_enrollments schema
-- ============================================================

-- Add telegram_id column (text, nullable) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_id'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN telegram_id text;

    -- Migrate data from telegram_user_id if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_user_id'
    ) THEN
      UPDATE pending_enrollments SET telegram_id = telegram_user_id::text;
    END IF;
  END IF;
END $$;

-- Add granted_by column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN granted_by uuid;
  END IF;
END $$;

-- Add expires_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Drop old UNIQUE constraint on (course_id, telegram_user_id) if exists
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_name = 'pending_enrollments'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%telegram_user_id%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE pending_enrollments DROP CONSTRAINT IF EXISTS ' || v_constraint;
  END IF;
END $$;

-- Drop old telegram_user_id column if it still exists (after data was migrated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_user_id'
  ) THEN
    ALTER TABLE pending_enrollments DROP COLUMN telegram_user_id;
  END IF;
END $$;

-- ============================================================
-- Fix 2: course_enrollments.student_id FK -> students table
-- ============================================================

-- Ensure students table exists (idempotent)
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Check what the current FK on course_enrollments.student_id points to
DO $$
DECLARE
  v_fk_table text;
  v_constraint_name text;
BEGIN
  -- Find the FK constraint and what table it references
  SELECT
    ccu.table_name,
    rc.constraint_name
  INTO v_fk_table, v_constraint_name
  FROM information_schema.referential_constraints rc
  JOIN information_schema.key_column_usage kcu
    ON rc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
  WHERE kcu.table_name = 'course_enrollments'
    AND kcu.column_name = 'student_id';

  -- Only fix if FK points to users (not already fixed)
  IF v_fk_table = 'users' AND v_constraint_name IS NOT NULL THEN

    -- Create student records for all enrolled users that don't have one
    INSERT INTO students (user_id, created_at)
    SELECT DISTINCT ce.student_id, now()
    FROM course_enrollments ce
    WHERE ce.student_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM students s WHERE s.user_id = ce.student_id
      )
    ON CONFLICT (user_id) DO NOTHING;

    -- Add a temporary column to hold the new students.id reference
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'course_enrollments' AND column_name = 'student_ref_id'
    ) THEN
      ALTER TABLE course_enrollments ADD COLUMN student_ref_id uuid;
    END IF;

    -- Populate it
    UPDATE course_enrollments ce
    SET student_ref_id = s.id
    FROM students s
    WHERE s.user_id = ce.student_id;

    -- Drop old FK and column
    EXECUTE 'ALTER TABLE course_enrollments DROP CONSTRAINT ' || v_constraint_name;
    ALTER TABLE course_enrollments DROP COLUMN student_id;
    ALTER TABLE course_enrollments RENAME COLUMN student_ref_id TO student_id;

    -- Add new FK pointing to students
    ALTER TABLE course_enrollments
      ADD CONSTRAINT fk_enrollment_student
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

    ALTER TABLE course_enrollments ALTER COLUMN student_id SET NOT NULL;

    RAISE NOTICE 'Fixed course_enrollments.student_id FK to reference students table';
  ELSE
    RAISE NOTICE 'course_enrollments.student_id FK already points to students or no FK found, skipping';
  END IF;
END $$;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_course_id ON pending_enrollments(course_id);
