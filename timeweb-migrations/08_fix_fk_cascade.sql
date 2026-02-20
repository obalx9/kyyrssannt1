/*
  # Fix course_enrollments and pending_enrollments (CASCADE drop + recreate policies)

  ## Problem
  Migration 07 failed because RLS policies depend on columns being dropped.
  This migration:
  1. Drops all dependent RLS policies first
  2. Fixes pending_enrollments schema (telegram_user_id -> telegram_id)
  3. Fixes course_enrollments.student_id FK to reference students(id) instead of users(id)
  4. Recreates all RLS policies

  ## Important
  Run this entire script at once in TablePlus (Ctrl+A then Ctrl+R).
*/

-- ============================================================
-- Step 1: Drop dependent RLS policies on pending_enrollments
-- ============================================================

DROP POLICY IF EXISTS "Users can delete own pending enrollment" ON pending_enrollments;
DROP POLICY IF EXISTS "Users can view own pending enrollment" ON pending_enrollments;
DROP POLICY IF EXISTS "System can insert pending enrollments" ON pending_enrollments;
DROP POLICY IF EXISTS "Sellers can manage pending enrollments" ON pending_enrollments;
DROP POLICY IF EXISTS "Sellers can view pending enrollments" ON pending_enrollments;
DROP POLICY IF EXISTS "Sellers can delete pending enrollments" ON pending_enrollments;
DROP POLICY IF EXISTS "Sellers can insert pending enrollments" ON pending_enrollments;

-- ============================================================
-- Step 2: Drop dependent RLS policies on course_enrollments
-- ============================================================

DROP POLICY IF EXISTS "Students can view own enrollments" ON course_enrollments;
DROP POLICY IF EXISTS "Sellers can enroll students in own courses" ON course_enrollments;
DROP POLICY IF EXISTS "Sellers can delete enrollments for own courses" ON course_enrollments;
DROP POLICY IF EXISTS "Super admins can manage enrollments" ON course_enrollments;

-- ============================================================
-- Step 3: Drop dependent RLS policies on other tables that
--         reference course_enrollments.student_id
-- ============================================================

DROP POLICY IF EXISTS "Sellers can view own courses" ON courses;
DROP POLICY IF EXISTS "Users can view modules of enrolled courses" ON course_modules;
DROP POLICY IF EXISTS "Users can view lessons of enrolled courses" ON course_lessons;
DROP POLICY IF EXISTS "Users can view content of enrolled courses" ON lesson_content;
DROP POLICY IF EXISTS "Students can view own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Students can insert own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Students can view posts from enrolled courses" ON course_posts;
DROP POLICY IF EXISTS "Students can view media from enrolled courses" ON course_post_media;
DROP POLICY IF EXISTS "Students can insert own pinned posts" ON student_pinned_posts;
DROP POLICY IF EXISTS "Students can delete own pinned posts" ON student_pinned_posts;
DROP POLICY IF EXISTS "Students can view own pinned posts" ON student_pinned_posts;

-- ============================================================
-- Step 4: Fix pending_enrollments schema
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_id'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN telegram_id text;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_user_id'
    ) THEN
      UPDATE pending_enrollments SET telegram_id = telegram_user_id::text;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'granted_by'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN granted_by uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE pending_enrollments ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pending_enrollments' AND column_name = 'telegram_user_id'
  ) THEN
    ALTER TABLE pending_enrollments DROP COLUMN telegram_user_id CASCADE;
  END IF;
END $$;

-- ============================================================
-- Step 5: Ensure students table exists
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- ============================================================
-- Step 6: Fix course_enrollments.student_id FK
-- ============================================================

DO $$
DECLARE
  v_fk_table text;
  v_constraint_name text;
