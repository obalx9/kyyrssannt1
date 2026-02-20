/*
  # Fix student_pinned_posts foreign key

  ## Problem
  The student_pinned_posts.student_id column has a foreign key referencing users(id),
  but the backend inserts the ID from the students table (not users).
  This causes FK violation errors when students try to pin posts.

  ## Changes
  - Drop the incorrect FK constraint on student_pinned_posts.student_id
  - Add correct FK constraint referencing students(id) instead of users(id)

  ## Notes
  - Existing data is preserved
  - Uses DO block to safely drop old constraint by scanning pg_constraint
*/

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'student_pinned_posts'::regclass
    AND contype = 'f'
    AND conkey = ARRAY(
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'student_pinned_posts'::regclass AND attname = 'student_id'
    );

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE student_pinned_posts DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

ALTER TABLE student_pinned_posts
  ADD CONSTRAINT student_pinned_posts_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
