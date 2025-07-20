import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Navbar } from "@/components/layout/navbar";
import { CreatePost } from "@/components/post/create-post";
import { PostCard } from "@/components/post/post-card";
import { ChatWindow } from "@/components/chat/chat-window";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, MapPin, Briefcase, Calendar, Settings, MessageCircle, UserPlus, UserMinus } from "lucide-react";
import type { PostWithUser, UserWithFriendCount } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  bio: z.string().optional(),
  location: z.string().optional(),
  work: z.string().optional(),
  profilePhoto: z.string().optional(),
  coverPhoto: z.string().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();

  // Get current user to check if this is their profile
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch current user");
      return response.json();
    },
  });

  // Check friendship status with current user
  const { data: friends = [] } = useQuery({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const response = await fetch("/api/friends", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      return response.json();
    },
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: ["/api/friends/requests"],
    queryFn: async () => {
      const response = await fetch("/api/friends/requests", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch friend requests");
      return response.json();
    },
  });

  // Determine which user ID to fetch
  const profileUserId = userId ? parseInt(userId) : currentUser?.id;
  const isOwnProfile = !userId || (currentUser && profileUserId === currentUser.id);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", profileUserId],
    queryFn: async () => {
      if (!profileUserId) throw new Error("No user ID");
      const response = await fetch(`/api/users/${profileUserId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json() as Promise<UserWithFriendCount>;
    },
    enabled: !!profileUserId,
  });

  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", profileUserId, "posts"],
    queryFn: async () => {
      if (!profileUserId) throw new Error("No user ID");
      const response = await fetch(`/api/users/${profileUserId}/posts`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json() as Promise<PostWithUser[]>;
    },
    enabled: !!profileUserId,
  });

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      bio: "",
      location: "",
      work: "",
      profilePhoto: "",
      coverPhoto: "",
    },
  });

  // Update form defaults when user data loads
  useState(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || "",
        location: user.location || "",
        work: user.work || "",
        profilePhoto: user.profilePhoto || "",
        coverPhoto: user.coverPhoto || "",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Success", description: "Profile updated successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ friendId }),
      });
      if (!response.ok) throw new Error("Failed to send friend request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({ title: "Success", description: "Friend request sent!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfileData) => {
    updateProfileMutation.mutate(data);
  };

  // Determine friendship status
  const isFriend = friends.some((friend: any) => friend.id === profileUserId);
  const hasRequestedFriendship = friendRequests.some((req: any) => req.id === profileUserId);
  
  const handleSendFriendRequest = () => {
    if (profileUserId) {
      sendFriendRequestMutation.mutate(profileUserId);
    }
  };

  const handleStartChat = () => {
    setIsChatOpen(true);
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Navbar />
        <div className="pt-16 min-h-screen">
          <div className="max-w-4xl mx-auto p-4">
            <Card className="mb-6 overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <CardContent className="p-6">
                <div className="flex items-end space-x-4 -mt-16 mb-4">
                  <Skeleton className="w-32 h-32 rounded-full" />
                </div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto p-4">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden">
            {/* Cover Photo */}
            <div 
              className="h-64 bg-gradient-to-r from-primary to-cyan-500 relative"
              style={{
                backgroundImage: user.coverPhoto ? `url(${user.coverPhoto})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {isOwnProfile && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="absolute bottom-4 right-4"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Edit Cover
                </Button>
              )}
            </div>
            
            {/* Profile Info */}
            <CardContent className="p-6 relative">
              <div className="flex items-end space-x-4 -mt-16 mb-4">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
                  <AvatarFallback className="text-2xl">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button variant="outline" size="sm" className="p-2">
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{user.bio}</p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.friendsCount} friends</p>
                </div>
                <div className="flex space-x-2">
                  {isOwnProfile ? (
                    <>
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>Edit Profile</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>First Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Last Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="work"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Work</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="profilePhoto"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Profile Photo URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="coverPhoto"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Cover Photo URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  type="button" 
                                  variant="outline"
                                  onClick={() => setIsEditDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={updateProfileMutation.isPending}
                                >
                                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </>
                  ) : (
                    <>
                      {isFriend ? (
                        <Button variant="outline" disabled>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Friends
                        </Button>
                      ) : hasRequestedFriendship ? (
                        <Button variant="outline" disabled>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request Sent
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleSendFriendRequest}
                          disabled={sendFriendRequestMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {sendFriendRequestMutation.isPending ? "Sending..." : "Add Friend"}
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={handleStartChat}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About & Photos */}
            <div className="lg:col-span-1">
              {/* About */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {user.work && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{user.work}</span>
                      </div>
                    )}
                    {user.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photos */}
              <Card>
                <CardHeader>
                  <CardTitle>Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Sample photos - in a real app, these would come from user's posts */}
                    {userPosts
                      .filter(post => post.imageUrl)
                      .slice(0, 9)
                      .map((post) => (
                        <img 
                          key={post.id}
                          src={post.imageUrl || ""} 
                          alt="User photo" 
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    {userPosts.filter(post => post.imageUrl).length === 0 && (
                      <div className="col-span-3 text-center py-4 text-gray-500 dark:text-gray-400">
                        No photos yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Posts */}
            <div className="lg:col-span-2">
              {/* Create Post (only for own profile) */}
              {isOwnProfile && <CreatePost />}

              {/* User's Posts */}
              <div className="space-y-6">
                {postsLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
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
                ) : userPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Window */}
      {isChatOpen && profileUserId && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatWindow
            recipientId={profileUserId}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
