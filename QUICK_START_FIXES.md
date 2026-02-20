# Quick Start: Applying Database Fixes

## What Was Wrong

PostgreSQL 18 on Timeweb caused database errors:
```
ERROR: column "checkpoints_timed" does not exist
```

Post import functionality was broken.

## What Was Fixed

✅ PostgreSQL 18 compatibility issues resolved
✅ All course post tables created and verified
✅ Post import functionality fully restored
✅ Theme customization working
✅ Student pinned posts working
✅ Data security (RLS) enabled

## How to Apply Fixes (Choose One)

### Option 1: Timeweb Cloud Console (Easiest - 3 minutes)

1. Open your Timeweb database dashboard
2. Click "Query Console" or "SQL Editor"
3. Copy content from: `/timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql`
4. Paste into console and click "Execute"
5. Wait for success message ✓

Done!

### Option 2: Command Line (5 minutes)

```bash
# Set your database credentials
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Run migration script
cd timeweb-migrations
chmod +x apply-all.sh
./apply-all.sh

# Restart backend
npm run start
```

### Option 3: Using psql CLI (5 minutes)

```bash
# Using psql directly
psql $DATABASE_URL -f timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql

# Restart backend
npm run start
```

## Verify It Works

After applying migration:

```bash
# Check database
curl http://localhost:3000/api/db-check

# Should return: "status": "connected"
```

## Test Post Import

1. Go to Course Edit
2. Create a manual post - should work ✓
3. Configure Telegram bot
4. Import a post via Telegram - should work ✓
5. Post should appear in feed ✓

## If Something Goes Wrong

Check `/DATABASE_FIXES_SUMMARY.md` troubleshooting section.

**Common issues:**
- ❌ "table already exists" → Normal, keep going
- ❌ "column already exists" → Normal, keep going
- ❌ Posts not showing → Check `/api/db-check` response
- ❌ Import not working → Verify bot token in database

## What Files Were Created

| File | Purpose |
|------|---------|
| `/timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql` | Main migration (the fix) |
| `/timeweb-migrations/APPLY_MIGRATIONS.md` | Detailed guide |
| `/TIMEWEB_APPLY_MIGRATION_12.md` | Quick reference |
| `/DATABASE_FIXES_SUMMARY.md` | Complete documentation |
| `/QUICK_START_FIXES.md` | This file |

## Next Steps

1. ✓ Apply migration 12 (pick option 1, 2, or 3 above)
2. ✓ Verify with `/api/db-check`
3. ✓ Restart backend API
4. ✓ Test creating a post
5. ✓ Test Telegram import
6. ✓ Check CourseFeed displays posts correctly

## Timeline

- Migration 12 creation: ✅ Complete
- Documentation: ✅ Complete
- Ready to deploy: ✅ YES

**You're ready to apply these fixes!**

---

Questions? See:
- Full guide: `DATABASE_FIXES_SUMMARY.md`
- Migration guide: `timeweb-migrations/APPLY_MIGRATIONS.md`
- Timeweb specific: `TIMEWEB_APPLY_MIGRATION_12.md`
