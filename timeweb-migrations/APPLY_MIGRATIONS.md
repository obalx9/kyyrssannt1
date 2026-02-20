# Apply Timeweb Database Migrations

## Quick Start (for Timeweb Cloud)

### Option 1: Using Bash Script (Recommended)

```bash
cd timeweb-migrations
chmod +x apply-all.sh
./apply-all.sh
```

The script will automatically apply all migrations in the correct order.

### Option 2: Manual Application via Timeweb Console

1. Go to your Timeweb Cloud dashboard
2. Navigate to your database
3. Open the SQL Editor / Query Console
4. Copy and paste the contents of each migration file in order:
   - `01_create_auth_system.sql`
   - `02_create_platform_schema.sql`
   - `03_setup_rls_policies.sql`
   - `04_add_additional_features.sql`
   - `05_add_students_table.sql`
   - `06_fix_schema_for_backend.sql`
   - `07_fix_pending_enrollments_and_fk.sql`
   - `08_fix_fk_cascade.sql`
   - `09_fix_student_pinned_posts_fk.sql`
   - `10_fix_telegram_bots_unique_course.sql`
   - `11_cleanup_duplicate_telegram_bots.sql`
   - `12_fix_postgres18_compatibility_and_restore_import.sql`

5. Execute each query
6. Confirm "Success" message appears

### Option 3: Using psql CLI from Your Machine

#### Prerequisites
- PostgreSQL client installed (`psql` command available)
- Database connection details from Timeweb Cloud

#### Steps

1. Set up your `.env` file in the project root:
```bash
TIMEWEB_DB_HOST=your-timeweb-db-host
TIMEWEB_DB_PORT=5432
TIMEWEB_DB_NAME=your-database-name
TIMEWEB_DB_USER=your-db-user
TIMEWEB_DB_PASSWORD=your-db-password
```

2. Run the migration script:
```bash
cd timeweb-migrations
chmod +x apply-all.sh
./apply-all.sh
```

## Verify Migrations

After applying migrations, verify everything is working:

```bash
# Check if all tables were created
psql -h $TIMEWEB_DB_HOST -U $TIMEWEB_DB_USER -d $TIMEWEB_DB_NAME -c "\dt"

# Check specific tables for posts
psql -h $TIMEWEB_DB_HOST -U $TIMEWEB_DB_USER -d $TIMEWEB_DB_NAME -c "SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%post%';"

# Verify course_posts table structure
psql -h $TIMEWEB_DB_HOST -U $TIMEWEB_DB_USER -d $TIMEWEB_DB_NAME -c "\d course_posts"
```

## What Each Migration Does

| Migration | Purpose |
|-----------|---------|
| 01_create_auth_system.sql | Custom authentication system with JWT sessions |
| 02_create_platform_schema.sql | Core tables: users, courses, sellers, enrollments |
| 03_setup_rls_policies.sql | Row-level security policies for data protection |
| 04_add_additional_features.sql | Telegram bots, course posts tables |
| 05_add_students_table.sql | Separate student profiles linked to users |
| 06_fix_schema_for_backend.sql | Adds missing columns for backend API compatibility |
| 07_fix_pending_enrollments_and_fk.sql | Fixes pending enrollments and foreign keys |
| 08_fix_fk_cascade.sql | Ensures cascade delete works properly |
| 09_fix_student_pinned_posts_fk.sql | Fixes student pinned posts foreign keys |
| 10_fix_telegram_bots_unique_course.sql | Adds unique constraint for telegram bots |
| 11_cleanup_duplicate_telegram_bots.sql | Removes duplicate bot configurations |
| 12_fix_postgres18_compatibility_and_restore_import.sql | **NEW** PostgreSQL 18 compatibility + import functionality |

## PostgreSQL 18 Specific Fixes

Migration 12 fixes the following PostgreSQL 18 issues:

1. **Removed deprecated pg_stat_bgwriter columns**
   - Old: `checkpoints_timed`, `checkpoints_req`, etc.
   - Fix: Updated monitoring queries to use compatible columns

2. **TimescaleDB and pg_cron compatibility**
   - Ensures background workers load correctly
   - Fixes scheduler startup issues

3. **System catalog compatibility**
   - Updates queries to work with PostgreSQL 18.1
   - Ensures information_schema queries work correctly

## Post-Migration Steps

1. **Restart Backend API**
```bash
# If using pm2
pm2 restart "backend-api" || npm run start

# If using Docker
docker restart <your-backend-container>
```

2. **Verify Database Connection**
```bash
# From your backend directory
curl http://localhost:3000/api/db-check
```

Expected response:
```json
{
  "status": "connected",
  "connection": "ok",
  "database": "your_database_name",
  "tablesCount": 25,
  "message": "База данных подключена успешно"
}
```

3. **Test Import Functionality**
   - Log into your admin account
   - Configure a Telegram bot
   - Try importing a post via Telegram
   - Verify post appears in course feed

## Troubleshooting

### Error: "table already exists"
- Normal warning, migrations use `CREATE TABLE IF NOT EXISTS`
- Can safely ignore

### Error: "column already exists"
- Migrations check for existing columns
- Safe to continue

### Error: "permission denied"
- Check your database user has proper privileges
- Contact Timeweb support if needed

### PostgreSQL 18 compatibility issues
- Run migration 12 explicitly
- If issues persist, check PostgreSQL logs
- Ensure all extensions (TimescaleDB, pg_cron) are updated

## Support

For issues with migrations:
1. Check Timeweb Cloud console for error messages
2. Review PostgreSQL logs in your database dashboard
3. Verify DATABASE_URL is correct in .env file
4. Contact Timeweb support with migration error details
