/*
  # Add S3 storage columns to course_posts

  1. New Columns
    - `s3_key` - S3 object key for downloaded Telegram media
    - `s3_url` - Public S3 URL for direct access to media

  2. Purpose
    - Enable caching of Telegram media files to S3 for faster access
    - Reduce dependency on Telegram API for media delivery
    - Improve performance and reliability of media playback

  3. Implementation Details
    - Both columns are optional (media may be stored only in Telegram or in S3)
    - When Telegram file is downloaded, both columns are populated
    - Frontend can use s3_url as primary source, falling back to telegram_file_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_posts' AND column_name = 's3_key'
  ) THEN
    ALTER TABLE course_posts ADD COLUMN s3_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_posts' AND column_name = 's3_url'
  ) THEN
    ALTER TABLE course_posts ADD COLUMN s3_url text;
  END IF;
END $$;
