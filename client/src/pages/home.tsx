import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { CreatePost } from "@/components/post/create-post";
import { PostCard } from "@/components/post/post-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostWithUser, User } from "@shared/schema";

export default function Home() {
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: async () => {
      const response = await fetch("/api/posts", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<PostWithUser[]>;
    },
  });

  const { data: friendSuggestions = [] } = useQuery({
    queryKey: ["/api/friends/suggestions"],
    queryFn: async () => {
      const response = await fetch("/api/friends/suggestions", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friend suggestions");
      return response.json() as Promise<User[]>;
    },
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const response = await fetch("/api/friends", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json() as Promise<User[]>;
    },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <Sidebar />
            
            {/* Main Feed */}
            <div className="flex-1 px-4">
              <CreatePost />
              
              {postsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="mb-6">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-4" />
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No posts yet. Create your first post above!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="hidden xl:block w-80 p-4">
              {/* Sponsored */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Sponsored</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer">
                    <img 
                      src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=60&h=60&fit=crop" 
                      alt="Sponsored product" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">Tech Gadgets</h4>
                      <p className="text-sm text-gray-500">Latest innovations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Friend Suggestions */}
              {friendSuggestions.length > 0 && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg">People You May Know</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {friendSuggestions.slice(0, 3).map((user) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
                              <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-xs text-gray-500">Suggested friend</p>
                            </div>
                          </div>
                          <Button size="sm" className="text-xs px-3 py-1">
                            Add Friend
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Online Friends */}
              {friends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Online Friends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {friends.slice(0, 5).map((friend) => (
                        <div key={friend.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={friend.profilePhoto || ""} alt={friend.firstName} />
                              <AvatarFallback>{friend.firstName?.[0]}{friend.lastName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          <span className="text-sm text-gray-700">
                            {friend.firstName} {friend.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
