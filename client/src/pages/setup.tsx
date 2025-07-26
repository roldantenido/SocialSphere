import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setupSchema, type SetupData } from "@shared/setup";
import { Settings, Database, User, Globe } from "lucide-react";

export default function Setup() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [testingConnection, setTestingConnection] = useState(false);

  const form = useForm<SetupData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      siteName: "Social Media App",
      dbHost: "localhost",
      dbPort: 5432,
      dbName: "social_media",
      dbUser: "postgres",
      dbPassword: "",
      adminUsername: "admin",
      adminPassword: "",
    },
  });

  const testDbMutation = useMutation({
    mutationFn: async (dbData: {
      dbHost: string;
      dbPort: number;
      dbName: string;
      dbUser: string;
      dbPassword: string;
    }) => {
      const response = await fetch("/api/setup/test-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dbData),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Database connection failed");
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful!",
        description: "Database connection test passed. You can proceed to the next step.",
      });
      setStep(3);
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: SetupData) => {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Setup failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setup Complete!",
        description: "Your application has been configured successfully. Redirecting to login...",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SetupData) => {
    setupMutation.mutate(data);
  };

  const testDatabaseConnection = async () => {
    const isValid = await form.trigger(["dbHost", "dbPort", "dbName", "dbUser", "dbPassword"]);
    if (!isValid) return;

    const formData = form.getValues();
    setTestingConnection(true);
    
    testDbMutation.mutate({
      dbHost: formData.dbHost,
      dbPort: formData.dbPort,
      dbName: formData.dbName,
      dbUser: formData.dbUser,
      dbPassword: formData.dbPassword,
    });
    
    setTestingConnection(false);
  };

  const nextStep = async () => {
    if (step === 1) {
      // Validate site info before proceeding
      const isValid = await form.trigger(["siteName"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      // Test database connection before proceeding
      await testDatabaseConnection();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Application Setup</CardTitle>
          <CardDescription>
            Configure your application for first use
          </CardDescription>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    i <= step ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Site Information</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Social Media App" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Database className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Database Configuration</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="dbHost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Host</FormLabel>
                        <FormControl>
                          <Input placeholder="localhost" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dbPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5432"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5432)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dbName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Database Name</FormLabel>
                          <FormControl>
                            <Input placeholder="social_media" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dbUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Username</FormLabel>
                        <FormControl>
                          <Input placeholder="postgres" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dbPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter database password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Admin Account</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="adminUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Username</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter secure password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testDatabaseConnection}
                      disabled={testDbMutation.isPending || testingConnection}
                      className="w-full"
                    >
                      {testDbMutation.isPending || testingConnection ? "Testing Connection..." : "Test Database Connection"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    {step === 2 ? "Test & Continue" : "Next"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="ml-auto"
                    disabled={setupMutation.isPending}
                  >
                    {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}