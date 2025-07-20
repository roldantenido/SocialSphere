import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertFriendshipSchema 
} from "@shared/schema";
import { z } from "zod";

// Simple session management
const sessions = new Map<string, { userId: number; expires: Date }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function validateSession(sessionId: string): number | null {
  const session = sessions.get(sessionId);
  if (!session || session.expires < new Date()) {
    sessions.delete(sessionId);
    return null;
  }
  return session.userId;
}

function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const userId = sessionId ? validateSession(sessionId) : null;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  req.userId = userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const user = await storage.getUserWithFriendCount(req.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const sessionId = generateSessionId();
      
      sessions.set(sessionId, {
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, sessionId });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error: error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = generateSessionId();
      sessions.set(sessionId, {
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, sessionId });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUserWithFriendCount(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Posts routes
  app.get("/api/posts", requireAuth, async (req, res) => {
    const posts = await storage.getPosts();
    
    // Add isLiked status for current user
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => ({
        ...post,
        isLiked: await storage.isPostLiked(req.userId, post.id)
      }))
    );
    
    res.json(postsWithLikeStatus);
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.userId
      });
      
      const post = await storage.createPost(postData);
      const postWithUser = await storage.getPost(post.id);
      res.status(201).json(postWithUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  app.post("/api/posts/:postId/like", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const isLiked = await storage.isPostLiked(req.userId, postId);
      
      if (isLiked) {
        await storage.deleteLike(req.userId, postId);
        res.json({ liked: false });
      } else {
        await storage.createLike({ userId: req.userId, postId });
        res.json({ liked: true });
      }
    } catch (error) {
      res.status(400).json({ message: "Error toggling like" });
    }
  });

  app.get("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    const postId = parseInt(req.params.postId);
    const comments = await storage.getPostComments(postId);
    res.json(comments);
  });

  app.post("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.userId,
        postId
      });
      
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Friends routes
  app.get("/api/friends", requireAuth, async (req, res) => {
    const friends = await storage.getUserFriends(req.userId);
    res.json(friends);
  });

  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    const requests = await storage.getFriendRequests(req.userId);
    res.json(requests);
  });

  app.get("/api/friends/suggestions", requireAuth, async (req, res) => {
    const suggestions = await storage.getFriendSuggestions(req.userId);
    res.json(suggestions);
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const { friendId } = req.body;
      
      if (req.userId === friendId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existing = await storage.getFriendship(req.userId, friendId);
      if (existing) {
        return res.status(400).json({ message: "Friendship already exists" });
      }

      const friendship = await storage.createFriendship({
        userId: req.userId,
        friendId,
        status: 'pending'
      });
      
      res.status(201).json(friendship);
    } catch (error) {
      res.status(400).json({ message: "Error sending friend request" });
    }
  });

  app.put("/api/friends/respond", requireAuth, async (req, res) => {
    try {
      const { friendId, action } = req.body; // action: 'accept' or 'decline'
      
      await storage.updateFriendshipStatus(friendId, req.userId, 
        action === 'accept' ? 'accepted' : 'declined');
      
      res.json({ message: `Friend request ${action}ed` });
    } catch (error) {
      res.status(400).json({ message: "Error responding to friend request" });
    }
  });

  // User routes
  app.get("/api/users/:userId", requireAuth, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = await storage.getUserWithFriendCount(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get("/api/users/:userId/posts", requireAuth, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const posts = await storage.getUserPosts(userId);
    res.json(posts);
  });

  app.put("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'work', 'profilePhoto', 'coverPhoto'];
      const updates = Object.keys(req.body)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as any);

      const updatedUser = await storage.updateUser(req.userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Error updating profile" });
    }
  });

  // Chat routes (basic implementation)
  app.get("/api/chat/:userId", requireAuth, async (req, res) => {
    const otherUserId = parseInt(req.params.userId);
    const messages = await storage.getChatMessages(req.userId, otherUserId);
    res.json(messages);
  });

  app.post("/api/chat/:userId", requireAuth, async (req, res) => {
    try {
      const receiverId = parseInt(req.params.userId);
      const { content } = req.body;
      
      const message = await storage.createChatMessage({
        senderId: req.userId,
        receiverId,
        content
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Error sending message" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.get("/api/admin/posts", requireAuth, requireAdmin, async (req, res) => {
    const posts = await storage.getAllPosts();
    res.json(posts);
  });

  app.delete("/api/admin/users/:userId", requireAuth, requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (userId === req.userId) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const deleted = await storage.deleteUser(userId);
    if (deleted) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  app.delete("/api/admin/posts/:postId", requireAuth, requireAdmin, async (req, res) => {
    const postId = parseInt(req.params.postId);
    const deleted = await storage.deletePost(postId);
    
    if (deleted) {
      res.json({ message: "Post deleted successfully" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const posts = await storage.getAllPosts();
    
    res.json({
      totalUsers: users.length,
      totalPosts: posts.length,
      adminUsers: users.filter(u => u.isAdmin).length,
      regularUsers: users.filter(u => !u.isAdmin).length,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
