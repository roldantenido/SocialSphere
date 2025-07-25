#!/bin/bash

# aapanel One-Click Docker Installer for Social Media App
# This script provides complete automated installation on aapanel VPS
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration variables
APP_NAME="social-media-app"
APP_DIR="/www/wwwroot/$APP_NAME"
DOCKER_IMAGE="ghcr.io/yourusername/social-media-app:latest"
DEFAULT_PASSWORD="SecurePass$(date +%s)"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    🚀 aapanel Social Media App Installer 🚀    ${NC}"
echo -e "${BLUE}           One-Click Docker Deployment          ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    SUDO=""
else
    SUDO="sudo"
fi

echo -e "${CYAN}🔍 Checking system requirements...${NC}"

# Skip aapanel installation check - assuming aapanel is already installed
echo -e "${GREEN}✅ Assuming aapanel is already installed${NC}"

# Generate random database credentials
echo ""
echo -e "${CYAN}🔧 Generating secure database credentials...${NC}"
DB_USER=$(generate_password)
DB_PASSWORD=$(generate_password)
echo -e "${YELLOW}Generated database username: $DB_USER${NC}"
echo -e "${YELLOW}Generated database password: $DB_PASSWORD${NC}"

echo ""
echo -e "${CYAN}🐳 Installing Docker and Docker Compose...${NC}"

# Install Docker if not present
if ! command_exists docker; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    $SUDO sh get-docker.sh
    $SUDO usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose if not present
if ! command_exists docker-compose; then
    echo "📦 Installing Docker Compose..."
    $SUDO curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $SUDO chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Start Docker service
$SUDO systemctl enable docker
$SUDO systemctl start docker

echo ""
echo -e "${CYAN}📁 Setting up application directory...${NC}"

# Create application directory
$SUDO mkdir -p $APP_DIR
cd $APP_DIR

# Create .env file
echo -e "${CYAN}⚙️  Creating environment configuration...${NC}"
cat > .env << EOF
# Database Configuration
POSTGRES_DB=social_media
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/social_media

# Security
CORS_ORIGIN=*
SESSION_SECRET=$(generate_password)
EOF

# Create docker-compose.yml
echo -e "${CYAN}🐋 Creating Docker Compose configuration...${NC}"
cat > docker-compose.yml << EOF
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: social_media_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${POSTGRES_DB:-social_media}
      POSTGRES_USER: \${POSTGRES_USER:-$DB_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-$DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-$DB_USER} -d \${POSTGRES_DB:-social_media}"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Main Application
  app:
    image: ghcr.io/roldantenido/socialsphere:latest
    container_name: social_media_app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 50725
      DATABASE_URL: \${DATABASE_URL}
    ports:
      - "50725:50725"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app_network
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:50725/api/auth/me"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  app_network:
    driver: bridge
EOF

# Create database initialization script
echo -e "${CYAN}🗄️  Creating database initialization...${NC}"
cat > init-db.sql << 'EOF'
-- Social Media App Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
EOF

# Set proper permissions
$SUDO chown -R $USER:$USER $APP_DIR
$SUDO chmod +x $APP_DIR

echo ""
echo -e "${CYAN}🌐 Application will be accessible directly via port 50725${NC}"

echo ""
echo -e "${CYAN}🚀 Deploying the application...${NC}"

# Pull Docker image from GitHub Container Registry
echo "📦 Pulling Docker image from GitHub Container Registry..."

# Using GitHub username: rtenido

# Update docker-compose.yml with actual image URL
sed -i "s|\$GITHUB_USERNAME|rtenido|g" docker-compose.yml

# Pull the latest image
if docker pull ghcr.io/roldantenido/socialsphere:latest; then
    echo -e "${GREEN}✅ Docker image pulled successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Could not pull from GitHub Container Registry${NC}"
    echo "Make sure:"
    echo "1. GitHub Actions have built and pushed the image"
    echo "2. The repository is public OR you're logged in to ghcr.io"
    echo "3. The image exists at: ghcr.io/roldantenido/socialsphere:latest"

    # Try to authenticate with GitHub
    echo ""
    echo "To authenticate with GitHub Container Registry:"
    echo "docker login ghcr.io -u rtenido"

    exit 1
