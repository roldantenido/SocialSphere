import { 
  users, 
  posts, 
  friendships, 
  likes, 
  comments, 
  chatMessages,
  groups,
  groupMembers,
  pages,
  pageFollowers,
  games,
  type User, 
  type InsertUser, 
  type Post, 
  type InsertPost,
  type Friendship,
  type InsertFriendship,
  type Like,
  type InsertLike,
  type Comment,
  type InsertComment,
  type ChatMessage,
  type InsertChatMessage,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type Page,
  type InsertPage,
  type PageFollower,
  type InsertPageFollower,
  type Game,
  type InsertGame,
  type PostWithUser,
  type CommentWithUser,
  type UserWithFriendCount,
  type GroupWithCreator,
  type PageWithCreator,
  type SearchResults
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, notInArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserWithFriendCount(id: number): Promise<UserWithFriendCount | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<PostWithUser[]>;
  getPostsByUser(userId: number): Promise<PostWithUser[]>;
  getUserPosts(userId: number): Promise<PostWithUser[]>;
  getAllPosts(): Promise<PostWithUser[]>;
  getPost(id: number): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;

  // Friendships
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
  updateFriendshipStatus(userId: number, friendId: number, status: 'accepted' | 'declined'): Promise<void>;
  getUserFriends(userId: number): Promise<User[]>;
  getFriendRequests(userId: number): Promise<User[]>;
  getFriendSuggestions(userId: number): Promise<User[]>;

  // Likes
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: number, postId: number): Promise<void>;
  isPostLiked(userId: number, postId: number): Promise<boolean>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getPostComments(postId: number): Promise<CommentWithUser[]>;

  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;

  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<GroupWithCreator[]>;
  getAllGroups(): Promise<GroupWithCreator[]>;
  joinGroup(userId: number, groupId: number): Promise<GroupMember>;
  leaveGroup(userId: number, groupId: number): Promise<void>;

  // Pages
  createPage(page: InsertPage): Promise<Page>;
  getPage(id: number): Promise<Page | undefined>;
  getAllPages(): Promise<PageWithCreator[]>;
  followPage(userId: number, pageId: number): Promise<PageFollower>;
  unfollowPage(userId: number, pageId: number): Promise<void>;

  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;

  // Search
  searchAll(query: string, limit?: number): Promise<SearchResults>;
}

export class DatabaseStorage implements IStorage {
  private dbPromise: Promise<any> | null = null;

  constructor() {
    // Initialize with some sample users only if setup is complete
    this.initializeSampleDataIfReady();
  }