BEGIN
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

  IF v_fk_table = 'users' AND v_constraint_name IS NOT NULL THEN

    INSERT INTO students (user_id, created_at)
    SELECT DISTINCT ce.student_id, now()
    FROM course_enrollments ce
    WHERE ce.student_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM students s WHERE s.user_id = ce.student_id
      )
    ON CONFLICT (user_id) DO NOTHING;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'course_enrollments' AND column_name = 'student_ref_id'
    ) THEN
      ALTER TABLE course_enrollments ADD COLUMN student_ref_id uuid;
    END IF;

    UPDATE course_enrollments ce
    SET student_ref_id = s.id
    FROM students s
    WHERE s.user_id = ce.student_id;

    EXECUTE 'ALTER TABLE course_enrollments DROP CONSTRAINT ' || v_constraint_name;
    ALTER TABLE course_enrollments DROP COLUMN student_id CASCADE;
    ALTER TABLE course_enrollments RENAME COLUMN student_ref_id TO student_id;

    ALTER TABLE course_enrollments
      ADD CONSTRAINT fk_enrollment_student
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

    ALTER TABLE course_enrollments ALTER COLUMN student_id SET NOT NULL;

    RAISE NOTICE 'Fixed course_enrollments.student_id FK to reference students table';
  ELSE
    RAISE NOTICE 'course_enrollments.student_id FK already points to students or no FK found, skipping';
  END IF;
END $$;

-- ============================================================
-- Step 7: Recreate indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_course_id ON pending_enrollments(course_id);

-- ============================================================
-- Step 8: Recreate RLS policies
-- ============================================================

-- courses
CREATE POLICY "Sellers can view own courses"
  ON courses FOR SELECT
  USING (
    seller_id = get_seller_id(current_user_id())
    OR is_super_admin(current_user_id())
    OR EXISTS (
      SELECT 1 FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.id
      WHERE ce.course_id = courses.id
      AND s.user_id = current_user_id()
    )
  );

-- course_modules
CREATE POLICY "Users can view modules of enrolled courses"
  ON course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND (
        courses.seller_id = get_seller_id(current_user_id())
        OR is_super_admin(current_user_id())
        OR EXISTS (
          SELECT 1 FROM course_enrollments ce
          JOIN students s ON ce.student_id = s.id
          WHERE ce.course_id = courses.id
          AND s.user_id = current_user_id()
        )
      )
    )
  );

-- course_lessons
CREATE POLICY "Users can view lessons of enrolled courses"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_modules
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
      AND (
        courses.seller_id = get_seller_id(current_user_id())
        OR is_super_admin(current_user_id())
        OR EXISTS (
          SELECT 1 FROM course_enrollments ce
          JOIN students s ON ce.student_id = s.id
          WHERE ce.course_id = courses.id
          AND s.user_id = current_user_id()
        )
      )
    )
  );

-- lesson_content
CREATE POLICY "Users can view content of enrolled courses"
  ON lesson_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN course_modules ON course_modules.id = course_lessons.module_id
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_lessons.id = lesson_content.lesson_id
      AND (
        courses.seller_id = get_seller_id(current_user_id())
        OR is_super_admin(current_user_id())
        OR EXISTS (
          SELECT 1 FROM course_enrollments ce
          JOIN students s ON ce.student_id = s.id
          WHERE ce.course_id = courses.id
          AND s.user_id = current_user_id()
        )
      )
    )
  );

-- course_enrollments
CREATE POLICY "Students can view own enrollments"
  ON course_enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = course_enrollments.student_id AND s.user_id = current_user_id())
    OR is_super_admin(current_user_id())
    OR EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can enroll students in own courses"
  ON course_enrollments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
    AND granted_by = current_user_id()
  );

CREATE POLICY "Sellers can delete enrollments for own courses"
  ON course_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_enrollments.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
    OR is_super_admin(current_user_id())
  );

-- lesson_progress
CREATE POLICY "Students can view own progress"
  ON lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND EXISTS (SELECT 1 FROM students s WHERE s.id = course_enrollments.student_id AND s.user_id = current_user_id())
    )
    OR is_super_admin(current_user_id())
    OR EXISTS (
      SELECT 1 FROM course_enrollments
      JOIN courses ON courses.id = course_enrollments.course_id
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Students can insert own progress"
  ON lesson_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND EXISTS (SELECT 1 FROM students s WHERE s.id = course_enrollments.student_id AND s.user_id = current_user_id())
    )
  );

