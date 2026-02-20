/*
  # Add students table and fix sellers table

  ## Overview
  The backend API requires a `students` table to track student profiles separately
  from the `users` table. Also adds missing columns to `sellers` table and fixes
  `course_enrollments` to reference `students` instead of `users` directly.

  ## Changes

  1. New table: `students`
     - Links to `users` via `user_id`
     - Acts as a student profile record

  2. Modified table: `sellers`
     - Adds `contact_email` column (required by backend API)
     - Adds `telegram_channel` column (required by backend API)

  3. Modified table: `course_enrollments`
     - Changes `student_id` reference from `users` to `students`

  4. Modified table: `student_pinned_posts`
     - Changes `student_id` reference from `users` to `students`

  5. Modified table: `telegram_bots`
     - Adds `course_id` column (used by backend for per-course bots)
     - Adds `created_by` column (seller id reference)
     - Adds `last_sync_at` column

  6. Modified table: `course_posts`
     - Adds missing columns used by the backend webhook handler
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Add missing columns to sellers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE sellers ADD COLUMN contact_email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'telegram_channel'
  ) THEN
    ALTER TABLE sellers ADD COLUMN telegram_channel text;
  END IF;
END $$;

-- Add missing columns to telegram_bots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telegram_bots' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE telegram_bots ADD COLUMN course_id uuid REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telegram_bots' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE telegram_bots ADD COLUMN created_by uuid REFERENCES sellers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'telegram_bots' AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE telegram_bots ADD COLUMN last_sync_at timestamptz;
  END IF;
END $$;

-- Fix course_enrollments: change student_id to reference students table
-- First drop the old constraint if it references users
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT constraint_name INTO v_constraint_name
  FROM information_schema.referential_constraints rc
  JOIN information_schema.key_column_usage kcu
    ON rc.constraint_name = kcu.constraint_name
  WHERE kcu.table_name = 'course_enrollments'
    AND kcu.column_name = 'student_id';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE course_enrollments DROP CONSTRAINT IF EXISTS ' || v_constraint_name;
  END IF;
END $$;

-- Now we need to migrate existing enrollments to use students table
-- First, auto-create student records for all enrolled users
INSERT INTO students (user_id, created_at)
SELECT DISTINCT ce.student_id, now()
FROM course_enrollments ce
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.user_id = ce.student_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Rename the column and update references
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_enrollments' AND column_name = 'student_id'
  ) THEN
    -- Add new column for students.id reference
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'course_enrollments' AND column_name = 'student_ref_id'
    ) THEN
      ALTER TABLE course_enrollments ADD COLUMN student_ref_id uuid;

      UPDATE course_enrollments ce
      SET student_ref_id = s.id
      FROM students s
      WHERE s.user_id = ce.student_id;

      ALTER TABLE course_enrollments DROP COLUMN student_id;
      ALTER TABLE course_enrollments RENAME COLUMN student_ref_id TO student_id;

      ALTER TABLE course_enrollments ADD CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

      ALTER TABLE course_enrollments ALTER COLUMN student_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Fix student_pinned_posts: change student_id to reference students table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_pinned_posts' AND column_name = 'student_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'student_pinned_posts' AND column_name = 'student_ref_id'
    ) THEN
      ALTER TABLE student_pinned_posts DROP CONSTRAINT IF EXISTS student_pinned_posts_student_id_fkey;
      ALTER TABLE student_pinned_posts ADD COLUMN student_ref_id uuid;

      INSERT INTO students (user_id, created_at)
      SELECT DISTINCT spp.student_id, now()
      FROM student_pinned_posts spp
      WHERE NOT EXISTS (
        SELECT 1 FROM students s WHERE s.user_id = spp.student_id
      )
      ON CONFLICT (user_id) DO NOTHING;

      UPDATE student_pinned_posts spp
      SET student_ref_id = s.id
      FROM students s
      WHERE s.user_id = spp.student_id;

      ALTER TABLE student_pinned_posts DROP COLUMN student_id;
      ALTER TABLE student_pinned_posts RENAME COLUMN student_ref_id TO student_id;

      ALTER TABLE student_pinned_posts ADD CONSTRAINT fk_pinned_student
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

      ALTER TABLE student_pinned_posts ALTER COLUMN student_id SET NOT NULL;

      ALTER TABLE student_pinned_posts DROP CONSTRAINT IF EXISTS student_pinned_posts_student_id_post_id_key;
      ALTER TABLE student_pinned_posts ADD CONSTRAINT student_pinned_posts_student_id_post_id_key
        UNIQUE (student_id, post_id);
    END IF;
  END IF;
END $$;

-- Add missing columns to course_posts used by the webhook handler
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'source_type') THEN
    ALTER TABLE course_posts ADD COLUMN source_type text DEFAULT 'manual';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'title') THEN
    ALTER TABLE course_posts ADD COLUMN title text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'text_content') THEN
    ALTER TABLE course_posts ADD COLUMN text_content text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'media_type') THEN
    ALTER TABLE course_posts ADD COLUMN media_type text DEFAULT 'text';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_file_id') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_file_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_thumbnail_file_id') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_thumbnail_file_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'media_group_id') THEN
    ALTER TABLE course_posts ADD COLUMN media_group_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'media_count') THEN
    ALTER TABLE course_posts ADD COLUMN media_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'file_name') THEN
    ALTER TABLE course_posts ADD COLUMN file_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'file_size') THEN
    ALTER TABLE course_posts ADD COLUMN file_size bigint;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'mime_type') THEN
    ALTER TABLE course_posts ADD COLUMN mime_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_media_width') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_media_width integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_media_height') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_media_height integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_media_duration') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_media_duration integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'published_at') THEN
    ALTER TABLE course_posts ADD COLUMN published_at timestamptz;
  END IF;
END $$;

-- Add missing columns to course_post_media used by the backend
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'telegram_file_id') THEN
    ALTER TABLE course_post_media ADD COLUMN telegram_file_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'telegram_thumbnail_file_id') THEN
    ALTER TABLE course_post_media ADD COLUMN telegram_thumbnail_file_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'thumbnail_path') THEN
    ALTER TABLE course_post_media ADD COLUMN thumbnail_path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'file_path') THEN
    ALTER TABLE course_post_media ADD COLUMN file_path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'width') THEN
    ALTER TABLE course_post_media ADD COLUMN width integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'height') THEN
    ALTER TABLE course_post_media ADD COLUMN height integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'duration') THEN
    ALTER TABLE course_post_media ADD COLUMN duration integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_post_media' AND column_name = 'display_order') THEN
    ALTER TABLE course_post_media ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Create telegram_media_group_buffer table (used by webhook handler)
CREATE TABLE IF NOT EXISTS telegram_media_group_buffer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  media_group_id text NOT NULL,
  telegram_message_id bigint NOT NULL,
  media_data jsonb NOT NULL,
  caption text,
  message_date timestamptz,
  received_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_group_buffer_course_group ON telegram_media_group_buffer(course_id, media_group_id);

-- Add courses.price column (used by backend)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'price') THEN
    ALTER TABLE courses ADD COLUMN price numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'telegram_group_id') THEN
    ALTER TABLE courses ADD COLUMN telegram_group_id text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
