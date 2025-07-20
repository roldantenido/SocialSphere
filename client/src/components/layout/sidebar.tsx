import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { UserPlus, Bookmark, Calendar, Video, Accessibility } from "lucide-react";

export function Sidebar() {
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

  if (!user) return null;

  const quickLinks = [
    { icon: UserPlus, label: "Friends", href: "/friends" },
    { icon: Bookmark, label: "Saved", href: "#" },
    { icon: Calendar, label: "Events", href: "#" },
    { icon: Video, label: "Reels", href: "#" },
    { icon: Accessibility, label: "Accessibility Manager", href: "#" },
  ];

  return (
    <div className="hidden lg:block w-80 p-4">
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
              <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.friendsCount} friends</p>
            </div>
          </div>
          <Link href={`/profile/${user.id}`}>
            <Button className="w-full">View Profile</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.label} href={link.href}>
              <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-gray-700 dark:text-gray-300">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