CREATE POLICY "Students can update own progress"
  ON lesson_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND EXISTS (SELECT 1 FROM students s WHERE s.id = course_enrollments.student_id AND s.user_id = current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND EXISTS (SELECT 1 FROM students s WHERE s.id = course_enrollments.student_id AND s.user_id = current_user_id())
    )
  );

-- pending_enrollments (recreate basic policies)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'pending_enrollments') THEN
    EXECUTE $pol$
      CREATE POLICY "Sellers can view pending enrollments"
        ON pending_enrollments FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = pending_enrollments.course_id
            AND courses.seller_id = get_seller_id(current_user_id())
          )
          OR is_super_admin(current_user_id())
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "Sellers can insert pending enrollments"
        ON pending_enrollments FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = pending_enrollments.course_id
            AND courses.seller_id = get_seller_id(current_user_id())
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "Sellers can delete pending enrollments"
        ON pending_enrollments FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = pending_enrollments.course_id
            AND courses.seller_id = get_seller_id(current_user_id())
          )
          OR is_super_admin(current_user_id())
        )
    $pol$;
  END IF;
END $$;

-- student_pinned_posts (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'student_pinned_posts') THEN
    EXECUTE $pol$
      CREATE POLICY "Students can view own pinned posts"
        ON student_pinned_posts FOR SELECT
        USING (
          EXISTS (SELECT 1 FROM students s WHERE s.id = student_pinned_posts.student_id AND s.user_id = current_user_id())
          OR is_super_admin(current_user_id())
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "Students can insert own pinned posts"
        ON student_pinned_posts FOR INSERT
        WITH CHECK (
          EXISTS (SELECT 1 FROM students s WHERE s.id = student_pinned_posts.student_id AND s.user_id = current_user_id())
          AND EXISTS (
            SELECT 1 FROM course_enrollments ce
            JOIN course_posts cp ON cp.course_id = ce.course_id
            WHERE cp.id = student_pinned_posts.post_id
            AND ce.student_id = student_pinned_posts.student_id
          )
        )
    $pol$;

    EXECUTE $pol$
      CREATE POLICY "Students can delete own pinned posts"
        ON student_pinned_posts FOR DELETE
        USING (
          EXISTS (SELECT 1 FROM students s WHERE s.id = student_pinned_posts.student_id AND s.user_id = current_user_id())
        )
    $pol$;
  END IF;
END $$;

-- course_posts (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'course_posts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'course_posts' AND policyname = 'Students can view posts from enrolled courses'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY "Students can view posts from enrolled courses"
          ON course_posts FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM courses WHERE courses.id = course_posts.course_id
              AND (
                courses.seller_id = get_seller_id(current_user_id())
                OR is_super_admin(current_user_id())
                OR EXISTS (
                  SELECT 1 FROM course_enrollments ce
                  JOIN students s ON ce.student_id = s.id
                  WHERE ce.course_id = courses.id AND s.user_id = current_user_id()
                )
              )
            )
          )
      $pol$;
    END IF;
  END IF;
END $$;

-- course_post_media (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'course_post_media') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'course_post_media' AND policyname = 'Students can view media from enrolled courses'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY "Students can view media from enrolled courses"
          ON course_post_media FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM course_posts cp
              JOIN courses ON courses.id = cp.course_id
              WHERE cp.id = course_post_media.post_id
              AND (
                courses.seller_id = get_seller_id(current_user_id())
                OR is_super_admin(current_user_id())
                OR EXISTS (
                  SELECT 1 FROM course_enrollments ce
                  JOIN students s ON ce.student_id = s.id
                  WHERE ce.course_id = courses.id AND s.user_id = current_user_id()
                )
              )
            )
          )
      $pol$;
    END IF;
  END IF;
END $$;
