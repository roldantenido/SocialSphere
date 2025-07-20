import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Video, Image as ImageIcon, Smile, X } from "lucide-react";

const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty"),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

export function CreatePost() {
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const { toast } = useToast();

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

  const form = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      content: "",
      imageUrl: "",
      videoUrl: "",
      mediaType: undefined,
    },
  });

  const handleMediaUpload = (type: "image" | "video") => {
    setMediaType(type);
    const url = prompt(`Enter ${type} URL:`);
    if (url) {
      setMediaUrl(url);
      if (type === "image") {
        form.setValue("imageUrl", url);
        form.setValue("videoUrl", "");
      } else {
        form.setValue("videoUrl", url);
        form.setValue("imageUrl", "");
      }
      form.setValue("mediaType", type);
    }
  };

  const removeMedia = () => {
    setMediaType(null);
    setMediaUrl("");
    form.setValue("imageUrl", "");
    form.setValue("videoUrl", "");
    form.setValue("mediaType", undefined);
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      setMediaType(null);
      setMediaUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Success", description: "Post created successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostData) => {
    createPostMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePhoto || ""} alt={user.firstName} />
                <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={`What's on your mind, ${user.firstName}?`}
                        className="bg-gray-100 border-none rounded-full px-4 py-3 focus:ring-2 focus:ring-primary"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Media Preview */}
            {mediaUrl && (
              <div className="mb-4 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                >
                  <X className="h-4 w-4" />
                </Button>
                {mediaType === "image" ? (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg border"
                    onError={() => {
                      toast({
                        title: "Error",
                        description: "Failed to load image",
                        variant: "destructive",
                      });
                      removeMedia();
                    }}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full max-h-64 rounded-lg border"
                    onError={() => {
                      toast({
                        title: "Error",
                        description: "Failed to load video",
                        variant: "destructive",
                      });
                      removeMedia();
                    }}
                  />
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-4 py-2"
                  onClick={() => handleMediaUpload("video")}
                >
                  <Video className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">Video</span>
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex items-center space-x-2 px-4 py-2"
                  onClick={() => handleMediaUpload("image")}
                >
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Photo</span>
                </Button>
                <Button type="button" variant="ghost" className="flex items-center space-x-2 px-4 py-2">
                  <Smile className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-600">Feeling</span>
                </Button>
              </div>
              
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending || !form.watch("content")}
                className="px-6"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
