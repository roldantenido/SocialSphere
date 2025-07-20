
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users, FileText, Shield, User } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";
import { User as UserType, Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  adminUsers: number;
  regularUsers: number;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch admin stats");
      return response.json() as Promise<AdminStats>;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json() as Promise<UserType[]>;
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/posts", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<Post[]>;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete post");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Post deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.regularUsers}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                        alt={user.firstName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Badge variant="destructive">Admin</Badge>
                      )}
                    </div>
                    {!user.isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Posts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Post Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {posts.map((post) => {
                  const user = users.find(u => u.id === post.userId);
                  return (
                    <div key={post.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="font-medium text-sm">
                            {user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                          <span>{post.likesCount} likes</span>
                          <span>{post.commentsCount} comments</span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePostMutation.mutate(post.id)}
                        disabled={deletePostMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
