import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { FriendCard } from "@/components/friends/friend-card";
import { ChatWindow } from "@/components/chat/chat-window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

export default function Friends() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipientId, setChatRecipientId] = useState<number | null>(null);

  const handleStartChat = (userId: number) => {
    setChatRecipientId(userId);
    setIsChatOpen(true);
  };
  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const response = await fetch("/api/friends", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json() as Promise<User[]>;
    },
  });

  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friends/requests"],
    queryFn: async () => {
      const response = await fetch("/api/friends/requests", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friend requests");
      return response.json() as Promise<User[]>;
    },
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/friends/suggestions"],
    queryFn: async () => {
      const response = await fetch("/api/friends/suggestions", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friend suggestions");
      return response.json() as Promise<User[]>;
    },
  });

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="bg-gray-50">
          <CardContent className="p-4 text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-3" />
            <Skeleton className="h-4 w-32 mx-auto mb-2" />
            <Skeleton className="h-3 w-24 mx-auto mb-3" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto p-4">
          <Card className="p-6 mb-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-2xl">Friends</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {/* Friend Requests */}
              {(friendRequests.length > 0 || requestsLoading) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Friend Requests
                  </h3>
                  {requestsLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {friendRequests.map((user) => (
                        <FriendCard 
                          key={user.id} 
                          user={user} 
                          type="request"
                          onStartChat={handleStartChat}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* People You May Know */}
              {(suggestions.length > 0 || suggestionsLoading) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    People You May Know
                  </h3>
                  {suggestionsLoading ? (
                    <LoadingSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestions.map((user) => (
                        <FriendCard 
                          key={user.id} 
                          user={user} 
                          type="suggestion"
                          onStartChat={handleStartChat}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All Friends */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  All Friends ({friends.length})
                </h3>
                {friendsLoading ? (
                  <LoadingSkeleton />
                ) : friends.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No friends yet. Start connecting with people!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {friends.map((user) => (
                      <FriendCard 
                        key={user.id} 
                        user={user} 
                        type="friend"
                        onStartChat={handleStartChat}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Chat Window */}
      {isChatOpen && chatRecipientId && (
        <ChatWindow
          recipientId={chatRecipientId}
          onClose={() => {
            setIsChatOpen(false);
            setChatRecipientId(null);
          }}
        />
      )}
    </div>
  );
}
