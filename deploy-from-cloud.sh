#!/bin/bash

# Cloud Docker Deployment Script
set -e

echo "🌐 Deploying Social Media App from Cloud Docker Image..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_IMAGE="ghcr.io/yourusername/your-repo-name:latest"
DOCKERHUB_IMAGE="your-dockerhub-username/social-media-app:latest"

echo "📋 Available deployment options:"
echo "1) GitHub Container Registry: $DEFAULT_IMAGE"
echo "2) Docker Hub: $DOCKERHUB_IMAGE"
echo "3) Custom image URL"
echo ""

read -p "Select option (1-3): " choice

case $choice in
    1)
        IMAGE_URL=$DEFAULT_IMAGE
        ;;
    2)
        IMAGE_URL=$DOCKERHUB_IMAGE
        ;;
    3)
        read -p "Enter custom image URL: " IMAGE_URL
        ;;
    *)
        echo -e "${RED}Invalid option. Using default.${NC}"
        IMAGE_URL=$DEFAULT_IMAGE
        ;;
esac

echo "🐳 Using image: $IMAGE_URL"

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your settings${NC}"
        echo "Required settings:"
        echo "- POSTGRES_PASSWORD (set a secure password)"
        echo ""
        read -p "Press Enter to continue after editing .env..."
    else
        echo -e "${RED}❌ No .env file found. Creating one...${NC}"
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Application Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:$(openssl rand -base64 32)@postgres:5432/social_media
EOF
        echo -e "${GREEN}✅ Created .env with random password${NC}"
    fi
fi

# Update docker-compose.cloud.yml with selected image
sed -i.bak "s|image: .*|image: $IMAGE_URL|" docker-compose.cloud.yml

echo "📥 Pulling latest image..."
docker pull $IMAGE_URL

echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.cloud.yml down --remove-orphans

echo "🚀 Starting services..."
docker-compose -f docker-compose.cloud.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.cloud.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📊 Service status:"
    docker-compose -f docker-compose.cloud.yml ps
    echo ""
    echo "🌐 Application should be available at:"
    echo "  - HTTP: http://localhost:5000"
    echo "  - HTTP: http://$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP"):5000"
    echo ""
    echo "📝 Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.cloud.yml logs -f"
    echo "  Stop services: docker-compose -f docker-compose.cloud.yml down"
    echo "  Update app: docker-compose -f docker-compose.cloud.yml pull app && docker-compose -f docker-compose.cloud.yml up -d"
else
    echo -e "${RED}❌ Deployment failed! Check logs:${NC}"
    docker-compose -f docker-compose.cloud.yml logs
    exit 1
fi