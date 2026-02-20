#!/bin/bash

# Quick script to apply migration 12 for PostgreSQL 18 fix
# Usage: ./apply-migration-12.sh
# Or set DATABASE_URL and run: DATABASE_URL="..." ./apply-migration-12.sh

set -e

echo "=================================="
echo "PostgreSQL 18 Compatibility Fix"
echo "Migration 12 Application"
echo "=================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable not set"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require'"
    echo ""
    echo "Or run:"
    echo "  DATABASE_URL='postgresql://...' ./apply-migration-12.sh"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "Error: psql not installed"
    echo ""
    echo "Install PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="timeweb-migrations/12_fix_postgres18_compatibility_and_restore_import.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    echo ""
    echo "Make sure you're running this from project root directory"
    exit 1
fi

echo "Applying migration 12..."
echo "Database: $DATABASE_URL (first 30 chars shown)"
echo "${DATABASE_URL:0:30}..."
echo ""

# Apply migration
if psql "$DATABASE_URL" -f "$MIGRATION_FILE" > /tmp/migration_12.log 2>&1; then
    echo "✓ Migration applied successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart backend API: npm run start"
    echo "2. Verify connection: curl http://localhost:3000/api/db-check"
    echo "3. Test post import functionality"
    echo ""
    echo "For details, see: QUICK_START_FIXES.md"
    exit 0
else
    echo "✗ Migration failed!"
    echo ""
    echo "Error details:"
    tail -20 /tmp/migration_12.log
    echo ""
    echo "Check full log: /tmp/migration_12.log"
    exit 1
fi
