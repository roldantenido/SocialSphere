import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Download, 
  Copy, 
  CheckCircle, 
  Terminal, 
  Globe, 
  Shield, 
  Database,
  FileText,
  Rocket,
  Settings
} from "lucide-react";

interface DeploymentConfig {
  domain: string;
  postgresPassword: string;
  sslEnabled: boolean;
  nginxEnabled: boolean;
  vpsIp: string;
  username: string;
}

export default function DockerWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<DeploymentConfig>({
    domain: "",
    postgresPassword: "",
    sslEnabled: false,
    nginxEnabled: true,
    vpsIp: "",
    username: "root"
  });
  const [copiedSteps, setCopiedSteps] = useState<Set<number>>(new Set());

  const copyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSteps(prev => new Set([...prev, stepNumber]));
    setTimeout(() => {
      setCopiedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(stepNumber);
        return newSet;
      });
    }, 2000);
  };

  const generateEnvFile = () => {
    return `# Database Configuration
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${config.postgresPassword}

# Application Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:${config.postgresPassword}@postgres:5432/social_media`;
  };

  const generateNginxConfig = () => {
    const sslConfig = config.sslEnabled ? `
    server {
        listen 80;
        server_name ${config.domain} www.${config.domain};
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${config.domain} www.${config.domain};

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";` : `
    server {
        listen 80;
        server_name ${config.domain} www.${config.domain};`;

    return `events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=uploads:10m rate=1r/s;
${sslConfig}

        # Client max body size for file uploads
        client_max_body_size 50M;

        # Proxy settings
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_read_timeout 60s;
            proxy_connect_timeout 30s;
        }

        # Upload endpoints with stricter rate limiting
        location /api/posts {
            limit_req zone=uploads burst=5 nodelay;
            proxy_pass http://app;
            proxy_read_timeout 120s;
            proxy_connect_timeout 30s;
        }

        # Static files and frontend
        location / {
            proxy_pass http://app;
            proxy_read_timeout 30s;
            proxy_connect_timeout 10s;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}`;
  };

  const generateDeploymentCommands = () => {
    const commands = [
      "# Install Docker and Docker Compose",
      "curl -fsSL https://get.docker.com -o get-docker.sh",
      "sudo sh get-docker.sh",
      "sudo usermod -aG docker $USER",
      'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      "sudo chmod +x /usr/local/bin/docker-compose",
      "",
      "# Create project directory",
      "mkdir -p /var/www/social-media",
      "cd /var/www/social-media",
      "",
      "# Create .env file",
      `cat > .env << 'EOF'`,
      generateEnvFile(),
      "EOF",
      ""
    ];

    if (config.nginxEnabled) {
      commands.push(
        "# Create nginx configuration",
        `cat > nginx.conf << 'EOF'`,
        generateNginxConfig(),
        "EOF",
        ""
      );
    }

    if (config.sslEnabled) {
      commands.push(
        "# Setup SSL certificates (Let's Encrypt)",
        "sudo apt install certbot -y",
        `sudo certbot certonly --standalone -d ${config.domain}`,
        "mkdir -p ssl",
        `sudo cp /etc/letsencrypt/live/${config.domain}/fullchain.pem ssl/cert.pem`,
        `sudo cp /etc/letsencrypt/live/${config.domain}/privkey.pem ssl/key.pem`,
        "sudo chown $(whoami):$(whoami) ssl/*",
        ""
      );
    }

    commands.push(
      "# Download project files (you'll need to upload these)",
      "# Upload: Dockerfile, docker-compose.production.yml, and other project files",
      "",
      "# Deploy the application",
      "docker-compose -f docker-compose.production.yml up -d",
      "",
      "# Check status",
      "docker-compose -f docker-compose.production.yml ps"
    );

    return commands.join("\n");
  };

  const deploymentSteps = [
    {
      title: "Prepare Files",
      description: "Download and upload project files to your VPS",
      commands: [
        "# Download project files from this application",
        "# You'll need to upload these files to your VPS:",
        "# - All project source files",
        "# - Dockerfile",
        "# - docker-compose.production.yml", 
        "# - nginx.conf (generated below)",
        "# - .env (generated below)"
      ]
    },
    {
      title: "Install Docker",
      description: "Install Docker and Docker Compose on your VPS",
      commands: [
        "curl -fsSL https://get.docker.com -o get-docker.sh",
        "sudo sh get-docker.sh",
        "sudo usermod -aG docker $USER",
        'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
        "sudo chmod +x /usr/local/bin/docker-compose"
      ]
    },
    {
      title: "Setup Project Directory",
      description: "Create directory and configuration files",
      commands: [
        "mkdir -p /var/www/social-media",
        "cd /var/www/social-media",
        "# Upload your project files here"
      ]
    },
    {
      title: "Configure Environment",
      description: "Create .env file with your settings",
      content: generateEnvFile()
    },
    ...(config.nginxEnabled ? [{
      title: "Configure Nginx",
      description: "Setup reverse proxy configuration",
      content: generateNginxConfig()
    }] : []),
    ...(config.sslEnabled ? [{
      title: "Setup SSL Certificate",
      description: "Install and configure SSL with Let's Encrypt",
      commands: [
        "sudo apt install certbot -y",
        `sudo certbot certonly --standalone -d ${config.domain}`,
        "mkdir -p ssl",
        `sudo cp /etc/letsencrypt/live/${config.domain}/fullchain.pem ssl/cert.pem`,
        `sudo cp /etc/letsencrypt/live/${config.domain}/privkey.pem ssl/key.pem`,
        "sudo chown $(whoami):$(whoami) ssl/*"
      ]
    }] : []),
    {
      title: "Deploy Application",
      description: "Build and start the application",
      commands: [
        "docker build -t social-media-app:latest .",
        "docker-compose -f docker-compose.production.yml up -d"
      ]
    },
    {
      title: "Verify Deployment",
      description: "Check that everything is running correctly",
      commands: [
        "docker-compose -f docker-compose.production.yml ps",
        `curl http://${config.vpsIp}:5000/api/auth/me`,
        ...(config.domain ? [`curl http://${config.domain}/api/auth/me`] : [])
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Rocket className="h-8 w-8 text-blue-500" />
          Docker Deployment Wizard
        </h1>
        <p className="text-muted-foreground">
          Setup your social media application on any VPS with Docker
        </p>
      </div>

      <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="1" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="2" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Deployment Steps
          </TabsTrigger>
          <TabsTrigger value="3" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                VPS Configuration
              </CardTitle>
              <CardDescription>
                Configure your VPS settings for deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vpsIp">VPS IP Address</Label>
                  <Input
                    id="vpsIp"
                    placeholder="192.168.1.100"
                    value={config.vpsIp}
                    onChange={(e) => setConfig({...config, vpsIp: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="username">SSH Username</Label>
                  <Input
                    id="username"
                    placeholder="root"
                    value={config.username}
                    onChange={(e) => setConfig({...config, username: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="domain">Domain Name (optional)</Label>
                <Input
                  id="domain"
                  placeholder="your-app.com"
                  value={config.domain}
                  onChange={(e) => setConfig({...config, domain: e.target.value})}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to access via IP address only
                </p>
              </div>

              <div>
                <Label htmlFor="postgresPassword">PostgreSQL Password</Label>
                <Input
                  id="postgresPassword"
                  type="password"
                  placeholder="Enter a secure password"
                  value={config.postgresPassword}
                  onChange={(e) => setConfig({...config, postgresPassword: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nginxEnabled"
                  checked={config.nginxEnabled}
                  onChange={(e) => setConfig({...config, nginxEnabled: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="nginxEnabled">Enable Nginx reverse proxy</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sslEnabled"
                  checked={config.sslEnabled}
                  onChange={(e) => setConfig({...config, sslEnabled: e.target.checked})}
                  className="rounded"
                  disabled={!config.domain}
                />
                <Label htmlFor="sslEnabled" className={!config.domain ? "text-muted-foreground" : ""}>
                  Enable SSL/HTTPS (requires domain)
                </Label>
              </div>

              <Button onClick={() => setCurrentStep(2)} className="w-full">
                Generate Deployment Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2" className="space-y-6">
          <Alert>
            <Rocket className="h-4 w-4" />
            <AlertDescription>
              Follow these steps in order to deploy your application on your VPS
            </AlertDescription>
          </Alert>

          {deploymentSteps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    {step.title}
                  </span>
                  {(step.commands || step.content) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(
                        step.content || step.commands?.join('\n') || '',
                        index
                      )}
                    >
                      {copiedSteps.has(index) ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step.commands && (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{step.commands.join('\n')}</code>
                  </pre>
                )}
                {step.content && (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{step.content}</code>
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Ready to download configuration files?
                </span>
                <Button onClick={() => setCurrentStep(3)}>
                  Download Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Configuration Files
              </CardTitle>
              <CardDescription>
                Download the generated configuration files for your deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">.env</h4>
                    <p className="text-sm text-muted-foreground">Environment configuration</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([generateEnvFile()], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = '.env';
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div>
                    <h4 className="font-medium">aapanel Deployment Script</h4>
                    <p className="text-sm text-muted-foreground">One-command installer for aapanel VPS</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const aapanelScript = `#!/bin/bash
# aapanel One-Command Installer for Social Media App
set -e

echo "🚀 Installing Social Media App on aapanel..."

# Check if aapanel is installed
if ! command -v bt &> /dev/null; then
    echo "❌ aapanel not found! Please install aapanel first:"
    echo "wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh && sudo bash install.sh"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
APP_DIR="/www/wwwroot/social-media-app"
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Get configuration
read -p "Enter your domain (optional): " DOMAIN
read -s -p "Enter PostgreSQL password: " DB_PASSWORD
echo ""

# Create .env file
cat > .env << EOF
POSTGRES_DB=social_media
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/social_media
EOF

# Download docker-compose.yml
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/social-media-app/main/docker-compose.yml

# Deploy
echo "🚀 Starting deployment..."
docker-compose up -d

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://$(curl -s ifconfig.me):5000"
if [ ! -z "$DOMAIN" ]; then
    echo "🌐 Configure $DOMAIN in aapanel to use reverse proxy to localhost:5000"
fi`;

                      const blob = new Blob([aapanelScript], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'aapanel-install.sh';
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    aapanel Script
                  </Button>
                </div>

                {config.nginxEnabled && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">nginx.conf</h4>
                      <p className="text-sm text-muted-foreground">Nginx reverse proxy configuration</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const blob = new Blob([generateNginxConfig()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'nginx.conf';
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">deployment-commands.sh</h4>
                    <p className="text-sm text-muted-foreground">Complete deployment script</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const blob = new Blob([generateDeploymentCommands()], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'deployment-commands.sh';
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div>
                    <h4 className="font-medium">Project Source Code</h4>
                    <p className="text-sm text-muted-foreground">Download the complete application source code</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open the current application in a new tab for download
                      const downloadUrl = window.location.origin;
                      window.open(`${downloadUrl}/?download=source`, '_blank');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div>
                    <h4 className="font-medium">Cloud Docker Setup</h4>
                    <p className="text-sm text-muted-foreground">GitHub Actions files for automatic Docker builds</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const githubWorkflow = `# This file should be placed in .github/workflows/docker-build.yml
# It will automatically build and push Docker images when you push to GitHub

name: Build and Push Docker Image

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ghcr.io/\${{ github.repository }}:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max`;

                      const blob = new Blob([githubWorkflow], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'docker-build.yml';
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    GitHub Actions
                  </Button>
                </div>
              </div>

              <Separator />

              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  Your application will be available at:
                  <ul className="mt-2 space-y-1">
                    <li>• Direct access: http://{config.vpsIp}:5000</li>
                    {config.domain && (
                      <li>• Domain: http{config.sslEnabled ? 's' : ''}://{config.domain}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => setCurrentStep(1)} variant="outline">
                  Back to Configuration
                </Button>
                <Button onClick={() => setCurrentStep(2)} variant="outline">
                  View Deployment Steps
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}