#!/bin/bash

echo "Kursat Pre-Deployment Check"
echo "============================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "${YELLOW}Checking dependencies...${NC}"
if node --version | grep -qE 'v1[89]|v2[0-9]'; then
    echo -e "${GREEN}✓${NC} Node.js 18+ installed"
    ((PASSED++))
fi

if npm --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} npm installed"
    ((PASSED++))
fi

echo ""
echo -e "${YELLOW}Checking project structure...${NC}"
test -f "package.json" && echo -e "${GREEN}✓${NC} Root package.json" && ((PASSED++))
test -f "backend-api/package.json" && echo -e "${GREEN}✓${NC} Backend package.json" && ((PASSED++))
test -f "Dockerfile" && echo -e "${GREEN}✓${NC} Dockerfile" && ((PASSED++))
test -d "src" && echo -e "${GREEN}✓${NC} Frontend src/" && ((PASSED++))
test -d "backend-api" && echo -e "${GREEN}✓${NC} Backend directory" && ((PASSED++))

if test -f ".env"; then
    echo -e "${GREEN}✓${NC} .env file"
    ((PASSED++))
else
    echo -e "${YELLOW}!${NC} .env file not found"
fi

echo ""
echo -e "${YELLOW}Checking environment variables...${NC}"
if [ -f ".env" ]; then
    grep -q "DATABASE_URL" .env && echo -e "${GREEN}✓${NC} DATABASE_URL configured" && ((PASSED++))
    grep -q "JWT_SECRET" .env && echo -e "${GREEN}✓${NC} JWT_SECRET configured" && ((PASSED++))
    grep -q "PORT=" .env && echo -e "${GREEN}✓${NC} PORT configured" && ((PASSED++))
fi

echo ""
echo -e "${YELLOW}Checking dependencies installed...${NC}"
if test -d "node_modules"; then
    echo -e "${GREEN}✓${NC} Root dependencies"
    ((PASSED++))
else
    echo -e "${YELLOW}!${NC} Run: npm ci"
fi

if test -d "backend-api/node_modules"; then
    echo -e "${GREEN}✓${NC} Backend dependencies"
    ((PASSED++))
else
    echo -e "${YELLOW}!${NC} Run: cd backend-api && npm ci"
fi

echo ""
echo -e "${YELLOW}Checking builds...${NC}"
if test -f "build/index.html"; then
    echo -e "${GREEN}✓${NC} Frontend built"
    ((PASSED++))
else
    echo -e "${YELLOW}!${NC} Frontend not built - run: npm run build"
fi

echo ""
echo -e "${YELLOW}Checking critical files...${NC}"
test -f "ecosystem.config.js" && echo -e "${GREEN}✓${NC} PM2 config" && ((PASSED++))
test -f "backend-api/s3Service.js" && echo -e "${GREEN}✓${NC} S3 service" && ((PASSED++))
test -f "backend-api/index.js" && echo -e "${GREEN}✓${NC} Backend entry point" && ((PASSED++))

echo ""
echo "================================"
echo "Summary: ${GREEN}${PASSED} checks passed${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Ensure all environment variables are set in .env"
echo "2. Build with: npm run build"
echo "3. Deploy with:"
echo "   - Docker: docker build -t kursat-app:latest ."
echo "   - PM2: ./deploy.sh"
