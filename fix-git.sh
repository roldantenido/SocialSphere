#!/bin/bash
# Git Repository Recovery Script

echo "🔧 Fixing Git repository issues..."

# Remove any lock files
rm -f .git/index.lock
rm -f .git/HEAD.lock
rm -f .git/config.lock
rm -f .git/refs/heads/main.lock

# Clean up Git index
git reset --mixed HEAD 2>/dev/null || echo "Reset failed, continuing..."

# Check if we can repair the repository
if git fsck --full 2>/dev/null; then
    echo "✅ Repository structure is intact"
else
    echo "⚠️  Repository has issues, attempting repair..."
    git gc --prune=now
fi

# Check current status
echo "📊 Current Git status:"
git status 2>&1 || echo "Status command failed"

echo "🎯 To start fresh with Git:"
echo "1. Remove current Git history: rm -rf .git"
echo "2. Initialize new repository: git init"
echo "3. Add files: git add ."
echo "4. Create initial commit: git commit -m 'Initial commit'"
echo "5. Add remote: git remote add origin YOUR_GITHUB_URL"
echo "6. Push: git push -u origin main"