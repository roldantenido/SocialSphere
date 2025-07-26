import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders, authStorage } from "./lib/auth";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Friends from "@/pages/friends";
import Groups from "@/pages/groups";
import Marketplace from "@/pages/marketplace";
import Gaming from "@/pages/gaming";
import Profile from "@/pages/profile";
import Admin from "./pages/admin";
import GitDeploy from "./pages/git-deploy";
import DockerWizard from "@/pages/docker-wizard";
import Discover from "@/pages/discover";
import Setup from "@/pages/setup";

function AuthenticatedApp() {
  // Check setup status first
  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ["/api/setup/status"],
    queryFn: async () => {
      const response = await fetch("/api/setup/status");
      if (!response.ok) {
        throw new Error("Failed to check setup status");
      }
      return response.json();
    },
    retry: false,
  });

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
    enabled: setupStatus?.isConfigured === true, // Only run if app is configured
  });

  if (setupLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show setup page if app is not configured
  if (!setupStatus?.isConfigured) {
    return <Setup />;
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
      <Route path="/git-deploy" component={GitDeploy} />
      <Route path="/docker-wizard" component={DockerWizard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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