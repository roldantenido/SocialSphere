import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Pool } from "pg";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertPostSchema, 
  insertCommentSchema,
  insertFriendshipSchema 
} from "@shared/schema";
import { z } from "zod";
import { isAppConfigured, getSetupStatus, saveAppConfig } from "./setup";
import { setupSchema, type SetupData } from "@shared/setup";
import { setupDatabaseWithConfig } from "./db-init";

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

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

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const userId = sessionId ? validateSession(sessionId) : null;
  
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  req.userId = userId;
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await storage.getUserWithFriendCount(req.userId!);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup status endpoint (always available)
  app.get("/api/setup/status", (req, res) => {
    res.json(getSetupStatus());
  });

  // Test database connection endpoint
  app.post("/api/setup/test-db", async (req, res) => {
    try {
      const { dbHost, dbPort, dbName, dbUser, dbPassword } = req.body;
      
      // Validate required fields
      if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
        return res.status(400).json({ 
          success: false, 
          error: "All database fields are required" 
        });
      }
      
      // Create a test pool with the provided credentials
      const testPool = new Pool({
        host: dbHost,
        port: parseInt(dbPort),
        database: dbName,
        user: dbUser,
        password: dbPassword,
        ssl: false,
        connectionTimeoutMillis: 5000,
        max: 1, // Only one connection for testing
      });

      try {
        // Test the connection
        const client = await testPool.connect();
        await client.query('SELECT 1 as test');
        client.release();
        await testPool.end();
        
        res.json({ success: true, message: "Database connection successful" });
      } catch (dbError: any) {
        await testPool.end().catch(() => {}); // Ignore errors when ending pool
        res.status(400).json({ 
          success: false, 
          error: "Database connection failed: " + dbError.message 
        });
      }
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: "Invalid database configuration: " + (error as Error).message 
      });
    }
  });

  // Setup endpoint
  app.post("/api/setup", async (req, res) => {
    try {
      if (isAppConfigured()) {
        return res.status(400).json({ error: "Application is already configured" });
      }

      const setupData = setupSchema.parse(req.body);
      
      console.log('Starting setup process...');
      
      // Setup database with provided configuration
      await setupDatabaseWithConfig({
        host: setupData.dbHost,
        port: setupData.dbPort,
        database: setupData.dbName,
        user: setupData.dbUser,
        password: setupData.dbPassword,
      });

      // Save configuration
      saveAppConfig(setupData);

      // Create admin user
      await storage.createUser({
        username: setupData.adminUsername,
        email: "admin@example.com",
        password: setupData.adminPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
      });

      res.json({ success: true, message: "Setup completed successfully" });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(400).json({ error: "Setup failed: " + (error as Error).message });
    }
  });

  // Middleware to check if app is configured (for API routes only)
  app.use("/api", (req, res, next) => {
    // Skip setup routes
    if (req.path.startsWith("/setup")) {
      return next();
    }

    // Check if app is configured
    if (!isAppConfigured()) {
      return res.status(503).json({ 
        error: "Application not configured", 
        setupRequired: true 
      });
    }

    next();
  });

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
    const user = await storage.getUserWithFriendCount(req.userId!);
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
        isLiked: await storage.isPostLiked(req.userId!, post.id)
      }))
    );
    
    res.json(postsWithLikeStatus);
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.userId!
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
      const isLiked = await storage.isPostLiked(req.userId!, postId);
      
      if (isLiked) {
        await storage.deleteLike(req.userId!, postId);
        res.json({ liked: false });
      } else {
        await storage.createLike({ userId: req.userId!, postId });
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
        userId: req.userId!,
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
    const friends = await storage.getUserFriends(req.userId!);
    res.json(friends);
  });

  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    const requests = await storage.getFriendRequests(req.userId!);
    res.json(requests);
  });

  app.get("/api/friends/suggestions", requireAuth, async (req, res) => {
    const suggestions = await storage.getFriendSuggestions(req.userId!);
    res.json(suggestions);
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const { friendId } = req.body;
      
      if (req.userId === friendId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existing = await storage.getFriendship(req.userId!, friendId);
      if (existing) {
        return res.status(400).json({ message: "Friendship already exists" });
      }

      const friendship = await storage.createFriendship({
        userId: req.userId!,
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
      
      await storage.updateFriendshipStatus(friendId, req.userId!, 
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

      const updatedUser = await storage.updateUser(req.userId!, updates);
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
    const messages = await storage.getChatMessages(req.userId!, otherUserId);
    res.json(messages);
  });

  app.post("/api/chat/:userId", requireAuth, async (req, res) => {
    try {
      const receiverId = parseInt(req.params.userId);
      const { content } = req.body;
      
      const message = await storage.createChatMessage({
        senderId: req.userId!,
        receiverId,
        content
      });
      
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Error sending message" });
    }
  });

  // Git deployment routes
  app.post("/api/git/execute", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { command } = req.body;
      
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ success: false, error: "Command is required" });
      }

      // Security: Only allow specific safe commands
      const allowedCommands = [
        /^git clone/,
        /^git pull/,
        /^npm install$/,
        /^npm run dev$/,
        /^pkill -f "npm run dev"/,
        /^cp -r/,
        /^rm -rf \/tmp\/app-clone$/
      ];

      const isAllowed = allowedCommands.some(pattern => pattern.test(command));
      if (!isAllowed) {
        return res.status(403).json({ success: false, error: "Command not allowed" });
      }

      // Execute command (in a real deployment, you'd use child_process)
      // For now, we'll simulate the response
      const { exec } = await import('child_process');
      
      exec(command, { timeout: 300000 }, (error: any, stdout: any, stderr: any) => {
        if (error) {
          return res.json({ 
            success: false, 
            error: error.message,
            output: stderr 
          });
        }
        
        res.json({ 
          success: true, 
          output: stdout || 'Command executed successfully'
        });
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to execute command: " + (error as Error).message 
      });
    }
  });

  // Search routes
  app.get("/api/search", requireAuth, async (req, res) => {
    const { q: query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    
    const results = await storage.searchAll(query);
    res.json(results);
  });

  // Groups routes
  app.get("/api/groups", requireAuth, async (req, res) => {
    const groups = await storage.getAllGroups();
    res.json(groups);
  });

  app.get("/api/groups/user", requireAuth, async (req, res) => {
    const groups = await storage.getUserGroups(req.userId!);
    res.json(groups);
  });

  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const groupData = { ...req.body, createdBy: req.userId! };
      const group = await storage.createGroup(groupData);
      res.status(201).json(group);
    } catch (error) {
      res.status(400).json({ message: "Error creating group" });
    }
  });

  app.post("/api/groups/:groupId/join", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const member = await storage.joinGroup(req.userId!, groupId);
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ message: "Error joining group" });
    }
  });

  app.delete("/api/groups/:groupId/leave", requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      await storage.leaveGroup(req.userId!, groupId);
      res.json({ message: "Left group successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error leaving group" });
    }
  });

  // Pages routes
  app.get("/api/pages", requireAuth, async (req, res) => {
    const pages = await storage.getAllPages();
    res.json(pages);
  });

  app.post("/api/pages", requireAuth, async (req, res) => {
    try {
      const pageData = { ...req.body, createdBy: req.userId! };
      const page = await storage.createPage(pageData);
      res.status(201).json(page);
    } catch (error) {
      res.status(400).json({ message: "Error creating page" });
    }
  });

  app.post("/api/pages/:pageId/follow", requireAuth, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      const follower = await storage.followPage(req.userId!, pageId);
      res.status(201).json(follower);
    } catch (error) {
      res.status(400).json({ message: "Error following page" });
    }
  });

  app.delete("/api/pages/:pageId/unfollow", requireAuth, async (req, res) => {
    try {
      const pageId = parseInt(req.params.pageId);
      await storage.unfollowPage(req.userId!, pageId);
      res.json({ message: "Unfollowed page successfully" });
    } catch (error) {
      res.status(400).json({ message: "Error unfollowing page" });
    }
  });

  // Games routes
  app.get("/api/games", requireAuth, async (req, res) => {
    const games = await storage.getAllGames();
    res.json(games);
  });

  app.post("/api/games", requireAuth, async (req, res) => {
    try {
      const game = await storage.createGame(req.body);
      res.status(201).json(game);
    } catch (error) {
      res.status(400).json({ message: "Error creating game" });
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
