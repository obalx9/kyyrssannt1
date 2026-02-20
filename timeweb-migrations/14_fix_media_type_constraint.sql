/*
  # Fix media_type constraint in course_post_media

  Updates the constraint to accept 'image' type instead of/in addition to 'photo'
  for compatibility with backend API.

  ## Changes
  - Drop old constraint that only accepts 'photo', 'video', 'document', 'voice', 'media_group'
  - Add new constraint that also accepts 'image' type
*/

DO $$
BEGIN
  ALTER TABLE course_post_media DROP CONSTRAINT IF EXISTS course_post_media_media_type_check;
  ALTER TABLE course_post_media ADD CONSTRAINT course_post_media_media_type_check
    CHECK (media_type IN ('image', 'video', 'document', 'voice', 'media_group', 'photo'));
EXCEPTION WHEN OTHERS THEN
  -- If constraint already updated, continue
  RAISE NOTICE 'Constraint update status: %', SQLERRM;
END $$;
