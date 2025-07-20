import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, MessageCircle, Share, MoreHorizontal, Accessibility, Image as ImageIcon, Video } from "lucide-react";
import type { PostWithUser, CommentWithUser } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: PostWithUser;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/posts", post.id, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json() as Promise<CommentWithUser[]>;
    },
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to toggle like");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle like",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const handleShare = () => {
    // Mock share functionality
    toast({ title: "Shared", description: "Post shared successfully!" });
  };

  return (
    <Card className="mb-6 post-shadow">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.user.profilePhoto || ""} alt={post.user.firstName} />
              <AvatarFallback>{post.user.firstName?.[0]}{post.user.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {post.user.firstName} {post.user.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-800">{post.content}</p>
        </div>

        {/* Post Media */}
        {post.imageUrl && post.mediaType === "image" && (
          <div className="relative">
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full max-h-96 object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                // Show error message
                const errorDiv = img.nextElementSibling as HTMLElement;
                if (errorDiv) errorDiv.style.display = 'block';
              }}
            />
            <div 
              className="hidden w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Unable to load image</p>
              </div>
            </div>
          </div>
        )}
        {post.videoUrl && post.mediaType === "video" && (
          <div className="relative">
            <video
              src={post.videoUrl}
              controls
              className="w-full max-h-96"
              preload="metadata"
              onError={(e) => {
                const video = e.target as HTMLVideoElement;
                video.style.display = 'none';
                const errorDiv = video.nextElementSibling as HTMLElement;
                if (errorDiv) errorDiv.style.display = 'block';
              }}
            />
            <div 
              className="hidden w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Unable to load video</p>
              </div>
            </div>
          </div>
        )}
        {/* Legacy support for imageUrl without mediaType */}
        {post.imageUrl && !post.mediaType && (
          <div className="relative">
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full max-h-96 object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const errorDiv = img.nextElementSibling as HTMLElement;
                if (errorDiv) errorDiv.style.display = 'block';
              }}
            />
            <div 
              className="hidden w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400"
            >
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Unable to load image</p>
              </div>
            </div>
          </div>
        )}

        {/* Post Stats */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center space-x-4 text-gray-500">
            <span className="flex items-center space-x-1">
              <ThumbsUp className="h-4 w-4 text-primary" />
              <span>{post.likesCount}</span>
            </span>
            <span>{post.commentsCount} comments</span>
            <span>{post.sharesCount} shares</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            <Accessibility className="h-4 w-4 mr-1" />
            Promote
          </Button>
        </div>

        {/* Post Actions */}
        <div className="px-4 pb-4 flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 py-2"
            onClick={handleLike}
            disabled={likeMutation.isPending}
          >
            <ThumbsUp className={`h-4 w-4 ${post.isLiked ? 'text-primary fill-primary' : ''}`} />
            <span>Like</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 py-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 py-2"
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-4 pb-4 border-t border-gray-100">
            {/* Add Comment */}
            <div className="flex items-center space-x-2 mt-4 mb-4">
              <Input
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button 
                size="sm" 
                onClick={handleComment}
                disabled={!commentText.trim() || commentMutation.isPending}
              >
                Post
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profilePhoto || ""} alt={comment.user.firstName} />
                    <AvatarFallback>{comment.user.firstName?.[0]}{comment.user.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.user.firstName} {comment.user.lastName}
                    </p>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
