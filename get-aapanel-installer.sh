
#!/bin/bash

# Quick download script for aapanel one-click installer
echo "🔄 Downloading aapanel one-click installer..."

# Download the installer
curl -o aapanel-one-click-install.sh https://raw.githubusercontent.com/yourusername/social-media-app/main/aapanel-one-click-install.sh

# Make it executable
chmod +x aapanel-one-click-install.sh

echo "✅ Downloaded successfully!"
echo ""
echo "🚀 To install your social media app, run:"
echo "   ./aapanel-one-click-install.sh"
echo ""
echo "This installer will:"
echo "• Install Docker and Docker Compose"
echo "• Set up PostgreSQL database"
echo "• Configure nginx reverse proxy"
echo "• Deploy your social media application"
echo "• Set up SSL (optional)"
echo ""
echo "Prerequisites:"
echo "• aapanel installed on your VPS"
echo "• Root or sudo access"
echo "• Internet connection"
