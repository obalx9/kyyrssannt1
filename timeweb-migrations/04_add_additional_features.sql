/*
  # Add Additional Platform Features (Timeweb Version)

  ## Overview
  Adds telegram integration, course posts, pinned posts, themes, and other features.

  ## Tables Created

  1. **telegram_bots** - Telegram bot configurations
  2. **pending_enrollments** - Pending student enrollments
  3. **course_posts** - Unified course content feed
  4. **course_post_media** - Media attachments for posts
  5. **student_pinned_posts** - Student's pinned posts
  6. **telegram_import_sessions** - Track telegram import progress

  ## New Columns
  - courses.display_settings - Display configuration (JSON)
  - courses.theme_config - Theme customization (JSON)
  - courses.watermark_text - Watermark for protected content
*/

-- Create telegram_bots table
CREATE TABLE IF NOT EXISTS telegram_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  bot_token text NOT NULL,
  bot_username text,
  webhook_secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_bots_seller_id ON telegram_bots(seller_id);

-- Create pending_enrollments table
CREATE TABLE IF NOT EXISTS pending_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  telegram_user_id bigint NOT NULL,
  telegram_username text,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, telegram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_enrollments_course_id ON pending_enrollments(course_id);

-- Create course_posts table (unified content feed)
CREATE TABLE IF NOT EXISTS course_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  telegram_message_id bigint,
  content text,
  author_name text,
  post_style text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  is_pinned boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_course_posts_course_id ON course_posts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_posts_telegram_message_id ON course_posts(telegram_message_id);

-- Create course_post_media table
CREATE TABLE IF NOT EXISTS course_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES course_posts(id) ON DELETE CASCADE NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video', 'document', 'voice', 'media_group')),
  file_url text NOT NULL,
  file_id text,
  thumbnail_url text,
  caption text,
  media_group_id text,
  duration_seconds integer,
  file_size bigint,
  mime_type text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_post_media_post_id ON course_post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_course_post_media_media_group_id ON course_post_media(media_group_id);

-- Create student_pinned_posts table
CREATE TABLE IF NOT EXISTS student_pinned_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES course_posts(id) ON DELETE CASCADE NOT NULL,
  pinned_at timestamptz DEFAULT now(),
  UNIQUE(student_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_student_pinned_posts_student_id ON student_pinned_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_pinned_posts_post_id ON student_pinned_posts(post_id);

-- Create telegram_import_sessions table
CREATE TABLE IF NOT EXISTS telegram_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  channel_username text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_messages integer DEFAULT 0,
  imported_messages integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_telegram_import_sessions_course_id ON telegram_import_sessions(course_id);

-- Add new columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS display_settings jsonb DEFAULT '{
  "showAuthor": true,
  "showDate": true,
  "emojiPattern": "books"
}'::jsonb;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS theme_config jsonb DEFAULT '{
  "preset": "pure-light",
  "customizations": {}
}'::jsonb;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS watermark_text text;

-- Enable RLS on new tables
ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_pinned_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_bots
CREATE POLICY "Sellers can view own bots"
  ON telegram_bots FOR SELECT
  USING (seller_id = get_seller_id(current_user_id()) OR is_super_admin(current_user_id()));

CREATE POLICY "Sellers can insert own bots"
  ON telegram_bots FOR INSERT
  WITH CHECK (seller_id = get_seller_id(current_user_id()));

CREATE POLICY "Sellers can update own bots"
  ON telegram_bots FOR UPDATE
  USING (seller_id = get_seller_id(current_user_id()))
  WITH CHECK (seller_id = get_seller_id(current_user_id()));

CREATE POLICY "Sellers can delete own bots"
  ON telegram_bots FOR DELETE
  USING (seller_id = get_seller_id(current_user_id()));

CREATE POLICY "Anyone can read bot username for auth"
  ON telegram_bots FOR SELECT
  USING (bot_username IS NOT NULL);

-- RLS Policies for pending_enrollments
CREATE POLICY "Sellers can view pending enrollments for own courses"
  ON pending_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = pending_enrollments.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "System can insert pending enrollments"
  ON pending_enrollments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sellers can delete pending enrollments for own courses"
  ON pending_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = pending_enrollments.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Users can delete own pending enrollment"
  ON pending_enrollments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.telegram_id = pending_enrollments.telegram_user_id
      AND users.id = current_user_id()
    )
  );

-- RLS Policies for course_posts
CREATE POLICY "Students can view posts from enrolled courses"
  ON course_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = course_posts.course_id
      AND course_enrollments.student_id = current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_posts.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
    OR is_super_admin(current_user_id())
  );

CREATE POLICY "Sellers can insert posts to own courses"
  ON course_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_posts.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update posts in own courses"
  ON course_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_posts.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_posts.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can delete posts from own courses"
  ON course_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_posts.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- RLS Policies for course_post_media
CREATE POLICY "Students can view media from enrolled courses"
  ON course_post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_posts
      JOIN course_enrollments ON course_enrollments.course_id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND course_enrollments.student_id = current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM course_posts
      JOIN courses ON courses.id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
    OR is_super_admin(current_user_id())
  );

CREATE POLICY "Sellers can insert media to own course posts"
  ON course_post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_posts
      JOIN courses ON courses.id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update media in own course posts"
  ON course_post_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_posts
      JOIN courses ON courses.id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_posts
      JOIN courses ON courses.id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can delete media from own course posts"
  ON course_post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course_posts
      JOIN courses ON courses.id = course_posts.course_id
      WHERE course_posts.id = course_post_media.post_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- RLS Policies for student_pinned_posts
CREATE POLICY "Students can view own pinned posts"
  ON student_pinned_posts FOR SELECT
  USING (student_id = current_user_id());

CREATE POLICY "Students can insert own pinned posts"
  ON student_pinned_posts FOR INSERT
  WITH CHECK (
    student_id = current_user_id()
    AND EXISTS (
      SELECT 1 FROM course_posts
      JOIN course_enrollments ON course_enrollments.course_id = course_posts.course_id
      WHERE course_posts.id = student_pinned_posts.post_id
      AND course_enrollments.student_id = current_user_id()
    )
  );

CREATE POLICY "Students can delete own pinned posts"
  ON student_pinned_posts FOR DELETE
  USING (student_id = current_user_id());

-- RLS Policies for telegram_import_sessions
CREATE POLICY "Sellers can view own import sessions"
  ON telegram_import_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = telegram_import_sessions.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
    OR is_super_admin(current_user_id())
  );

CREATE POLICY "Sellers can insert import sessions for own courses"
  ON telegram_import_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = telegram_import_sessions.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update own import sessions"
  ON telegram_import_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = telegram_import_sessions.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = telegram_import_sessions.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- Enable realtime for student_pinned_posts (if supported)
-- Note: This requires pg_cron or similar extension which may not be available on Timeweb
-- ALTER PUBLICATION supabase_realtime ADD TABLE student_pinned_posts;
-- ALTER TABLE student_pinned_posts REPLICA IDENTITY FULL;
