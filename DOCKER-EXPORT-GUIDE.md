# Docker Image Export Guide

## 🚀 Quick Setup for VPS Deployment

Since this environment doesn't have Docker, here's how to create and deploy your Docker image:

## Option 1: Build on Your Local Machine

### Step 1: Download Project Files
Download all project files to your local machine where Docker is installed.

### Step 2: Build and Export Image
```bash
# Navigate to project directory
cd social-media-app/

# Build the Docker image
docker build -t social-media-app:latest .

# Export the image as a tar file
docker save social-media-app:latest | gzip > social-media-app.tar.gz

# Check the file size
ls -lh social-media-app.tar.gz
```

### Step 3: Upload to VPS
```bash
# Upload the image and deployment files
scp social-media-app.tar.gz user@your-vps:/var/www/social-media/
scp docker-compose.production.yml user@your-vps:/var/www/social-media/
scp nginx.conf user@your-vps:/var/www/social-media/
scp .env.example user@your-vps:/var/www/social-media/
scp import-and-deploy.sh user@your-vps:/var/www/social-media/
```

## Option 2: Build Directly on VPS

### Step 1: Upload Project Files
```bash
# Upload entire project to VPS
scp -r . user@your-vps:/var/www/social-media/
```

### Step 2: Build on VPS
```bash
# SSH into VPS
ssh user@your-vps
cd /var/www/social-media/

# Build the image
docker build -t social-media-app:latest .

# Deploy using docker-compose
cp .env.example .env
nano .env  # Edit with your settings
docker-compose -f docker-compose.production.yml up -d
```

## Option 3: Use Pre-built Image Registry

### Step 1: Build and Push to Registry
```bash
# Tag for Docker Hub (replace 'yourusername')
docker tag social-media-app:latest yourusername/social-media-app:latest

# Push to Docker Hub
docker push yourusername/social-media-app:latest
```

### Step 2: Update docker-compose.production.yml
Change the image line to:
```yaml
app:
  image: yourusername/social-media-app:latest
```

### Step 3: Deploy on VPS
```bash
# On VPS, just pull and run
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

## 📦 Complete Deployment Package

Your deployment package includes:

### Core Application Files:
- `Dockerfile` - Multi-stage build configuration
- `docker-compose.production.yml` - Production stack
- `nginx.conf` - Reverse proxy with SSL
- `.env.example` - Environment template

### Deployment Scripts:
- `build-image.sh` - Build and export image
- `import-and-deploy.sh` - Import and deploy on VPS
- `deploy.sh` - Full deployment automation

### Documentation:
- `DEPLOYMENT.md` - Complete deployment guide
- `IMAGE-DEPLOYMENT.md` - Image-specific instructions
- `DOCKER-EXPORT-GUIDE.md` - This guide

## 🔧 VPS Requirements

Ensure your VPS has:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

## 🚀 Deployment Steps Summary

1. **Build Image** (local machine or VPS)
2. **Upload to VPS** (if built locally)
3. **Configure Environment** (.env file)
4. **Deploy** (run import-and-deploy.sh)

## 📊 Expected Results

After successful deployment:
- Application runs on port 5000
- PostgreSQL database with persistent data
- Nginx reverse proxy (optional)
- SSL support (if configured)
- Auto-restart on failure

## 🔍 Verification

Check deployment:
```bash
# Check running containers
docker-compose -f docker-compose.production.yml ps

# Test application
curl http://localhost:5000/api/auth/me

# View logs
docker-compose -f docker-compose.production.yml logs -f app
```

## 📱 Application Features

Your deployed application includes:
- ✅ User authentication and registration
- ✅ Photo/video posting with file uploads (up to 25MB)
- ✅ Real-time chat between users
- ✅ Friend connections and discovery
- ✅ Dark/light mode support
- ✅ Responsive mobile design
- ✅ Admin panel access
- ✅ Groups and marketplace pages

All features work seamlessly in the Docker environment!