#!/bin/bash

set -e

echo "Building and deploying Docker container to Timeweb..."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

error_exit() {
    echo -e "${RED}Error: $1${NC}" 1>&2
    exit 1
}

if [ ! -f ".env" ]; then
    error_exit ".env file not found"
fi

if [ ! -f "Dockerfile" ]; then
    error_exit "Dockerfile not found"
fi

echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t kursat-app:latest . || error_exit "Failed to build Docker image"

echo -e "${YELLOW}Testing container locally...${NC}"
CONTAINER_ID=$(docker run -d --rm \
  --env-file .env \
  -p 3000:3000 \
  kursat-app:latest)

echo -e "${YELLOW}Waiting for container to start...${NC}"
sleep 5

if docker logs $CONTAINER_ID | grep -q "Server running on port 3000"; then
    echo -e "${GREEN}Container started successfully!${NC}"
    docker stop $CONTAINER_ID
else
    echo -e "${RED}Container failed to start${NC}"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    error_exit "Container test failed"
fi

echo -e "${GREEN}Docker image ready for deployment!${NC}"
echo ""
echo "Push image to registry (e.g., Docker Hub):"
echo "  docker tag kursat-app:latest your-registry/kursat-app:latest"
echo "  docker push your-registry/kursat-app:latest"
echo ""
echo "Then deploy to Timeweb using the image:"
echo "  your-registry/kursat-app:latest"
