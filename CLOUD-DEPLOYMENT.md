# Cloud Docker Image Deployment Guide

Deploy your social media application using automatically built Docker images from your Git repository.

## 🚀 Quick Start

### Option 1: Use Pre-built Cloud Image

```bash
# Download deployment files
curl -O https://raw.githubusercontent.com/yourusername/your-repo/main/docker-compose.cloud.yml
curl -O https://raw.githubusercontent.com/yourusername/your-repo/main/deploy-from-cloud.sh
curl -O https://raw.githubusercontent.com/yourusername/your-repo/main/.env.example

# Make script executable
chmod +x deploy-from-cloud.sh

# Configure and deploy
cp .env.example .env
nano .env  # Edit with your settings
./deploy-from-cloud.sh
```

### Option 2: Use GitHub Actions (Automated)

When you push code to your repository, GitHub Actions will automatically:
1. Build a Docker image
2. Push to GitHub Container Registry
3. Push to Docker Hub (if configured)
4. Create deployment artifacts

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **GitHub Actions will automatically run** and build your Docker image

### 2. Configure Secrets (for Docker Hub)

In your GitHub repository settings, add these secrets:

- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub access token

**To create Docker Hub access token:**
1. Go to Docker Hub → Account Settings → Security
2. Click "New Access Token"
3. Copy the token and add it to GitHub secrets

### 3. Update Image URLs

Edit these files with your actual repository details:

**docker-compose.cloud.yml:**
```yaml
# Replace this line:
image: ghcr.io/yourusername/your-repo-name:latest

# With your actual repository:
image: ghcr.io/your-github-username/social-media-app:latest
```

**deploy-from-cloud.sh:**
```bash
# Update these variables:
DEFAULT_IMAGE="ghcr.io/your-github-username/social-media-app:latest"
DOCKERHUB_IMAGE="your-dockerhub-username/social-media-app:latest"
```

## 🌐 Available Image Registries

### GitHub Container Registry (ghcr.io)
- **URL**: `ghcr.io/your-username/your-repo-name:latest`
- **Access**: Public repositories are freely accessible
- **Authentication**: Use GitHub token for private repos

### Docker Hub
- **URL**: `your-username/social-media-app:latest`
- **Access**: Free for public images
- **Authentication**: Docker Hub credentials

## 🚀 Deployment Options

### Option A: VPS Deployment

```bash
# On your VPS
wget https://raw.githubusercontent.com/yourusername/your-repo/main/deploy-from-cloud.sh
chmod +x deploy-from-cloud.sh
./deploy-from-cloud.sh
```

### Option B: Manual Docker Run

```bash
# Pull and run the image directly
docker pull ghcr.io/your-username/your-repo-name:latest

# Run with environment variables
docker run -d \
  --name social-media-app \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-database-url" \
  ghcr.io/your-username/your-repo-name:latest
```

### Option C: Docker Compose

```bash
# Download compose file
curl -O https://raw.githubusercontent.com/yourusername/your-repo/main/docker-compose.cloud.yml

# Configure environment
cp .env.example .env
nano .env

# Deploy
docker-compose -f docker-compose.cloud.yml up -d
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest image and restart
docker-compose -f docker-compose.cloud.yml pull app
docker-compose -f docker-compose.cloud.yml up -d
```

### View Logs
```bash
docker-compose -f docker-compose.cloud.yml logs -f app
```

### Backup Database
```bash
docker-compose -f docker-compose.cloud.yml exec postgres pg_dump -U postgres social_media > backup.sql
```

## 🔧 Troubleshooting

### Image Pull Issues

1. **Authentication Error (GitHub Container Registry)**:
   ```bash
   # Login to GitHub Container Registry
   echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
   ```

2. **Authentication Error (Docker Hub)**:
   ```bash
   # Login to Docker Hub
   docker login
   ```

3. **Image Not Found**:
   - Check if GitHub Actions completed successfully
   - Verify image name and tag are correct
   - Ensure repository is public or you're authenticated

### Common Issues

1. **Port already in use**: Change port mapping in docker-compose.cloud.yml
2. **Database connection errors**: Check DATABASE_URL in .env file
3. **Out of disk space**: Clean up unused images with `docker system prune`

## 📊 GitHub Actions Workflow

The included workflows automatically:

1. **Build on every push** to main/master branch
2. **Multi-platform builds** (AMD64, ARM64)
3. **Push to multiple registries** (GitHub, Docker Hub)
4. **Generate deployment artifacts**
5. **Cache layers** for faster builds

## 🎯 Benefits of Cloud Images

✅ **Always up-to-date** - Automatic builds on code changes
✅ **Multi-platform support** - Works on different architectures
✅ **Cached builds** - Faster deployment times
✅ **Version control** - Tagged releases and latest builds
✅ **Easy rollbacks** - Deploy previous versions easily
✅ **No local build required** - Deploy anywhere without building

## 🔐 Security Features

- Non-root container user
- Multi-stage optimized builds
- Minimal attack surface
- Environment variable configuration
- Health checks included
- Automatic security updates (Alpine base)

Your application will be available at `http://your-vps-ip:5000` after successful deployment!