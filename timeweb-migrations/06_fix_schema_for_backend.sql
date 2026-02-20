/*
  # Fix schema to match backend API requirements

  ## Overview
  The backend API requires several columns and tables that are missing or mismatched
  in the current database schema. This migration adds them without breaking existing data.

  ## Changes

  1. Add `students` table (new)
     - Separate student profile linked to users

  2. Add missing columns to `sellers`
     - contact_email
     - telegram_channel
     - is_approved (if missing)

  3. Add missing columns to `sellers` for is_approved default false
     (new sellers need admin approval before they can use the platform)

  4. Add missing columns to `telegram_bots`
     - course_id (per-course bot support)
     - created_by (seller reference)
     - last_sync_at

  5. Add missing columns to `course_posts` (for webhook handler)

  6. Add missing columns to `course_post_media`

  7. Create `telegram_media_group_buffer` table

  8. Add missing columns to `courses`

  ## Notes
  - Does NOT modify existing foreign key constraints on course_enrollments
    (the backend handles students lookup via users table join)
  - Safe to run multiple times (all statements use IF NOT EXISTS)
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Backfill students from existing users
INSERT INTO students (user_id, created_at)
SELECT id, now()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM students s WHERE s.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add missing columns to sellers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'contact_email') THEN
    ALTER TABLE sellers ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'telegram_channel') THEN
    ALTER TABLE sellers ADD COLUMN telegram_channel text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sellers' AND column_name = 'is_approved') THEN
    ALTER TABLE sellers ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

-- Add missing columns to telegram_bots
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_bots' AND column_name = 'course_id') THEN
    ALTER TABLE telegram_bots ADD COLUMN course_id uuid REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_bots' AND column_name = 'created_by') THEN
    ALTER TABLE telegram_bots ADD COLUMN created_by uuid REFERENCES sellers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_bots' AND column_name = 'last_sync_at') THEN
    ALTER TABLE telegram_bots ADD COLUMN last_sync_at timestamptz;
  END IF;
END $$;

-- Add missing columns to course_posts
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

-- Add missing columns to course_post_media
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

-- Create telegram_media_group_buffer table
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

-- Add missing columns to courses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'price') THEN
    ALTER TABLE courses ADD COLUMN price numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'telegram_group_id') THEN
    ALTER TABLE courses ADD COLUMN telegram_group_id text;
  END IF;
END $$;

-- Ensure all existing sellers have is_approved set (default to true for existing ones
-- so existing sellers are not blocked)
UPDATE sellers SET is_approved = true WHERE is_approved IS NULL;
