import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
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
import Admin from "@/pages/admin";
import Discover from "@/pages/discover";

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
      <ThemeProvider defaultTheme="light" storageKey="replit-theme">
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;