  private async getDB(): Promise<any> {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const { db: dbInstance } = await import('./db');
        const { db: initializedDb } = await dbInstance?.initializeDatabase?.() || await import('./db').then(m => m.getDatabase());
        return initializedDb;
      })();
    }
    return this.dbPromise;
  }


  private async initializeSampleDataIfReady() {
    try {
      // In development mode with DATABASE_URL, initialize sample data
      if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL) {
        console.log('🟢 Development database detected, initializing sample data');
        const db = await this.getDB();
        if (db) {
          await this.initializeSampleData();
        }
        return;
      }

      // For production, only initialize if setup is complete
      const { isSetupComplete } = await import('./setup');
      if (!(await isSetupComplete())) {
        console.log('⚠️ Setup not complete, skipping sample data initialization');
        return;
      }

      await this.initializeSampleData();
    } catch (error) {
      console.log('⚠️ Database not ready, will initialize sample data after setup');
    }
  }

  private async initializeSampleData() {
    try {
      const db = await this.getDB();
      // Check if users already exist
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already initialized
      }

      // Create sample users
      const sampleUsers = [
        {
          username: "admin",
          email: "admin@example.com",
          password: "admin123",
          firstName: "Admin",
          lastName: "User",
          bio: "Platform Administrator",
          profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          location: "System Admin",
          work: "Platform Administrator",
          isAdmin: true
        },
        {
          username: "johndoe",
          email: "john@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
          bio: "Software Developer | Photography Enthusiast | Adventure Seeker",
          profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          location: "New York, NY",
          work: "Software Developer at TechCorp",
          isAdmin: false
        },
        {
          username: "sarahjohnson",
          email: "sarah@example.com", 
          password: "password123",
          firstName: "Sarah",
          lastName: "Johnson",
          bio: "Hiking enthusiast and nature lover",
          profilePhoto: "https://images.unsplash.com/photo-1494790108755-2616b612b550?w=100&h=100&fit=crop&crop=face",
          location: "Seattle, WA",
          work: "Nature Photographer",
          isAdmin: false
        },
        {
          username: "mikechen",
          email: "mike@example.com",
          password: "password123", 
          firstName: "Mike",
          lastName: "Chen",
          bio: "Team player and success driven",
          profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          location: "San Francisco, CA",
          work: "Product Manager",
          isAdmin: false
        }
      ];

      const insertedUsers = await db.insert(users).values(sampleUsers).returning();

      // Create sample groups
      const sampleGroups = [
        {
          name: "Photography Enthusiasts",
          description: "Share your best shots and learn from fellow photographers",
          coverPhoto: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=200&fit=crop",
          createdBy: insertedUsers[1].id, // John Doe
          membersCount: 1245,
          isPrivate: false
        },
        {
          name: "Tech Innovators",
          description: "Discussing the latest in technology and innovation",
          coverPhoto: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
          createdBy: insertedUsers[3].id, // Mike Chen
          membersCount: 892,
          isPrivate: false
        },
        {
          name: "Nature Lovers",
          description: "Connecting outdoor enthusiasts and nature photographers",
          coverPhoto: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=200&fit=crop",
          createdBy: insertedUsers[2].id, // Sarah Johnson
          membersCount: 2156,
          isPrivate: false
        },
        {
          name: "Digital Creators Hub",
          description: "A community for digital artists, designers, and content creators",
          coverPhoto: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop",
          createdBy: insertedUsers[1].id, // John Doe
          membersCount: 1567,
          isPrivate: false
        }
      ];

      await db.insert(groups).values(sampleGroups);

      // Create sample pages
      const samplePages = [
        {
          name: "TechNews Daily",
          description: "Your daily dose of technology news and updates",
          category: "business",
          coverPhoto: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop",
          profilePhoto: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop",
          createdBy: insertedUsers[0].id, // Admin
          followersCount: 15420,
          isVerified: true
        },
        {
          name: "Creative Studio Co.",
          description: "Professional design and creative services",
          category: "brand",
          coverPhoto: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop",
          profilePhoto: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop",
          createdBy: insertedUsers[1].id, // John Doe
          followersCount: 8934,
          isVerified: true
        },
        {
          name: "Adventure Seekers",
          description: "Explore the world's most amazing destinations",
          category: "community",
          coverPhoto: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop",
          profilePhoto: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
          createdBy: insertedUsers[2].id, // Sarah Johnson
          followersCount: 23156,
          isVerified: false
        },
        {
          name: "Startup Valley",
          description: "Latest news and insights from the startup ecosystem",
          category: "business",
          coverPhoto: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=200&fit=crop",
          profilePhoto: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=100&h=100&fit=crop",
          createdBy: insertedUsers[3].id, // Mike Chen
          followersCount: 12867,
          isVerified: true
        }
      ];

      await db.insert(pages).values(samplePages);

      // Create sample games
      const sampleGames = [
        {
          name: "Word Quest Challenge",
          description: "Test your vocabulary skills with this exciting word puzzle game",
          category: "puzzle",
          thumbnailUrl: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop",
          playUrl: "/games/word-quest",
          playersCount: 45678,
          rating: 4
        },
        {
          name: "Math Master Pro",
          description: "Challenge your mathematical skills with increasingly difficult problems",
          category: "puzzle",
          thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop",
          playUrl: "/games/math-master",
          playersCount: 23456,
          rating: 5
        },
        {
          name: "Memory Palace",
          description: "Enhance your memory with this brain training game",
          category: "casual",
          thumbnailUrl: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop",
          playUrl: "/games/memory-palace",
          playersCount: 67890,
          rating: 4
        },
        {
          name: "Strategy Empire",
          description: "Build your empire and conquer the world in this strategic game",
          category: "strategy",
          thumbnailUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
          playUrl: "/games/strategy-empire",
          playersCount: 34567,
          rating: 5
        },
        {
          name: "Action Heroes",
          description: "Fast-paced action adventure game with multiple heroes",
          category: "action",
          thumbnailUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop",
          playUrl: "/games/action-heroes",
          playersCount: 89012,
          rating: 4
        }
      ];

      await db.insert(games).values(sampleGames);

      // Create sample posts
      const samplePosts = [
        {
          userId: insertedUsers[1].id,
          content: "Just tried the new camera settings for street photography. The results are amazing! 📸",
          imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&h=400&fit=crop",
          likesCount: 42,
          commentsCount: 8,
          sharesCount: 3
        }
      ];

      await db.insert(posts).values(samplePosts);

    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const db = await this.getDB();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getDB();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await this.getDB();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await this.getDB();
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        bio: insertUser.bio ?? null,
        profilePhoto: insertUser.profilePhoto ?? null,
        coverPhoto: insertUser.coverPhoto ?? null,
        location: insertUser.location ?? null,
        work: insertUser.work ?? null,
        isAdmin: false,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const db = await this.getDB();
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserWithFriendCount(id: number): Promise<UserWithFriendCount | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const db = await this.getDB();
    const friendsCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(friendships)
      .where(
        and(
          or(eq(friendships.userId, id), eq(friendships.friendId, id)),
          eq(friendships.status, 'accepted')
        )
      );

    const friendsCount = friendsCountResult[0]?.count || 0;
    return { ...user, friendsCount };
  }

  // Posts
  async createPost(insertPost: InsertPost): Promise<Post> {
    const db = await this.getDB();
    const [post] = await db
      .insert(posts)
      .values({
        ...insertPost,
        imageUrl: insertPost.imageUrl ?? null,
        videoUrl: insertPost.videoUrl ?? null,
        mediaType: insertPost.mediaType ?? null,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      })
      .returning();
    return post;
  }

  async getPosts(): Promise<PostWithUser[]> {
    const db = await this.getDB();
    const postsWithUsers = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        mediaType: posts.mediaType,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        userId: posts.userId,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));

    return postsWithUsers.map(p => ({
      ...p,
      user: p.user!
    }));
  }

  async getPostsByUser(userId: number): Promise<PostWithUser[]> {
    const db = await this.getDB();
    const postsWithUsers = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        videoUrl: posts.videoUrl,
        mediaType: posts.mediaType,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        sharesCount: posts.sharesCount,
        userId: posts.userId,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username,
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));

    return postsWithUsers.map(p => ({
      ...p,
      user: p.user!
    }));
  }

  async getPost(id: number): Promise<Post | undefined> {
    const db = await this.getDB();
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async deletePost(id: number): Promise<boolean> {
    const db = await this.getDB();
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Friendships
  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const db = await this.getDB();
    const [friendship] = await db
      .insert(friendships)
      .values(insertFriendship)
      .returning();
    return friendship;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    const db = await this.getDB();
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      );
    return friendship || undefined;
  }

  async updateFriendshipStatus(userId: number, friendId: number, status: 'accepted' | 'declined'): Promise<void> {
    const db = await this.getDB();
    await db
      .update(friendships)
      .set({ status })
      .where(
        and(
          eq(friendships.userId, userId),
          eq(friendships.friendId, friendId)
        )
      );
  }

  async getUserFriends(userId: number): Promise<User[]> {
    const db = await this.getDB();
    const friendIds = await db
      .select({
        friendId: sql<number>`CASE 
          WHEN ${friendships.userId} = ${userId} THEN ${friendships.friendId}
          ELSE ${friendships.userId}
        END`
      })
      .from(friendships)
      .where(
        and(
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
          eq(friendships.status, 'accepted')
        )
      );

    if (friendIds.length === 0) return [];

    const friends = await db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${friendIds.map(f => f.friendId).join(',')})`);

    return friends;
  }

  async getFriendRequests(userId: number): Promise<User[]> {
    const db = await this.getDB();
    const requestUserIds = await db
      .select({ userId: friendships.userId })
      .from(friendships)
      .where(
        and(
          eq(friendships.friendId, userId),
          eq(friendships.status, 'pending')
        )
      );

    if (requestUserIds.length === 0) return [];

    // Use inArray instead of raw SQL
    const requestUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, requestUserIds.map(r => r.userId)));

    return requestUsers;
  }

  async getFriendSuggestions(userId: number): Promise<User[]> {
    const db = await this.getDB();
    // Get users that are not already friends or have pending requests
    const existingConnections = await db
      .select({
        connectedUserId: sql<number>`CASE 
          WHEN ${friendships.userId} = ${userId} THEN ${friendships.friendId}
          ELSE ${friendships.userId}
        END`
      })
      .from(friendships)
      .where(
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId))
      );

    const excludeIds = [userId, ...existingConnections.map(c => c.connectedUserId)];

    // Use notInArray instead of raw SQL
    const suggestions = await db
      .select()
      .from(users)
      .where(notInArray(users.id, excludeIds))
      .limit(5);

    return suggestions;
  }

  // Likes
  async createLike(insertLike: InsertLike): Promise<Like> {
    const db = await this.getDB();
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();

    // Update post likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, insertLike.postId));

    return like;
  }

  async deleteLike(userId: number, postId: number): Promise<void> {
    const db = await this.getDB();
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );

    // Update post likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} - 1` })
      .where(eq(posts.id, postId));
  }

  async isPostLiked(userId: number, postId: number): Promise<boolean> {
    const db = await this.getDB();
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return !!like;
  }

  // Comments
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const db = await this.getDB();
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();

    // Update post comments count
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, insertComment.postId));

    return comment;
  }

  async getPostComments(postId: number): Promise<CommentWithUser[]> {
    const db = await this.getDB();
    const commentsWithUsers = await db
      .select({
        id: comments.id,
        content: comments.content,
        userId: comments.userId,
        postId: comments.postId,
        createdAt: comments.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    return commentsWithUsers.map(c => ({
      ...c,
      user: c.user!
    }));
  }

  // Chat Messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const db = await this.getDB();
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]> {
    const db = await this.getDB();
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, userId1),
            eq(chatMessages.receiverId, userId2)
          ),
          and(
            eq(chatMessages.senderId, userId2),
            eq(chatMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(chatMessages.createdAt);

    return messages;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    const db = await this.getDB();
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = await this.getDB();
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserPosts(userId: number): Promise<PostWithUser[]> {
    return await this.getPostsByUser(userId);
  }

  async getAllPosts(): Promise<PostWithUser[]> {
    return await this.getPosts();
  }

  // Groups
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const db = await this.getDB();
    const [group] = await db
      .insert(groups)
      .values(insertGroup)
      .returning();

    // Add creator as admin member
    await db
      .insert(groupMembers)
      .values({
        groupId: group.id,
        userId: group.createdBy,
        role: 'admin'
      });

    // Update members count
    await db
      .update(groups)
      .set({ membersCount: 1 })
      .where(eq(groups.id, group.id));

    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const db = await this.getDB();
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);
    return group;
  }

  async getUserGroups(userId: number): Promise<GroupWithCreator[]> {
    const db = await this.getDB();
    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverPhoto: groups.coverPhoto,
        createdBy: groups.createdBy,
        membersCount: groups.membersCount,
        isPrivate: groups.isPrivate,
        createdAt: groups.createdAt,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username
        }
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .innerJoin(users, eq(groups.createdBy, users.id))
      .where(eq(groupMembers.userId, userId));

    return userGroups;
  }

  async getAllGroups(): Promise<GroupWithCreator[]> {
    const db = await this.getDB();
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverPhoto: groups.coverPhoto,
        createdBy: groups.createdBy,
        membersCount: groups.membersCount,
        isPrivate: groups.isPrivate,
        createdAt: groups.createdAt,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username
        }
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdBy, users.id))      .where(eq(groups.isPrivate, false))
      .orderBy(desc(groups.membersCount));

    return allGroups;
  }

  async joinGroup(userId: number, groupId: number): Promise<GroupMember> {
    const db = await this.getDB();
    const [member] = await db
      .insert(groupMembers)
      .values({
        userId,
        groupId,
        role: 'member'
      })
      .returning();

    // Update members count
    await db
      .update(groups)
      .set({ membersCount: sql`${groups.membersCount} + 1` })
      .where(eq(groups.id, groupId));

    return member;
  }

  async leaveGroup(userId: number, groupId: number): Promise<void> {
    const db = await this.getDB();
    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.groupId, groupId)
        )
      );

    // Update members count
    await db
      .update(groups)
      .set({ membersCount: sql`${groups.membersCount} - 1` })
      .where(eq(groups.id, groupId));
  }

  // Pages
  async createPage(insertPage: InsertPage): Promise<Page> {
    const db = await this.getDB();
    const [page] = await db
      .insert(pages)
      .values(insertPage)
      .returning();
    return page;
  }

  async getPage(id: number): Promise<Page | undefined> {
    const db = await this.getDB();
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1);
    return page;
  }

  async getAllPages(): Promise<PageWithCreator[]> {
    const db = await this.getDB();
    const allPages = await db
      .select({
        id: pages.id,
        name: pages.name,
        description: pages.description,
        category: pages.category,
        coverPhoto: pages.coverPhoto,
        profilePhoto: pages.profilePhoto,
        createdBy: pages.createdBy,
        followersCount: pages.followersCount,
        isVerified: pages.isVerified,
        createdAt: pages.createdAt,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username
        }
      })
      .from(pages)
      .innerJoin(users, eq(pages.createdBy, users.id))
      .orderBy(desc(pages.followersCount));

    return allPages;
  }

  async followPage(userId: number, pageId: number): Promise<PageFollower> {
    const db = await this.getDB();
    const [follower] = await db
      .insert(pageFollowers)
      .values({
        userId,
        pageId
      })
      .returning();

    // Update followers count
    await db
      .update(pages)
      .set({ followersCount: sql`${pages.followersCount} + 1` })
      .where(eq(pages.id, pageId));

    return follower;
  }

  async unfollowPage(userId: number, pageId: number): Promise<void> {
    const db = await this.getDB();
    await db
      .delete(pageFollowers)
      .where(
        and(
          eq(pageFollowers.userId, userId),
          eq(pageFollowers.pageId, pageId)
        )
      );

    // Update followers count
    await db
      .update(pages)
      .set({ followersCount: sql`${pages.followersCount} - 1` })
      .where(eq(pages.id, pageId));
  }

  // Games
  async createGame(insertGame: InsertGame): Promise<Game> {
    const db = await this.getDB();
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const db = await this.getDB();
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return game;
  }

  async getAllGames(): Promise<Game[]> {
    const db = await this.getDB();
    return await db
      .select()
      .from(games)
      .orderBy(desc(games.playersCount), desc(games.rating));
  }

  // Search
  async searchAll(query: string, limit = 10): Promise<SearchResults> {
    const db = await this.getDB();
    const searchTerm = `%${query.toLowerCase()}%`;

    // Search users
    const searchUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        bio: users.bio,
        profilePhoto: users.profilePhoto,
        coverPhoto: users.coverPhoto,
        location: users.location,
        work: users.work,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        friendsCount: sql<number>`0`
      })
      .from(users)
      .where(
        or(
          sql`LOWER(${users.firstName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.lastName}) LIKE ${searchTerm}`,
          sql`LOWER(${users.username}) LIKE ${searchTerm}`
        )
      )
      .limit(limit);

    // Search groups
    const searchGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        coverPhoto: groups.coverPhoto,
        createdBy: groups.createdBy,
        membersCount: groups.membersCount,
        isPrivate: groups.isPrivate,
        createdAt: groups.createdAt,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username
        }
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdBy, users.id))
      .where(
        and(
          eq(groups.isPrivate, false),
          or(
            sql`LOWER(${groups.name}) LIKE ${searchTerm}`,
            sql`LOWER(${groups.description}) LIKE ${searchTerm}`
          )
        )
      )
      .limit(limit);

    // Search pages
    const searchPages = await db
      .select({
        id: pages.id,
        name: pages.name,
        description: pages.description,
        category: pages.category,
        coverPhoto: pages.coverPhoto,
        profilePhoto: pages.profilePhoto,
        createdBy: pages.createdBy,
        followersCount: pages.followersCount,
        isVerified: pages.isVerified,
        createdAt: pages.createdAt,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePhoto: users.profilePhoto,
          username: users.username
        }
      })
      .from(pages)
      .innerJoin(users, eq(pages.createdBy, users.id))
      .where(
        or(
          sql`LOWER(${pages.name}) LIKE ${searchTerm}`,
          sql`LOWER(${pages.description}) LIKE ${searchTerm}`
        )
      )
      .limit(limit);

    // Search games
    const searchGames = await db
      .select()
      .from(games)
      .where(
        or(
          sql`LOWER(${games.name}) LIKE ${searchTerm}`,
          sql`LOWER(${games.description}) LIKE ${searchTerm}`,
          sql`LOWER(${games.category}) LIKE ${searchTerm}`
        )
      )
      .limit(limit);

    return {
      users: searchUsers,
      groups: searchGroups,
      pages: searchPages,
      games: searchGames
    };
  }
}

export const storage = new DatabaseStorage();