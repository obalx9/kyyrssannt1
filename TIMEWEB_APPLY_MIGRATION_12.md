# Apply Migration 12 for PostgreSQL 18 Compatibility

## Quick Start for Timeweb Cloud

If you're experiencing database errors like:
```
ERROR: column "checkpoints_timed" does not exist
```

This migration fixes PostgreSQL 18 compatibility issues and restores post import functionality.

## Step-by-Step Instructions

### 1. Open Timeweb Cloud Console

1. Go to your Timeweb Cloud dashboard
2. Select your database (PostgreSQL 18.1)
3. Click on "Query Console" or "SQL Editor"

### 2. Copy the Migration SQL

Go to `/timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql` and copy ALL the SQL code.

### 3. Paste and Execute

1. Paste the entire migration into the Timeweb SQL editor
2. Click "Execute" or "Run"
3. Wait for "Success" message

### 4. Verify the Migration

After successful execution, run these verification queries:

```sql
-- Check if course_posts table exists
SELECT COUNT(*) as table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='course_posts';

-- List all new tables
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name LIKE '%post%';

-- Check course_posts structure
\d course_posts
```

## What This Migration Does

✅ Creates/verifies all course_posts tables with correct structure
✅ Creates course_post_media table for media attachments
✅ Creates telegram_import_sessions for tracking imports
✅ Creates telegram_media_group_buffer for handling media groups
✅ Creates student_pinned_posts for bookmarking
✅ Adds theme and display settings to courses
✅ Fixes PostgreSQL 18 compatibility issues
✅ Sets up Row-Level Security (RLS) for data protection

## Expected Results

After running the migration, you should have:

| Table | Purpose |
|-------|---------|
| course_posts | Main posts table with Telegram support |
| course_post_media | Media files attached to posts |
| telegram_import_sessions | Import progress tracking |
| telegram_media_group_buffer | Media group buffering |
| student_pinned_posts | Student bookmarks |
| telegram_bots | Bot configurations per seller |

## Testing the Import

After migration:

1. Go to your Course Edit page
2. The "Course Posts" tab should display correctly
3. Configure a Telegram bot (Settings tab)
4. Forward messages from your Telegram channel to the bot
5. Posts should appear in the course feed

## Troubleshooting

### Error: "table already exists"
- This is normal - migration uses `IF NOT EXISTS`
- It's safe to continue

### Error: "column already exists"
- Normal - means the column was already created
- Safe to ignore

### Posts not appearing
1. Check database connection: `curl http://your-api:3000/api/db-check`
2. Verify tables were created: Check with `\d course_posts`
3. Check backend logs for errors
4. Restart backend API

### Telegram import not working
1. Verify telegram_bots table has bot_token
2. Check telegram_import_sessions for status='in_progress'
3. Verify webhook URL is correctly configured
4. Check backend API logs for webhook errors

## Rolling Back (if needed)

If something goes wrong, you can rollback by recreating tables:

```sql
DROP TABLE IF EXISTS student_pinned_posts CASCADE;
DROP TABLE IF EXISTS telegram_media_group_buffer CASCADE;
DROP TABLE IF EXISTS telegram_import_sessions CASCADE;
DROP TABLE IF EXISTS course_post_media CASCADE;
DROP TABLE IF EXISTS course_posts CASCADE;
```

Then re-run the migration to restore.

## Next Steps

1. ✅ Run this migration
2. ✅ Restart backend API
3. ✅ Verify database connection
4. ✅ Test importing a post
5. ✅ Check course feed displays correctly

## Support

If you encounter issues:
1. Check Timeweb Cloud dashboard for error messages
2. Review PostgreSQL logs
3. Verify DATABASE_URL in backend .env file
4. Contact Timeweb support with error details

---

**Migration Status:** Ready to apply
**PostgreSQL Version:** 18.1
**Compatibility:** Full PostgreSQL 18 support
