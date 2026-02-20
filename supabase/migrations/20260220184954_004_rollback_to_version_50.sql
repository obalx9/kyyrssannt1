/*
  # Rollback to Version 50 - Database State

  1. Drop all tables created in versions 51+
  2. Remove new columns added in versions 51+
  3. Return to version 50 schema state
  
  Note: This migration rolls back to the exact database state as of version 50
*/

DO $$ BEGIN
  DROP TABLE IF EXISTS student_pinned_posts CASCADE;
  DROP TABLE IF EXISTS telegram_media_group_buffer CASCADE;
  DROP TABLE IF EXISTS telegram_import_sessions CASCADE;
  DROP TABLE IF EXISTS course_post_media CASCADE;
  DROP TABLE IF EXISTS course_posts CASCADE;
  DROP TABLE IF EXISTS lesson_progress CASCADE;
  DROP TABLE IF EXISTS lesson_content CASCADE;
  DROP TABLE IF EXISTS course_lessons CASCADE;
  DROP TABLE IF EXISTS course_modules CASCADE;
  DROP TABLE IF EXISTS pending_enrollments CASCADE;
  DROP TABLE IF EXISTS course_enrollments CASCADE;
  DROP TABLE IF EXISTS students CASCADE;
  DROP TABLE IF EXISTS telegram_bots CASCADE;
  DROP TABLE IF EXISTS courses CASCADE;
  DROP TABLE IF EXISTS sellers CASCADE;
  DROP TABLE IF EXISTS user_roles CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  DROP TABLE IF EXISTS auth_sessions CASCADE;
END $$;
