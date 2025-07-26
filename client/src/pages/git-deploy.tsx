
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, GitBranch, Download, Play, RefreshCw, Terminal } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GitDeploy() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'cloning' | 'pulling' | 'installing' | 'running' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const executeCommand = async (command: string, description: string) => {
    addLog(`${description}...`);
    try {
      const response = await fetch('/api/git/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ command })
      });
      
      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ ${description} completed`);
        if (result.output) {
          addLog(result.output);
        }
        return true;
      } else {
        addLog(`❌ ${description} failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      addLog(`❌ ${description} failed: ${error}`);
      return false;
    }
  };

  const handleClone = async () => {
    if (!repoUrl) return;
    
    setIsLoading(true);
    setStatus('cloning');
    setLogs([]);
    
    try {
      // Clone repository
      const cloneSuccess = await executeCommand(
        `git clone -b ${branch} ${repoUrl} /tmp/app-clone && cp -r /tmp/app-clone/* . && rm -rf /tmp/app-clone`,
        "Cloning repository"
      );
      
      if (!cloneSuccess) {
        setStatus('error');
        return;
      }

      setStatus('installing');
      
      // Install dependencies
      const installSuccess = await executeCommand('npm install', 'Installing dependencies');
      
      if (!installSuccess) {
        setStatus('error');
        return;
      }

      setStatus('running');
      
      // Start application
      const runSuccess = await executeCommand('npm run dev', 'Starting application');
      
      if (runSuccess) {
        setStatus('success');
        addLog('🚀 Application is now running!');
      } else {
        setStatus('error');
      }
      
    } catch (error) {
      addLog(`❌ Deployment failed: ${error}`);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    setStatus('pulling');
    setLogs([]);
    
    try {
      // Pull latest changes
      const pullSuccess = await executeCommand('git pull origin ' + branch, 'Pulling latest changes');
      
      if (!pullSuccess) {
        setStatus('error');
        return;
      }

      setStatus('installing');
      
      // Install/update dependencies
      const installSuccess = await executeCommand('npm install', 'Updating dependencies');
      
      if (!installSuccess) {
        setStatus('error');
        return;
      }

      setStatus('running');
      
      // Restart application
      const restartSuccess = await executeCommand('pkill -f "npm run dev" && npm run dev', 'Restarting application');
      
      if (restartSuccess) {
        setStatus('success');
        addLog('🚀 Application updated and restarted!');
      } else {
        setStatus('error');
      }
      
    } catch (error) {
      addLog(`❌ Update failed: ${error}`);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle': return <Badge variant="secondary">Ready</Badge>;
      case 'cloning': return <Badge variant="default">Cloning...</Badge>;
      case 'pulling': return <Badge variant="default">Pulling...</Badge>;
      case 'installing': return <Badge variant="default">Installing...</Badge>;
      case 'running': return <Badge variant="default">Starting...</Badge>;
      case 'success': return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Git Deploy</h1>
        <p className="text-muted-foreground">Clone, pull, or update your application from GitHub</p>
      </div>

      <div className="grid gap-6">
        {/* Repository Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Repository Configuration
            </CardTitle>
            <CardDescription>
              Configure your GitHub repository for deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Repository URL</label>
              <Input
                placeholder="https://github.com/username/repository.git"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <Input
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deployment Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment Controls
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Deploy your application from the configured repository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={handleClone}
                disabled={!repoUrl || isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Clone & Deploy
              </Button>
              <Button 
                variant="outline"
                onClick={handlePull}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Pull & Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Deployment Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Start a deployment to see output.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>First Time:</strong> Use "Clone & Deploy" to get your repository and start the application.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Updates:</strong> Use "Pull & Update" to get the latest changes and restart your app.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">Common Repository URLs:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• HTTPS: https://github.com/username/repo.git</div>
                <div>• SSH: git@github.com:username/repo.git</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
