# Docker Image Deployment Guide

This guide explains how to deploy using a pre-built Docker image.

## Method 1: Build and Export Image (On Development Machine)

### Step 1: Build the Image
```bash
# Run the build script
./build-image.sh
```

This will:
- Build the Docker image as `social-media-app:latest`
- Export it as `social-media-app.tar.gz` (compressed)

### Step 2: Upload to VPS
```bash
# Upload the image and deployment files to your VPS
scp social-media-app.tar.gz user@your-vps:/var/www/social-media/
scp docker-compose.production.yml user@your-vps:/var/www/social-media/
scp nginx.conf user@your-vps:/var/www/social-media/
scp .env.example user@your-vps:/var/www/social-media/
scp import-and-deploy.sh user@your-vps:/var/www/social-media/
```

## Method 2: Deploy on VPS

### Step 1: Import and Deploy
```bash
# SSH into your VPS
ssh user@your-vps
cd /var/www/social-media/

# Make script executable
chmod +x import-and-deploy.sh

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Import image and deploy
./import-and-deploy.sh
```

## Required Files on VPS

Upload these files to your VPS:
- `social-media-app.tar.gz` (the Docker image)
- `docker-compose.production.yml` (production compose file)
- `nginx.conf` (reverse proxy configuration)
- `.env.example` (environment template)
- `import-and-deploy.sh` (deployment script)

## Environment Configuration

Edit `.env` file with your settings:
```bash
# Database Configuration
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Application Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/social_media
```

## SSL Configuration (Optional)

For HTTPS support:
1. Create `ssl/` directory
2. Place your SSL certificates:
   - `ssl/cert.pem` (certificate file)
   - `ssl/key.pem` (private key file)

To get free SSL with Let's Encrypt:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
```

## Managing the Application

### Start/Stop Services
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Stop all services
docker-compose -f docker-compose.production.yml down

# Restart specific service
docker-compose -f docker-compose.production.yml restart app

# View logs
docker-compose -f docker-compose.production.yml logs -f app
```

### Update Application
To update with a new image:
1. Build new image: `./build-image.sh`
2. Upload new `social-media-app.tar.gz`
3. Run: `./import-and-deploy.sh`

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres social_media > backup.sql

# Restore backup
docker-compose -f docker-compose.production.yml exec -T postgres psql -U postgres social_media < backup.sql
```

## Firewall Configuration

Open required ports:
```bash
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5000  # Direct app access (optional)
```

## Troubleshooting

### Check Image
```bash
# List Docker images
docker images

# Check if social-media-app:latest exists
docker images social-media-app
```

### Check Services
```bash
# Check running containers
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs app
docker-compose -f docker-compose.production.yml logs postgres
```

### Common Issues

1. **Image not found**: Make sure you imported the image correctly
2. **Database connection errors**: Check if PostgreSQL container is running
3. **Port conflicts**: Ensure ports 80, 443, 5000 are available

## Image Information

The Docker image includes:
- Node.js 20 Alpine base
- Built application in `/app/dist`
- Production dependencies only
- Non-root user for security
- Health checks enabled
- Optimized for small size and security

## Application Access

After successful deployment:
- **Direct HTTP**: `http://your-vps-ip:5000`
- **Via Nginx**: `http://your-domain.com` or `https://your-domain.com`
- **API Health**: `http://your-vps-ip:5000/api/auth/me`

The application includes all features:
- User authentication and profiles
- Photo/video posting with file uploads
- Real-time chat functionality
- Dark mode support
- Friend connections and discovery
- Responsive design