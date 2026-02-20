/*
  # Fix course_post_media schema for backend API compatibility

  ## Overview
  Updates the course_post_media table to properly support file uploads from the backend API.
  The backend API uses file_path instead of file_url, and needs additional columns for
  proper file management.

  ## Changes
  - Make file_url column nullable (was NOT NULL, now allows NULL)
  - Add file_path column for storing server file paths
  - Add telegram_file_id column for Telegram API integration
  - Add telegram_thumbnail_file_id column for Telegram thumbnails
  - Add file_name column for original filenames

  ## Tables Modified
  - course_post_media: Updated schema to match backend API requirements

  ## Important Notes
  - file_url can now be NULL when file_path is provided
  - file_path stores the actual server path to uploaded files
  - All new columns are nullable for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_post_media' AND column_name = 'file_path'
  ) THEN
    ALTER TABLE course_post_media ADD COLUMN file_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_post_media' AND column_name = 'telegram_file_id'
  ) THEN
    ALTER TABLE course_post_media ADD COLUMN telegram_file_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_post_media' AND column_name = 'telegram_thumbnail_file_id'
  ) THEN
    ALTER TABLE course_post_media ADD COLUMN telegram_thumbnail_file_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_post_media' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE course_post_media ADD COLUMN file_name text;
  END IF;
END $$;

-- Make file_url nullable to support file_path-based uploads
ALTER TABLE course_post_media ALTER COLUMN file_url DROP NOT NULL;
