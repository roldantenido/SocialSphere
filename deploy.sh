#!/bin/bash

# Deployment script for social media application
set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required files exist
echo "📋 Checking required files..."
required_files=("Dockerfile" "docker-compose.yml" ".env")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file $file not found!${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files found${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Pull latest images
echo "📦 Pulling latest base images..."
docker-compose pull postgres nginx

# Build the application
echo "🔨 Building application..."
docker-compose build --no-cache app

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose up -d postgres
echo "⏳ Waiting for database to be ready..."
sleep 10

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo "🏥 Checking service health..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo "📊 Service status:"
    docker-compose ps
    echo ""
    echo "🌐 Application should be available at:"
    echo "  - HTTP: http://localhost:5000"
    echo "  - HTTPS: https://your-domain.com (if SSL is configured)"
    echo ""
    echo "📝 To view logs: docker-compose logs -f"
    echo "🔧 To stop services: docker-compose down"
else
    echo -e "${RED}❌ Deployment failed! Check logs with: docker-compose logs${NC}"
    exit 1
fi