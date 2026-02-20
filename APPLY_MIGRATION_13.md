# Apply Migration 13 to Timeweb Database

The migration `13_add_file_name_to_course_post_media.sql` needs to be applied to your Timeweb PostgreSQL database to fix file upload issues.

## Option 1: Using Timeweb Cloud Console (Easiest)

1. Go to your Timeweb Cloud dashboard
2. Navigate to your PostgreSQL database
3. Open the SQL Editor / Query Console
4. Copy and paste the entire contents of `timeweb-migrations/13_add_file_name_to_course_post_media.sql`
5. Click Execute
6. Confirm "Success" message appears

## Option 2: Using psql CLI

```bash
# From your project root directory
psql "postgresql://user:password@host:5432/database_name?sslmode=require" < timeweb-migrations/13_add_file_name_to_course_post_media.sql
```

Replace the connection string with your actual Timeweb database credentials.

## Option 3: Using apply-all.sh Script

```bash
cd timeweb-migrations
chmod +x apply-all.sh
./apply-all.sh
```

This will apply all migrations including migration 13.

## What This Migration Does

Updates the `course_post_media` table schema:

1. Adds `file_path` column - stores server file paths for uploaded files
2. Adds `telegram_file_id` column - stores Telegram API file IDs
3. Adds `telegram_thumbnail_file_id` column - stores Telegram thumbnail IDs
4. Adds `file_name` column - stores original filenames
5. Makes `file_url` column nullable - allows uploads with just file_path

This migration fixes file upload compatibility between the backend API and database.

## Error Messages Before Applying

If you see these errors when uploading files:
```
ERROR: column "file_name" of relation "course_post_media" does not exist
ERROR: column "file_path" of relation "course_post_media" does not exist
ERROR: null value in column "file_url" violates not-null constraint
```

Apply this migration to fix them all.
