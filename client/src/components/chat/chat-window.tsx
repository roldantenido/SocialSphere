import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { X, Send } from "lucide-react";
import type { User, ChatMessage } from "@shared/schema";

interface ChatWindowProps {
  onClose: () => void;
  recipientId?: number;
}

export function ChatWindow({ onClose, recipientId = 1 }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For demo purposes, chat with user ID 1 (first sample user)
  const { data: recipient } = useQuery({
    queryKey: ["/api/users", recipientId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${recipientId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json() as Promise<User>;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/chat", recipientId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${recipientId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json() as Promise<ChatMessage[]>;
    },
    refetchInterval: 3000, // Refetch every 3 seconds for real-time feel
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/chat/${recipientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat", recipientId] });
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!recipient || !currentUser) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-2xl border dark:border-gray-700 dark:bg-gray-800" style={{ height: "400px" }}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-primary text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={recipient.profilePhoto || ""} alt={recipient.firstName} />
            <AvatarFallback>{recipient.firstName?.[0]}{recipient.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{recipient.firstName} {recipient.lastName}</span>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:text-gray-200 hover:bg-primary/80"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex flex-col" style={{ height: "calc(400px - 64px)" }}>
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((msg) => {
            const isFromCurrentUser = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end space-x-2 ${
                  isFromCurrentUser ? "justify-end" : ""
                }`}
              >
                {!isFromCurrentUser && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={recipient.profilePhoto || ""} alt={recipient.firstName} />
                    <AvatarFallback>{recipient.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    isFromCurrentUser
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                {isFromCurrentUser && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={currentUser.profilePhoto || ""} alt={currentUser.firstName} />
                    <AvatarFallback>{currentUser.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="p-2"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