fi

# Stop any existing containers
docker-compose down --remove-orphans 2>/dev/null || true

# Start the application
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 45

# Check deployment status
echo ""
echo -e "${CYAN}🔍 Checking deployment status...${NC}"

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"

    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")

    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}          🎯 DEPLOYMENT COMPLETE! 🎯           ${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    echo -e "${GREEN}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${GREEN}🌐 Access Your Application:${NC}"
    echo -e "  📡 Direct: ${CYAN}http://$SERVER_IP:50725${NC}"
    echo -e "  🏠 Local:  ${CYAN}http://localhost:50725${NC}"
    echo ""
    echo -e "${GREEN}🔐 Database Credentials:${NC}"
    echo -e "  Database: ${CYAN}social_media${NC}"
    echo -e "  Username: ${CYAN}$DB_USER${NC}"
    echo -e "  Password: ${CYAN}$DB_PASSWORD${NC}"
    echo ""
    echo -e "${GREEN}🛠️  Management Commands:${NC}"
    echo -e "  📄 View logs:    ${CYAN}docker-compose logs -f${NC}"
    echo -e "  🔄 Restart:      ${CYAN}docker-compose restart${NC}"
    echo -e "  ⏹️  Stop:         ${CYAN}docker-compose down${NC}"
    echo -e "  🔄 Update:       ${CYAN}docker-compose pull && docker-compose up -d${NC}"
    echo -e "  📊 Status:       ${CYAN}docker-compose ps${NC}"
    echo ""
    echo -e "${GREEN}🎛️  aapanel Integration:${NC}"
    echo -e "  • Monitor containers in Docker section"
    echo -e "  • View logs in Logs section"
    echo -e "  • File management in File Manager"
    echo -e "  • Configure domain and SSL in Website settings (optional)"
    echo ""

    echo -e "${GREEN}✨ Your Social Media App is now live and ready to use!${NC}"

else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
    echo "Check logs: docker-compose logs"
    echo "Check status: docker-compose ps"
    echo "Check ports: netstat -tlnp | grep 50725"
    echo ""
    echo "Common issues:"
    echo "• Port 50725 already in use"
    echo "• Database connection issues"
    echo "• Docker image not found"
    exit 1
fi

# Create backup script
echo -e "${CYAN}📦 Creating backup script...${NC}"
cat > backup.sh << 'EOF'
#!/bin/bash
# Backup script for Social Media App

BACKUP_DIR="/www/backup/social-media-app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE"

mkdir -p $BACKUP_DIR

echo "Creating backup..."

# Backup database
docker-compose exec -T postgres pg_dump -U postgres social_media > "$BACKUP_FILE.sql"

# Backup application files
tar -czf "$BACKUP_FILE.tar.gz" .env docker-compose.yml uploads/

echo "Backup completed: $BACKUP_FILE.*"
EOF

chmod +x backup.sh
echo -e "${GREEN}✅ Backup script created${NC}"

echo ""
echo -e "${PURPLE}🎯 Installation completed successfully!${NC}"
echo -e "${PURPLE}Save this information for future reference.${NC}"

# Save installation info
cat > installation-info.txt << EOF
Social Media App Installation Info
Generated: $(date)

Access URLs:
Direct: http://$SERVER_IP:50725
Local: http://localhost:50725

Database:
Host: localhost:5432
Database: social_media
Username: $DB_USER
Password: $DB_PASSWORD

Management:
- Application directory: $APP_DIR
- Configuration file: $APP_DIR/.env
- Docker compose: $APP_DIR/docker-compose.yml
- Backup script: $APP_DIR/backup.sh

Commands:
- View logs: docker-compose logs -f
- Restart: docker-compose restart
- Stop: docker-compose down
- Update: docker-compose pull && docker-compose up -d

Note: You can configure a domain and SSL through aapanel's Website section if needed.
EOF

echo -e "${GREEN}📝 Installation info saved to: installation-info.txt${NC}"