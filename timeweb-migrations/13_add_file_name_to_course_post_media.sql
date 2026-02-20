/*
  # Add file_name column to course_post_media

  ## Overview
  Adds the file_name column to course_post_media table for storing original filenames
  during file uploads from the backend API.

  ## Changes
  - Add file_name column (text, nullable) to course_post_media table

  ## Tables Modified
  - course_post_media: Added file_name column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_post_media' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE course_post_media ADD COLUMN file_name text;
  END IF;
END $$;
