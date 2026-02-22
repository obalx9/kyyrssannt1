#!/bin/bash

set -e

echo "Deploying Kursat application to Timeweb..."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() {
    echo -e "${RED}Error: $1${NC}" 1>&2
    exit 1
}

if [ ! -f "package.json" ]; then
    error_exit "package.json not found. Run script from project root."
fi

if [ ! -f ".env" ]; then
    error_exit ".env file not found. Create it before deployment."
fi

echo -e "${YELLOW}Installing root dependencies...${NC}"
npm ci --omit=dev || error_exit "Failed to install root dependencies"

echo -e "${YELLOW}Installing backend API dependencies...${NC}"
cd backend-api
npm ci --omit=dev || error_exit "Failed to install backend dependencies"
cd ..

echo -e "${YELLOW}Building frontend...${NC}"
npm run build || error_exit "Failed to build frontend"

echo -e "${YELLOW}Stopping current application...${NC}"
pm2 stop kursat-api 2>/dev/null || echo "Application was not running"

echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 start ecosystem.config.js --update-env || error_exit "Failed to start application"

pm2 save

sleep 2

echo -e "${YELLOW}Application status:${NC}"
pm2 status

echo -e "${YELLOW}Checking health endpoint...${NC}"
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend API is running!${NC}"
else
    echo -e "${RED}Backend API is not responding to health check${NC}"
    echo -e "${YELLOW}Check logs: pm2 logs kursat-api${NC}"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status          - check status"
echo "  pm2 logs kursat-api - view logs"
echo "  pm2 restart kursat-api - restart"
echo "  pm2 monit           - real-time monitoring"
