import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAuthHeaders, authStorage } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { Home, Users, Users2, Store, Gamepad2, MessageCircle, Bell, Search, Shield, Compass } from "lucide-react";
import { ChatWindow } from "@/components/chat/chat-window";
import { useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const [location] = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);

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
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
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
                    className="w-64 pl-10 bg-gray-100 border-none focus:ring-2 focus:ring-primary rounded-full"
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
                          : "hover:bg-gray-100"
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
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => setIsChatOpen(!isChatOpen)}
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>

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