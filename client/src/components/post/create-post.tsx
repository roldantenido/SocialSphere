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
import { Video, Image as ImageIcon, Smile, X, Upload, Camera } from "lucide-react";

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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
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

  const handleMediaUpload = (type: "image" | "video", isReel = false) => {
    const input = document.createElement("input");
    input.type = "file";
    
    if (type === "image") {
      input.accept = "image/*";
    } else {
      // For reels, prefer shorter video formats
      input.accept = isReel ? "video/mp4,video/webm,video/mov" : "video/*";
    }
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size - stricter limits for reels
        let maxSize;
        if (type === "image") {
          maxSize = 10 * 1024 * 1024; // 10MB for images
        } else if (isReel) {
          maxSize = 50 * 1024 * 1024; // 50MB for reels
        } else {
          maxSize = 100 * 1024 * 1024; // 100MB for regular videos
        }
        
        if (file.size > maxSize) {
          const sizeLimit = isReel ? "50MB" : type === "image" ? "10MB" : "100MB";
          toast({
            title: "File too large",
            description: `${isReel ? "Reels" : type === "image" ? "Images" : "Videos"} must be smaller than ${sizeLimit}`,
            variant: "destructive",
          });
          return;
        }

        // For reels, check video duration (should be short)
        if (isReel && type === "video") {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => {
            if (video.duration > 60) { // 60 seconds max for reels
              toast({
                title: "Video too long",
                description: "Reels must be shorter than 60 seconds",
                variant: "destructive",
              });
              URL.revokeObjectURL(video.src);
              return;
            }
            
            // If duration is OK, proceed with the upload
            setMediaFile(file);
            setMediaType(type);
            
            const url = URL.createObjectURL(file);
            setMediaUrl(url);
            
            form.setValue("videoUrl", url);
            form.setValue("imageUrl", "");
            form.setValue("mediaType", type);
          };
          
          video.src = URL.createObjectURL(file);
          return;
        }

        setMediaFile(file);
        setMediaType(type);
        
        // Create object URL for preview
        const url = URL.createObjectURL(file);
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
    
    input.click();
  };

  const removeMedia = () => {
    if (mediaUrl && mediaUrl.startsWith("blob:")) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaType(null);
    setMediaUrl("");
    setMediaFile(null);
    form.setValue("imageUrl", "");
    form.setValue("videoUrl", "");
    form.setValue("mediaType", undefined);
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      let finalData = { ...data };
      
      // If we have a file, we'll use a simulated file upload
      // In a real app, you'd upload to a service like AWS S3, Cloudinary, etc.
      if (mediaFile) {
        // Simulate file upload by using the blob URL
        // In production, replace this with actual file upload logic
        const uploadedUrl = mediaUrl; // This would be the URL returned from your file upload service
        
        if (mediaType === "image") {
          finalData.imageUrl = uploadedUrl;
        } else {
          finalData.videoUrl = uploadedUrl;
        }
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(finalData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      form.reset();
      removeMedia();
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
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-full px-4 py-3 focus:ring-2 focus:ring-primary text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Media Preview */}
            {mediaUrl && (
              <div className="mb-4 relative bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* File Info */}
                {mediaFile && (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium">{mediaFile.name}</span>
                        <span className="text-gray-500">({Math.round(mediaFile.size / 1024)}KB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeMedia}
                        className="h-6 w-6 rounded-full p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Media Preview */}
                <div className="p-3">
                  {mediaType === "image" ? (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
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
                      className="w-full max-h-64 rounded-lg border border-gray-200 dark:border-gray-600"
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
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => handleMediaUpload("video")}
                >
                  <Video className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600 dark:text-gray-300">Video</span>
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => handleMediaUpload("image")}
                >
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-300">Photo</span>
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => handleMediaUpload("video", true)}
                >
                  <Camera className="h-5 w-5 text-purple-500" />
                  <span className="text-gray-600 dark:text-gray-300">Reels</span>
                </Button>
                <Button type="button" variant="ghost" className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Smile className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-300">Feeling</span>
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
