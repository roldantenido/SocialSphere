import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, UserCheck, UserMinus, Eye } from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface FriendCardProps {
  user: User;
  type: "friend" | "request" | "suggestion";
  onAction?: () => void;
}

export function FriendCard({ user, type, onAction }: FriendCardProps) {
  const { toast } = useToast();

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ friendId: user.id }),
      });
      if (!response.ok) throw new Error("Failed to send friend request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/suggestions"] });
      toast({ title: "Success", description: "Friend request sent!" });
      onAction?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const respondToRequestMutation = useMutation({
    mutationFn: async (action: "accept" | "decline") => {
      const response = await fetch("/api/friends/respond", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ friendId: user.id, action }),
      });
      if (!response.ok) throw new Error("Failed to respond to friend request");
      return response.json();
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ 
        title: "Success", 
        description: `Friend request ${action}ed!` 
      });
      onAction?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
        variant: "destructive",
      });
    },
  });

  const renderActions = () => {
    switch (type) {
      case "suggestion":
        return (
          <div className="space-y-2">
            <Link href={`/profile/${user.id}`}>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Button
              onClick={() => sendRequestMutation.mutate()}
              disabled={sendRequestMutation.isPending}
              className="w-full"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {sendRequestMutation.isPending ? "Sending..." : "Add Friend"}
            </Button>
          </div>
        );
      
      case "request":
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => respondToRequestMutation.mutate("accept")}
              disabled={respondToRequestMutation.isPending}
              className="flex-1"
            >
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => respondToRequestMutation.mutate("decline")}
              disabled={respondToRequestMutation.isPending}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        );
      
      case "friend":
        return (
          <div className="flex gap-2">
            <Link href={`/profile/${user.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Button variant="outline" size="icon">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4 text-center">
        <Avatar className="w-24 h-24 mx-auto mb-3">
          <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
          <AvatarFallback className="text-lg">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <h4 className="font-semibold text-gray-900 mb-1">
          {user.firstName} {user.lastName}
        </h4>
        {type === "friend" && (
          <p className="text-sm text-gray-500 mb-3">Active recently</p>
        )}
        {type === "suggestion" && (
          <p className="text-sm text-gray-500 mb-3">Suggested friend</p>
        )}
        {type === "request" && (
          <p className="text-sm text-gray-500 mb-3">Wants to be friends</p>
        )}
        {renderActions()}
      </CardContent>
    </Card>
  );
}
