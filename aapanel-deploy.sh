#!/bin/bash

# aapanel Docker Deployment Script for Social Media App
set -e

echo "🚀 Deploying Social Media App on aapanel VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
SSL_ENABLED=false
POSTGRES_PASSWORD=""
APP_PORT=5000
NGINX_PORT=80

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}    aapanel Social Media App Installer    ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Get domain information
read -p "Enter your domain name (or press Enter for IP-only access): " DOMAIN
if [ ! -z "$DOMAIN" ]; then
    read -p "Do you have SSL certificate for $DOMAIN? (y/n): " ssl_choice
    if [ "$ssl_choice" = "y" ] || [ "$ssl_choice" = "Y" ]; then
        SSL_ENABLED=true
    fi
fi

# Get database password
while [ -z "$POSTGRES_PASSWORD" ]; do
    read -s -p "Enter a secure PostgreSQL password: " POSTGRES_PASSWORD
    echo ""
    if [ -z "$POSTGRES_PASSWORD" ]; then
        echo -e "${RED}Password cannot be empty!${NC}"
    fi
done

# Skip aapanel installation check - assuming aapanel is already installed
echo -e "${GREEN}✅ Assuming aapanel is already installed${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Create application directory in aapanel's recommended location
APP_DIR="/www/wwwroot/social-media-app"
sudo mkdir -p $APP_DIR
cd $APP_DIR

echo "📁 Working directory: $APP_DIR"

# Create .env file
cat > .env << EOF
# Database Configuration
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/social_media
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Create docker-compose.yml for aapanel
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: social_media_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    image: ghcr.io/yourusername/social-media-app:latest
    container_name: social_media_app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: ${DATABASE_URL}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/auth/me"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:

networks:
  app_network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker Compose configuration created${NC}"

# Create nginx configuration for aapanel
if [ ! -z "$DOMAIN" ]; then
    NGINX_CONFIG_DIR="/www/server/panel/vhost/nginx"
    sudo mkdir -p $NGINX_CONFIG_DIR
    
    cat > $NGINX_CONFIG_DIR/${DOMAIN}.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS if SSL is enabled
    $([ "$SSL_ENABLED" = true ] && echo "return 301 https://\$server_name\$request_uri;" || echo "")
    
    $([ "$SSL_ENABLED" = false ] && cat << 'HTTPCONFIG'
    # Client max body size for file uploads
    client_max_body_size 50M;
    
    # Proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }
HTTPCONFIG
)
}

$([ "$SSL_ENABLED" = true ] && cat << 'SSLCONFIG'
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (aapanel will manage certificates)
    ssl_certificate /www/server/panel/vhost/cert/$DOMAIN/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Client max body size for file uploads
    client_max_body_size 50M;
    
    # Proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_read_timeout 60s;
        proxy_connect_timeout 30s;
    }
}
SSLCONFIG
)
EOF

    echo -e "${GREEN}✅ Nginx configuration created for $DOMAIN${NC}"
    
    # Reload nginx
    sudo nginx -t && sudo nginx -s reload
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
fi

# Pull the Docker image (you'll need to replace with your actual image)
echo "📥 Pulling Docker image..."
echo -e "${YELLOW}Note: Replace 'ghcr.io/yourusername/social-media-app:latest' with your actual image URL${NC}"
read -p "Enter your Docker image URL (or press Enter to use default): " DOCKER_IMAGE
if [ -z "$DOCKER_IMAGE" ]; then
    DOCKER_IMAGE="ghcr.io/yourusername/social-media-app:latest"
fi

# Update docker-compose.yml with the actual image
sed -i "s|ghcr.io/yourusername/social-media-app:latest|$DOCKER_IMAGE|g" docker-compose.yml

# Try to pull the image
if docker pull $DOCKER_IMAGE; then
    echo -e "${GREEN}✅ Docker image pulled successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Could not pull image. You may need to build it locally or use a different image.${NC}"
    echo "To build locally, place your source code in this directory and run:"
    echo "docker build -t social-media-app:latest ."
    echo "Then update docker-compose.yml to use 'social-media-app:latest'"
fi

# Start the application
echo "🚀 Starting the application..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}           Deployment Complete!           ${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Application Access:"
    if [ ! -z "$DOMAIN" ]; then
        if [ "$SSL_ENABLED" = true ]; then
            echo "  🔒 HTTPS: https://$DOMAIN"
            echo "  🔒 HTTPS: https://www.$DOMAIN"
        else
            echo "  🌍 HTTP: http://$DOMAIN"
            echo "  🌍 HTTP: http://www.$DOMAIN"
        fi
    fi
    echo "  📡 Direct: http://$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_VPS_IP"):5000"
    echo "  🏠 Local: http://localhost:5000"
    echo ""
    echo "🔧 Management Commands:"
    echo "  📄 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  ⏹️  Stop: docker-compose down"
    echo "  🔄 Update: docker-compose pull && docker-compose up -d"
    echo ""
    echo "🛠️  aapanel Integration:"
    echo "  • Use aapanel's 'Website' section to manage SSL certificates"
    echo "  • Monitor Docker containers in aapanel's 'Docker' section"
    echo "  • Check logs in aapanel's 'Logs' section"
    echo ""
    echo -e "${GREEN}Setup complete! Your social media app is now running.${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check logs with: docker-compose logs"
    exit 1
fi