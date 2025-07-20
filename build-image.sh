#!/bin/bash

# Script to build and export Docker image for social media application
set -e

echo "🐳 Building Docker image for social media application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build the Docker image
echo "🔨 Building application image..."
docker build -t social-media-app:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image built successfully!${NC}"
else
    echo -e "${RED}❌ Failed to build image${NC}"
    exit 1
fi

# Export the image
echo "📦 Exporting Docker image..."
docker save social-media-app:latest | gzip > social-media-app.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image exported successfully!${NC}"
    echo "📁 Image saved as: social-media-app.tar.gz"
    echo "📊 File size: $(du -h social-media-app.tar.gz | cut -f1)"
else
    echo -e "${RED}❌ Failed to export image${NC}"
    exit 1
fi

echo ""
echo "🚀 Next steps:"
echo "1. Upload social-media-app.tar.gz to your VPS"
echo "2. Run: docker load < social-media-app.tar.gz"
echo "3. Use the provided docker-compose.yml with the built image"
echo ""
echo "💡 Tip: You can also upload the entire project folder and use docker-compose build"