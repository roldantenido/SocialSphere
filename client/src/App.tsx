import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders, authStorage } from "./lib/auth";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Friends from "@/pages/friends";
import Groups from "@/pages/groups";
import Marketplace from "@/pages/marketplace";
import Gaming from "@/pages/gaming";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import DockerWizard from "@/pages/docker-wizard";
import Setup from "@/pages/setup";

function AuthenticatedApp() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      const userData = await response.json();
      authStorage.setUser(userData);
      return userData;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/friends" component={Friends} />
      <Route path="/groups" component={Groups} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/gaming" component={Gaming} />
      <Route path="/profile/:userId?" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/docker-wizard" component={DockerWizard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/setup/status');
        const data = await response.json();
        setSetupComplete(data.setupComplete);
      } catch (error) {
        setSetupComplete(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (setupComplete === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!setupComplete) {
    // Redirect to /setup if not already there
    if (window.location.pathname !== '/setup') {
      window.location.href = '/setup';
      return null;
    }
    
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Setup />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  useEffect(() => {
    // Check if user has a session on app start
    const sessionId = authStorage.getSessionId();
    if (!sessionId) {
      authStorage.clear();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;