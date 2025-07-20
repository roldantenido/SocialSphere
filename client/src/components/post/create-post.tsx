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
import { Video, Image as ImageIcon, Smile } from "lucide-react";

const createPostSchema = z.object({
  content: z.string().min(1, "Post cannot be empty"),
  imageUrl: z.string().optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

export function CreatePost() {
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
    },
  });

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
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormControl>
                    <Input
                      placeholder="Add an image URL (optional)"
                      className="w-full"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <Button type="button" variant="ghost" className="flex items-center space-x-2 px-4 py-2">
                  <Video className="h-5 w-5 text-red-500" />
                  <span className="text-gray-600">Live Video</span>
                </Button>
                <Button type="button" variant="ghost" className="flex items-center space-x-2 px-4 py-2">
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600">Photo/Video</span>
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
