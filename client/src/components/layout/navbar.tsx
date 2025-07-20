import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders, authStorage } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Home, Users, Users2, Store, Gamepad2, MessageCircle, Bell, Search, Shield, Compass, Moon, Sun, Package } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

export function Navbar() {
  const [location] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: () => {
      authStorage.clear();
      queryClient.clear();
    },
  });

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Compass, label: "Discover" },
    { path: "/friends", icon: Users, label: "Friends" },
    { path: "/groups", icon: Users2, label: "Groups" },
    { path: "/marketplace", icon: Store, label: "Marketplace" },
    { path: "/gaming", icon: Gamepad2, label: "Gaming" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <span className="text-2xl font-bold text-primary cursor-pointer">SocialConnect</span>
              </Link>
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Search SocialConnect" 
                    className="w-64 pl-10 bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-primary rounded-full text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Center Navigation */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      size="lg"
                      className={`px-4 py-2 rounded-lg ${
                        isActive(item.path) 
                          ? "bg-primary text-white hover:bg-primary/90" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageCircle className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Button>

              {user?.email === "admin@example.com" && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/admin">
                        <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Shield className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Admin Panel</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href="/docker-wizard">
                        <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Package className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Docker Deployment Wizard</TooltipContent>
                  </Tooltip>
                </>
              )}

              {user && (
                <Link href={`/profile/${user.id}`}>
                  <Avatar className="h-10 w-10 border-2 border-primary cursor-pointer">
                    <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
                    <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              )}

              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-sm"
              >
                {logoutMutation.isPending ? "..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {isChatOpen && <ChatWindow onClose={() => setIsChatOpen(false)} />}
    </>
  );
}