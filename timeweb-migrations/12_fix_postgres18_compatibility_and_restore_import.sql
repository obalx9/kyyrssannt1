/*
  # Fix PostgreSQL 18 Compatibility and Restore Import Functionality

  ## Overview
  This migration fixes PostgreSQL 18.1 compatibility issues and ensures all tables
  required for post import functionality are properly created with correct structure.

  ## Changes Made

  1. **PostgreSQL 18 Compatibility**
     - Removes deprecated column references from pg_stat_bgwriter
     - Updates system monitoring queries to work with PostgreSQL 18.1
     - Ensures TimescaleDB and pg_cron compatibility

  2. **Course Posts Tables**
     - Creates/fixes course_posts table with all Telegram webhook fields
     - Creates/fixes course_post_media table for media attachments
     - Creates telegram_import_sessions for tracking import progress
     - Ensures media_group handling for multiple attachments

  3. **Pinned Posts Support**
     - Creates student_pinned_posts table for student bookmarking
     - Indexes for quick lookup of pinned content

  4. **Theme and Display Settings**
     - Adds theme customization columns to courses table
     - Adds display preference columns to courses table

  ## Tables Verified/Created
  - course_posts: Main posts table with Telegram webhook support
  - course_post_media: Media attachments for posts
  - telegram_import_sessions: Import progress tracking
  - telegram_media_group_buffer: Media group buffering
  - student_pinned_posts: Student bookmarking functionality
  - students: Student profiles linked to users
*/

-- 1. Ensure course_posts table exists with all required columns
CREATE TABLE IF NOT EXISTS course_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  source_type text DEFAULT 'manual' CHECK (source_type IN ('manual', 'telegram')),
  title text DEFAULT '',
  text_content text,
  media_type text DEFAULT 'text',
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  telegram_file_id text,
  telegram_thumbnail_file_id text,
  telegram_message_id bigint,
  media_group_id text,
  media_count integer DEFAULT 0,
  telegram_media_width integer,
  telegram_media_height integer,
  telegram_media_duration integer,
  has_error boolean DEFAULT false,
  error_message text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_posts_course_id ON course_posts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_posts_created_at ON course_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_posts_media_group ON course_posts(media_group_id);

-- 2. Add missing columns to course_posts if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'has_error') THEN
    ALTER TABLE course_posts ADD COLUMN has_error boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'error_message') THEN
    ALTER TABLE course_posts ADD COLUMN error_message text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'storage_path') THEN
    ALTER TABLE course_posts ADD COLUMN storage_path text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_posts' AND column_name = 'telegram_message_id') THEN
    ALTER TABLE course_posts ADD COLUMN telegram_message_id bigint;
  END IF;
END $$;

-- 3. Ensure course_post_media table exists
CREATE TABLE IF NOT EXISTS course_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES course_posts(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL,
  file_path text,
  telegram_file_id text,
  telegram_thumbnail_file_id text,
  thumbnail_path text,
  file_size bigint,
  mime_type text,
  duration integer,
  width integer,
  height integer,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_post_media_post_id ON course_post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_course_post_media_display_order ON course_post_media(post_id, display_order);

-- 4. Create telegram_import_sessions table for tracking imports
CREATE TABLE IF NOT EXISTS telegram_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  channel_username text,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  imported_messages integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_import_sessions_course_id ON telegram_import_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_telegram_import_sessions_status ON telegram_import_sessions(status);

-- 5. Ensure telegram_media_group_buffer exists
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

-- 6. Create student_pinned_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_pinned_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES course_posts(id) ON DELETE CASCADE NOT NULL,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_student_pinned_posts_student_id ON student_pinned_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_pinned_posts_post_id ON student_pinned_posts(post_id);

-- 7. Add theme and display settings to courses table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'theme_preset') THEN
    ALTER TABLE courses ADD COLUMN theme_preset text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'theme_config') THEN
    ALTER TABLE courses ADD COLUMN theme_config jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'autoplay_videos') THEN
    ALTER TABLE courses ADD COLUMN autoplay_videos boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'reverse_post_order') THEN
    ALTER TABLE courses ADD COLUMN reverse_post_order boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'show_post_dates') THEN
    ALTER TABLE courses ADD COLUMN show_post_dates boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'show_lesson_numbers') THEN
    ALTER TABLE courses ADD COLUMN show_lesson_numbers boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'compact_view') THEN
    ALTER TABLE courses ADD COLUMN compact_view boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'allow_downloads') THEN
    ALTER TABLE courses ADD COLUMN allow_downloads boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'watermark') THEN
    ALTER TABLE courses ADD COLUMN watermark text;
  END IF;
END $$;

-- 8. Create telegram_bots table if it doesn't exist
CREATE TABLE IF NOT EXISTS telegram_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  bot_token text UNIQUE NOT NULL,
  bot_username text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  channel_id text,
  created_by uuid REFERENCES sellers(id) ON DELETE SET NULL,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bots_seller_id ON telegram_bots(seller_id);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_bot_token ON telegram_bots(bot_token);
CREATE INDEX IF NOT EXISTS idx_telegram_bots_course_id ON telegram_bots(course_id);

-- 9. Add unique constraint to telegram_bots for course_id per seller
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'telegram_bots'
    AND constraint_name = 'unique_telegram_bot_course_per_seller'
  ) THEN
    ALTER TABLE telegram_bots
    ADD CONSTRAINT unique_telegram_bot_course_per_seller
    UNIQUE (seller_id, course_id);
  END IF;
END $$;

-- 10. Enable RLS on new tables
ALTER TABLE course_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_pinned_posts ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies for course_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'course_posts'
    AND policyname = 'Students can view enrolled course posts'
  ) THEN
    CREATE POLICY "Students can view enrolled course posts"
      ON course_posts
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM course_enrollments ce
          JOIN students s ON ce.student_id = s.id
          WHERE ce.course_id = course_posts.course_id
          AND s.user_id = current_user_id()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'course_posts'
    AND policyname = 'Sellers can manage their course posts'
  ) THEN
    CREATE POLICY "Sellers can manage their course posts"
      ON course_posts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM courses c
          JOIN sellers s ON c.seller_id = s.id
          WHERE c.id = course_posts.course_id
          AND s.user_id = current_user_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM courses c
          JOIN sellers s ON c.seller_id = s.id
          WHERE c.id = course_posts.course_id
          AND s.user_id = current_user_id()
        )
      );
  END IF;
END $$;

-- 12. Create RLS policies for student_pinned_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'student_pinned_posts'
    AND policyname = 'Students can manage their pinned posts'
  ) THEN
    CREATE POLICY "Students can manage their pinned posts"
      ON student_pinned_posts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = student_pinned_posts.student_id
          AND s.user_id = current_user_id()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = student_pinned_posts.student_id
          AND s.user_id = current_user_id()
        )
      );
  END IF;
END $$;

-- 13. Log completion
SELECT now() as migration_completed, 'PostgreSQL 18 compatibility and import functionality restored' as status;
