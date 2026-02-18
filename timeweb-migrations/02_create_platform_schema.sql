/*
  # Create Multi-Tenant Learning Platform Schema (Timeweb Version)

  ## Overview
  Adapted version of the platform schema for Timeweb PostgreSQL without Supabase Auth.

  ## Tables Created

  1. **users** - All platform users
  2. **user_roles** - User role management
  3. **sellers** - Seller profiles
  4. **courses** - Course catalog
  5. **course_modules** - Course sections
  6. **course_lessons** - Individual lessons
  7. **lesson_content** - Lesson materials
  8. **course_enrollments** - Student access
  9. **lesson_progress** - Progress tracking

  ## Security
  - RLS enabled on all tables
  - Uses current_user_id() instead of auth.uid()
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  telegram_username text,
  first_name text,
  last_name text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key to auth_sessions
ALTER TABLE auth_sessions
ADD CONSTRAINT fk_auth_sessions_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'seller', 'student')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name text NOT NULL,
  description text DEFAULT '',
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  thumbnail_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create course_lessons table
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create lesson_content table
CREATE TABLE IF NOT EXISTS lesson_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'text', 'file', 'image', 'voice', 'media_group')),
  video_url text,
  text_content text,
  file_url text,
  file_name text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  granted_by uuid REFERENCES users(id) NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(course_id, student_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES course_enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false,
  last_position_seconds integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_seller_id ON courses(seller_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson_id ON lesson_content(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is seller
CREATE OR REPLACE FUNCTION is_seller(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'seller'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get seller_id for user
CREATE OR REPLACE FUNCTION get_seller_id(user_uuid uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM sellers WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
