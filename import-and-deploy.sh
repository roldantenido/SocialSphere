#!/bin/bash

# Script to import Docker image and deploy on VPS
set -e

echo "🚀 Importing and deploying social media application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if image file exists
if [ ! -f "social-media-app.tar.gz" ]; then
    echo -e "${RED}❌ Image file social-media-app.tar.gz not found!${NC}"
    echo "Please upload the image file to this directory first."
    exit 1
fi

# Import the Docker image
echo "📥 Importing Docker image..."
docker load < social-media-app.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image imported successfully!${NC}"
else
    echo -e "${RED}❌ Failed to import image${NC}"
    exit 1
fi

# Check if .env exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your settings before continuing${NC}"
        echo "Run: nano .env"
        exit 0
    else
        echo -e "${RED}❌ No .env or .env.example file found!${NC}"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans

# Start the database first
echo "🗄️  Starting database..."
docker-compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 15

# Start all services
echo "🚀 Starting all services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo "🏥 Checking service health..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo "📊 Service status:"
    docker-compose -f docker-compose.production.yml ps
    echo ""
    echo "🌐 Application should be available at:"
    echo "  - HTTP: http://localhost:5000"
    echo "  - HTTP: http://$(curl -s ifconfig.me):5000"
    echo "  - HTTPS: https://your-domain.com (if SSL is configured)"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "🔧 To stop services: docker-compose -f docker-compose.production.yml down"
else
    echo -e "${RED}❌ Deployment failed! Check logs with: docker-compose -f docker-compose.production.yml logs${NC}"
    exit 1
fi