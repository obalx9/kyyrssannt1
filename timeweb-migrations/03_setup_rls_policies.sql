/*
  # Setup Row Level Security Policies (Timeweb Version)

  ## Overview
  Configures RLS policies for all tables using current_user_id() instead of auth.uid().

  ## Security Notes
  - All policies use current_user_id() which must be set by the application
  - Super admins have elevated access
  - Sellers can only manage their own content
  - Students can only access enrolled courses
*/

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (current_user_id() = id OR is_super_admin(current_user_id()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (current_user_id() = id)
  WITH CHECK (current_user_id() = id);

CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (current_user_id() = user_id OR is_super_admin(current_user_id()));

CREATE POLICY "Super admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (is_super_admin(current_user_id()));

CREATE POLICY "Super admins can update roles"
  ON user_roles FOR UPDATE
  USING (is_super_admin(current_user_id()))
  WITH CHECK (is_super_admin(current_user_id()));

CREATE POLICY "Super admins can delete roles"
  ON user_roles FOR DELETE
  USING (is_super_admin(current_user_id()));

CREATE POLICY "System can insert initial roles"
  ON user_roles FOR INSERT
  WITH CHECK (current_user_id() = user_id);

-- RLS Policies for sellers table
CREATE POLICY "Anyone can view approved sellers"
  ON sellers FOR SELECT
  USING (is_approved = true OR user_id = current_user_id() OR is_super_admin(current_user_id()));

CREATE POLICY "Users can create seller profile"
  ON sellers FOR INSERT
  WITH CHECK (current_user_id() = user_id);

CREATE POLICY "Sellers can update own profile"
  ON sellers FOR UPDATE
  USING (current_user_id() = user_id)
  WITH CHECK (current_user_id() = user_id);

CREATE POLICY "Super admins can update sellers"
  ON sellers FOR UPDATE
  USING (is_super_admin(current_user_id()))
  WITH CHECK (is_super_admin(current_user_id()));

CREATE POLICY "Super admins can delete sellers"
  ON sellers FOR DELETE
  USING (is_super_admin(current_user_id()));

-- RLS Policies for courses table
CREATE POLICY "Sellers can view own courses"
  ON courses FOR SELECT
  USING (
    seller_id = get_seller_id(current_user_id())
    OR is_super_admin(current_user_id())
    OR EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.course_id = courses.id
      AND course_enrollments.student_id = current_user_id()
    )
  );

CREATE POLICY "Sellers can create courses"
  ON courses FOR INSERT
  WITH CHECK (seller_id = get_seller_id(current_user_id()) AND is_seller(current_user_id()));

CREATE POLICY "Sellers can update own courses"
  ON courses FOR UPDATE
  USING (seller_id = get_seller_id(current_user_id()))
  WITH CHECK (seller_id = get_seller_id(current_user_id()));

CREATE POLICY "Sellers can delete own courses"
  ON courses FOR DELETE
  USING (seller_id = get_seller_id(current_user_id()) OR is_super_admin(current_user_id()));

-- RLS Policies for course_modules table
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
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = current_user_id()
        )
      )
    )
  );

CREATE POLICY "Sellers can insert course modules"
  ON course_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update course modules"
  ON course_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can delete course modules"
  ON course_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_modules.course_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- RLS Policies for course_lessons table
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
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = current_user_id()
        )
      )
    )
  );

CREATE POLICY "Sellers can insert course lessons"
  ON course_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_modules
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update course lessons"
  ON course_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_modules
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_modules
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can delete course lessons"
  ON course_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course_modules
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- RLS Policies for lesson_content table
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
          SELECT 1 FROM course_enrollments
          WHERE course_enrollments.course_id = courses.id
          AND course_enrollments.student_id = current_user_id()
        )
      )
    )
  );

CREATE POLICY "Sellers can insert lesson content"
  ON lesson_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN course_modules ON course_modules.id = course_lessons.module_id
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_lessons.id = lesson_content.lesson_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can update lesson content"
  ON lesson_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN course_modules ON course_modules.id = course_lessons.module_id
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_lessons.id = lesson_content.lesson_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN course_modules ON course_modules.id = course_lessons.module_id
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_lessons.id = lesson_content.lesson_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

CREATE POLICY "Sellers can delete lesson content"
  ON lesson_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons
      JOIN course_modules ON course_modules.id = course_lessons.module_id
      JOIN courses ON courses.id = course_modules.course_id
      WHERE course_lessons.id = lesson_content.lesson_id
      AND courses.seller_id = get_seller_id(current_user_id())
    )
  );

-- RLS Policies for course_enrollments table
CREATE POLICY "Students can view own enrollments"
  ON course_enrollments FOR SELECT
  USING (
    student_id = current_user_id()
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

-- RLS Policies for lesson_progress table
CREATE POLICY "Students can view own progress"
  ON lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND course_enrollments.student_id = current_user_id()
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
      AND course_enrollments.student_id = current_user_id()
    )
  );

CREATE POLICY "Students can update own progress"
  ON lesson_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND course_enrollments.student_id = current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_enrollments
      WHERE course_enrollments.id = lesson_progress.enrollment_id
      AND course_enrollments.student_id = current_user_id()
    )
  );

-- RLS Policies for auth_sessions table
CREATE POLICY "Users can view own sessions"
  ON auth_sessions FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY "System can create sessions"
  ON auth_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own sessions"
  ON auth_sessions FOR DELETE
  USING (user_id = current_user_id());
