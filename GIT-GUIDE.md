# Git and GitHub Quick Guide

A simple guide for managing your social media application code with Git and GitHub.

## 🚀 Initial Setup (First Time Only)

### 1. Install Git
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install git

# CentOS/RHEL
sudo yum install git

# macOS (with Homebrew)
brew install git
```

### 2. Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New Repository"
3. Name it `social-media-app` (or your preferred name)
4. Choose Public or Private
5. Don't initialize with README (we have files already)
6. Click "Create Repository"

## 📤 First Push (Upload Your Code)

### 1. Initialize Git in Your Project
```bash
# Navigate to your project directory
cd /path/to/your/social-media-app

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Social media application with Docker deployment"
```

### 2. Connect to GitHub
```bash
# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push code to GitHub
git push -u origin main
```

If you get an error about the branch name, try:
```bash
git branch -M main
git push -u origin main
```

## 🔧 Daily Workflow

### Making Changes and Pushing

```bash
# 1. Check what files have changed
git status

# 2. Add specific files you want to upload
git add filename.txt
# OR add all changed files
git add .

# 3. Create a commit with a message
git commit -m "Add new feature: user profile editing"

# 4. Push to GitHub
git push
```

### Getting Latest Changes (Pull)

```bash
# Download latest changes from GitHub
git pull

# OR if you want to be more explicit
git pull origin main
```

## 🌟 Common Git Commands

### Check Status
```bash
git status          # See what files are changed
git log             # See commit history
git diff            # See what changes you made
```

### Working with Branches
```bash
git branch                    # List all branches
git branch feature-name       # Create new branch
git checkout feature-name     # Switch to branch
git checkout -b feature-name  # Create and switch to branch
git merge feature-name        # Merge branch into current branch
```

### Undo Changes
```bash
git checkout -- filename.txt    # Undo changes to a file
git reset HEAD filename.txt     # Unstage a file
git reset --hard HEAD          # Undo all changes (dangerous!)
```

## 🎯 Deployment Workflow

### For Automatic Docker Builds

Once your code is on GitHub, the GitHub Actions will automatically:

1. **When you push code:**
   ```bash
   git add .
   git commit -m "Update application features"
   git push
   ```

2. **GitHub Actions automatically:**
   - Builds Docker image
   - Pushes to GitHub Container Registry
   - Pushes to Docker Hub (if configured)
   - Creates deployment artifacts

3. **Deploy on your VPS:**
   ```bash
   # Pull latest image and restart
   docker-compose pull app
   docker-compose up -d
   ```

### For Manual Deployment

```bash
# 1. Push your changes
git push

# 2. On your VPS, pull latest code
git pull

# 3. Rebuild and restart
docker-compose build
docker-compose up -d
```

## 🔐 Authentication

### Using HTTPS (Recommended for beginners)
```bash
# GitHub will ask for username and password/token
git clone https://github.com/username/repo.git
```

### Using SSH Keys (More secure)
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to GitHub: Settings → SSH Keys → New SSH Key
# Copy public key
cat ~/.ssh/id_ed25519.pub

# Clone using SSH
git clone git@github.com:username/repo.git
```

## 📝 Best Practices

### Commit Messages
```bash
# Good commit messages
git commit -m "Add user authentication system"
git commit -m "Fix profile image upload bug"
git commit -m "Update Docker configuration for production"

# Bad commit messages
git commit -m "fix"
git commit -m "changes"
git commit -m "update"
```

### What to Commit
```bash
# Always commit
- Source code files
- Configuration files
- Documentation
- Package.json, requirements.txt

# Never commit (use .gitignore)
- node_modules/
- .env files with secrets
- Build artifacts
- Log files
- OS-specific files (.DS_Store)
```

### Create .gitignore File
```bash
# Create .gitignore in your project root
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/

# Database
*.db
*.sqlite
EOF
```

## 🚨 Troubleshooting

### Common Issues

1. **"Permission denied" error:**
   ```bash
   # Make sure you're authenticated
   git config --list | grep user
   ```

2. **"Updates were rejected" error:**
   ```bash
   # Pull latest changes first
   git pull origin main
   # Then push
   git push
   ```

3. **Merge conflicts:**
   ```bash
   # Edit conflicted files manually
   # Then add and commit
   git add .
   git commit -m "Resolve merge conflicts"
   ```

4. **Forgot to pull before making changes:**
   ```bash
   # Stash your changes
   git stash
   # Pull latest
   git pull
   # Apply your changes back
   git stash pop
   ```

## 🎯 Your Social Media App Workflow

### Typical Development Cycle

```bash
# 1. Start working
git pull                                    # Get latest changes

# 2. Make your changes
# Edit files, add features, fix bugs

# 3. Test locally
npm run dev                                # Test your changes

# 4. Commit and push
git add .
git commit -m "Add chat functionality"     # Describe what you did
git push

# 5. Deploy (automatic with GitHub Actions)
# GitHub builds Docker image automatically
# On your VPS: docker-compose pull && docker-compose up -d
```

### Quick Reference Card

```bash
# Daily commands
git status              # What changed?
git add .              # Stage all changes
git commit -m "msg"    # Save changes
git push               # Upload to GitHub
git pull               # Download from GitHub

# See your changes
git diff               # What did I change?
git log --oneline      # Recent commits

# Fix mistakes
git checkout -- file   # Undo file changes
git reset HEAD~1       # Undo last commit
```

Your GitHub repository will be at: `https://github.com/YOUR_USERNAME/social-media-app`

Once you push your code, GitHub Actions will automatically build Docker images, making deployment to any VPS (including aapanel) very easy!