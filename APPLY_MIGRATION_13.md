# Apply Migration 13 to Timeweb Database

The new migration `13_add_file_name_to_course_post_media.sql` needs to be applied to your Timeweb PostgreSQL database.

## Option 1: Using Timeweb Cloud Console (Easiest)

1. Go to your Timeweb Cloud dashboard
2. Navigate to your PostgreSQL database
3. Open the SQL Editor / Query Console
4. Copy and paste the contents of `timeweb-migrations/13_add_file_name_to_course_post_media.sql`
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

Adds the `file_name` column (text, nullable) to the `course_post_media` table. This column stores the original filename of uploaded files during file upload operations.

## Error Message Before Applying

If you see this error when uploading files:
```
ERROR: column "file_name" of relation "course_post_media" does not exist
```

Apply this migration to fix it.
