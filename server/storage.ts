import { 
  users, 
  posts, 
  friendships, 
  likes, 
  comments, 
  chatMessages,
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
  type PostWithUser,
  type CommentWithUser,
  type UserWithFriendCount
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with some sample users
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
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

      await db.insert(users).values(sampleUsers);
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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
    const [post] = await db
      .insert(posts)
      .values({
        ...insertPost,
        imageUrl: insertPost.imageUrl ?? null,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
      })
      .returning();
    return post;
  }

  async getPosts(): Promise<PostWithUser[]> {
    const postsWithUsers = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
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
    const postsWithUsers = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
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
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Friendships
  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values(insertFriendship)
      .returning();
    return friendship;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
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

    const requestUsers = await db
      .select()
      .from(users)
      .where(sql`${users.id} IN (${requestUserIds.map(r => r.userId).join(',')})`);

    return requestUsers;
  }

  async getFriendSuggestions(userId: number): Promise<User[]> {
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

    const suggestions = await db
      .select()
      .from(users)
      .where(sql`${users.id} NOT IN (${excludeIds.join(',')})`)
      .limit(5);

    return suggestions;
  }

  // Likes
  async createLike(insertLike: InsertLike): Promise<Like> {
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
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]> {
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
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUserPosts(userId: number): Promise<PostWithUser[]> {
    return await this.getPostsByUser(userId);
  }

  async getAllPosts(): Promise<PostWithUser[]> {
    return await this.getPosts();
  }
}

export const storage = new DatabaseStorage();