# Complete Deployment Guide - Git-Free Setup

Since you're experiencing Git issues, here's how to deploy your social media application without relying on Git operations.

## 🚀 Method 1: Direct File Transfer to aapanel

### Step 1: Download Your Application Files
1. Use the deployment wizard's "View Source" button to access your files
2. Or manually copy all files from your current directory

### Step 2: Upload to Your aapanel VPS
```bash
# On your aapanel VPS, create the directory
mkdir -p /www/wwwroot/social-media-app
cd /www/wwwroot/social-media-app

# Upload files using one of these methods:
# Option A: Using SCP (from your local machine)
scp -r /path/to/your/app/* user@your-vps-ip:/www/wwwroot/social-media-app/

# Option B: Using aapanel File Manager
# Upload files through aapanel web interface: Files > Upload

# Option C: Using wget (if files are accessible via URL)
wget -r --no-parent https://your-repl-url/
```

### Step 3: Install Docker on aapanel
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 4: Configure Environment
```bash
# Create .env file
cat > .env << 'EOF'
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/social_media
EOF
```

### Step 5: Deploy with Docker
```bash
# Start the application
docker-compose up -d

# Check status
docker-compose ps
```

## 🌐 Method 2: Using Pre-built Docker Image

If a Docker image is available in a registry:

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: social_media
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network

  app:
    image: your-dockerhub-username/social-media-app:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/social_media
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    networks:
      - app_network

volumes:
  postgres_data:

networks:
  app_network:
EOF

# Deploy
docker-compose up -d
```

## 🔧 Method 3: Manual Build on aapanel

```bash
# After uploading source files
cd /www/wwwroot/social-media-app

# Build Docker image locally
docker build -t social-media-app:latest .

# Update docker-compose.yml to use local image
sed -i 's|your-dockerhub-username/social-media-app:latest|social-media-app:latest|g' docker-compose.yml

# Deploy
docker-compose up -d
```

## 📋 aapanel Configuration

### 1. Create Website in aapanel
1. Go to **Website** → **Add Site**
2. Domain: `your-domain.com`
3. Root Directory: `/www/wwwroot/social-media-app`

### 2. Configure Reverse Proxy
1. Click **Settings** next to your domain
2. Go to **Reverse Proxy**
3. Target URL: `http://127.0.0.1:5000`
4. Enable proxy

### 3. SSL Setup (Optional)
1. In website settings → **SSL**
2. Use **Let's Encrypt** for free SSL
3. Enable **Force HTTPS**

## 🔍 Troubleshooting

### Check Application Status
```bash
# View logs
docker-compose logs -f app

# Check containers
docker-compose ps

# Test direct access
curl http://localhost:5000
```

### Common Issues
1. **Port conflicts**: Change port in docker-compose.yml
2. **Database connection**: Check DATABASE_URL in .env
3. **File permissions**: `sudo chown -R www-data:www-data /www/wwwroot/social-media-app`

## 📦 File Structure Needed

Ensure you have these essential files:
```
/www/wwwroot/social-media-app/
├── Dockerfile
├── docker-compose.yml
├── .env
├── package.json
├── package-lock.json
├── server/
├── client/
├── shared/
└── ... (all other application files)
```

## 🎯 Alternative: Use Deployment Wizard

The deployment wizard in your application provides:
- Pre-configured environment files
- Docker compose configurations
- Nginx configurations
- Step-by-step instructions

Access it by logging in as admin and clicking the package icon in the navigation.

Your application will be available at:
- **Domain**: `https://your-domain.com` (with SSL)
- **Direct**: `http://your-vps-ip:5000`
- **Local**: `http://localhost:5000`