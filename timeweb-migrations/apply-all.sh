#!/bin/bash

# Script to apply all Timeweb migrations
# Usage: ./apply-all.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ../.env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file with your Timeweb PostgreSQL credentials:"
    echo ""
    echo "TIMEWEB_DB_HOST=your-host"
    echo "TIMEWEB_DB_PORT=5432"
    echo "TIMEWEB_DB_NAME=your-database"
    echo "TIMEWEB_DB_USER=your-username"
    echo "TIMEWEB_DB_PASSWORD=your-password"
    exit 1
fi

# Load environment variables
source ../.env

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed!${NC}"
    echo "Please install PostgreSQL client."
    echo ""
    echo "macOS: brew install postgresql"
    echo "Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

echo -e "${YELLOW}Starting Timeweb PostgreSQL migrations...${NC}"
echo ""

# Set connection string
export PGPASSWORD="${TIMEWEB_DB_PASSWORD}"
PSQL_CMD="psql -h ${TIMEWEB_DB_HOST} -p ${TIMEWEB_DB_PORT:-5432} -U ${TIMEWEB_DB_USER} -d ${TIMEWEB_DB_NAME}"

# Function to run migration
run_migration() {
    local file=$1
    local description=$2

    echo -e "${YELLOW}Applying: ${description}${NC}"
    echo "File: ${file}"

    if $PSQL_CMD -f "$file" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}✓ Success${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "Error output:"
        cat /tmp/migration_output.log
        echo ""
        return 1
    fi
}

# Apply migrations in order
run_migration "01_create_auth_system.sql" "1. Authentication System" || exit 1
run_migration "02_create_platform_schema.sql" "2. Platform Schema" || exit 1
run_migration "03_setup_rls_policies.sql" "3. RLS Policies" || exit 1
run_migration "04_add_additional_features.sql" "4. Additional Features" || exit 1

echo -e "${GREEN}All migrations applied successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update your application to use authenticate_with_token() before queries"
echo "2. Test the connection with a sample query"
echo "3. Create your first super admin user"
echo ""
echo "Example: Creating first user"
echo "psql -h $TIMEWEB_DB_HOST -U $TIMEWEB_DB_USER -d $TIMEWEB_DB_NAME -c \\"
echo "  \"INSERT INTO users (telegram_id, first_name) VALUES (123456789, 'Admin') RETURNING id;\""

# Cleanup
unset PGPASSWORD
