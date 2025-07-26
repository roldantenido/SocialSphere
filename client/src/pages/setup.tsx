
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, User, Settings, CheckCircle } from "lucide-react";

interface SetupConfig {
  siteName: string;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  adminUsername: string;
  adminPassword: string;
}

export default function Setup() {
  const [config, setConfig] = useState<SetupConfig>({
    siteName: "Social Media App",
    dbHost: "0.0.0.0",
    dbPort: "5432",
    dbName: "social_media_app",
    dbUser: "postgres",
    dbPassword: "",
    adminUsername: "admin@example.com",
    adminPassword: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionValid, setConnectionValid] = useState(false);

  const updateConfig = (field: keyof SetupConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setConnectionValid(false);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: config.dbHost,
          dbPort: parseInt(config.dbPort),
          dbUser: config.dbUser,
          dbPassword: config.dbPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setConnectionValid(true);
        setCurrentStep(2);
      } else {
        setError(result.message || 'Connection failed');
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const completeSetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          dbPort: parseInt(config.dbPort)
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        setError(result.message || 'Setup failed');
      }
    } catch (err) {
      setError('Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome! Let's set up your application</h1>
          <p className="text-muted-foreground">Configure your database and create an admin account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <Database className="h-5 w-5" />}
              {currentStep === 2 && <User className="h-5 w-5" />}
              {currentStep === 1 ? "Database Configuration" : "Admin Account Setup"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 
                ? "Configure your PostgreSQL database connection"
                : "Create your administrator account and site settings"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbHost">Database Host</Label>
                    <Input
                      id="dbHost"
                      value={config.dbHost}
                      onChange={(e) => updateConfig('dbHost', e.target.value)}
                      placeholder="0.0.0.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPort">Database Port</Label>
                    <Input
                      id="dbPort"
                      value={config.dbPort}
                      onChange={(e) => updateConfig('dbPort', e.target.value)}
                      placeholder="5432"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dbName">Database Name</Label>
                  <Input
                    id="dbName"
                    value={config.dbName}
                    onChange={(e) => updateConfig('dbName', e.target.value)}
                    placeholder="social_media_app"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dbUser">Database Username</Label>
                    <Input
                      id="dbUser"
                      value={config.dbUser}
                      onChange={(e) => updateConfig('dbUser', e.target.value)}
                      placeholder="postgres"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dbPassword">Database Password</Label>
                    <Input
                      id="dbPassword"
                      type="password"
                      value={config.dbPassword}
                      onChange={(e) => updateConfig('dbPassword', e.target.value)}
                      placeholder="Enter database password"
                    />
                  </div>
                </div>

                <Button 
                  onClick={testConnection}
                  disabled={testingConnection || !config.dbPassword}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : connectionValid ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Connection Successful - Continue
                    </>
                  ) : (
                    'Test Database Connection'
                  )}
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={config.siteName}
                    onChange={(e) => updateConfig('siteName', e.target.value)}
                    placeholder="Social Media App"
                  />
                </div>

                <div>
                  <Label htmlFor="adminUsername">Admin Email</Label>
                  <Input
                    id="adminUsername"
                    type="email"
                    value={config.adminUsername}
                    onChange={(e) => updateConfig('adminUsername', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={config.adminPassword}
                    onChange={(e) => updateConfig('adminPassword', e.target.value)}
                    placeholder="Enter a secure password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={completeSetup}
                    disabled={isLoading || !config.adminUsername || !config.adminPassword}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting Up...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
