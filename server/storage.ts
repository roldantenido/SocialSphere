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

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUserWithFriendCount(id: number): Promise<UserWithFriendCount | undefined>;

  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<PostWithUser[]>;
  getUserPosts(userId: number): Promise<PostWithUser[]>;
  getPost(id: number): Promise<PostWithUser | undefined>;
  updatePostCounts(postId: number, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void>;

  // Friendships
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
  updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<void>;
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

  // Chat
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private friendships: Map<string, Friendship>;
  private likes: Map<string, Like>;
  private comments: Map<number, Comment>;
  private chatMessages: Map<number, ChatMessage>;
  private currentUserId: number;
  private currentPostId: number;
  private currentFriendshipId: number;
  private currentLikeId: number;
  private currentCommentId: number;
  private currentChatMessageId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.friendships = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.chatMessages = new Map();
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentFriendshipId = 1;
    this.currentLikeId = 1;
    this.currentCommentId = 1;
    this.currentChatMessageId = 1;

    // Initialize with some sample users
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const sampleUsers = [
      {
        username: "johndoe",
        email: "john@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        bio: "Software Developer | Photography Enthusiast | Adventure Seeker",
        profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        location: "New York, NY",
        work: "Software Developer at TechCorp"
      },
      {
        username: "sarahjohnson",
        email: "sarah@example.com", 
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        bio: "Hiking enthusiast and nature lover",
        profilePhoto: "https://images.unsplash.com/photo-1494790108755-2616b612b550?w=100&h=100&fit=crop&crop=face"
      },
      {
        username: "mikechen",
        email: "mike@example.com",
        password: "password123", 
        firstName: "Mike",
        lastName: "Chen",
        bio: "Team player and success driven",
        profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      }
    ];

    sampleUsers.forEach(userData => {
      const user: User = {
        ...userData,
        id: this.currentUserId++,
        coverPhoto: null,
        createdAt: new Date(),
      };
      this.users.set(user.id, user);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithFriendCount(id: number): Promise<UserWithFriendCount | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const friendsCount = Array.from(this.friendships.values())
      .filter(f => (f.userId === id || f.friendId === id) && f.status === 'accepted')
      .length;

    return { ...user, friendsCount };
  }

  // Posts
  async createPost(insertPost: InsertPost): Promise<Post> {
    const post: Post = {
      ...insertPost,
      id: this.currentPostId++,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date(),
    };
    this.posts.set(post.id, post);
    return post;
  }

  async getPosts(): Promise<PostWithUser[]> {
    const postsArray = Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const postsWithUser: PostWithUser[] = [];

    for (const post of postsArray) {
      const user = await this.getUser(post.userId);
      if (user) {
        postsWithUser.push({
          ...post,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            username: user.username,
          }
        });
      }
    }

    return postsWithUser;
  }

  async getUserPosts(userId: number): Promise<PostWithUser[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const user = await this.getUser(userId);
    if (!user) return [];

    return userPosts.map(post => ({
      ...post,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        username: user.username,
      }
    }));
  }

  async getPost(id: number): Promise<PostWithUser | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;

    const user = await this.getUser(post.userId);
    if (!user) return undefined;

    return {
      ...post,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        username: user.username,
      }
    };
  }

  async updatePostCounts(postId: number, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void> {
    const post = this.posts.get(postId);
    if (post) {
      post[field] += increment;
      this.posts.set(postId, post);
    }
  }

  // Friendships
  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const friendship: Friendship = {
      ...insertFriendship,
      id: this.currentFriendshipId++,
      createdAt: new Date(),
    };
    const key = `${friendship.userId}-${friendship.friendId}`;
    this.friendships.set(key, friendship);
    return friendship;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    const key1 = `${userId}-${friendId}`;
    const key2 = `${friendId}-${userId}`;
    return this.friendships.get(key1) || this.friendships.get(key2);
  }

  async updateFriendshipStatus(userId: number, friendId: number, status: string): Promise<void> {
    const key1 = `${userId}-${friendId}`;
    const key2 = `${friendId}-${userId}`;
    const friendship = this.friendships.get(key1) || this.friendships.get(key2);

    if (friendship) {
      friendship.status = status;
      const key = friendship.userId === userId ? key1 : key2;
      this.friendships.set(key, friendship);
    }
  }

  async getUserFriends(userId: number): Promise<User[]> {
    const friendIds = Array.from(this.friendships.values())
      .filter(f => f.status === 'accepted' && (f.userId === userId || f.friendId === userId))
      .map(f => f.userId === userId ? f.friendId : f.userId);

    const friends: User[] = [];
    for (const friendId of friendIds) {
      const friend = await this.getUser(friendId);
      if (friend) friends.push(friend);
    }

    return friends;
  }

  async getFriendRequests(userId: number): Promise<User[]> {
    const requesterIds = Array.from(this.friendships.values())
      .filter(f => f.status === 'pending' && f.friendId === userId)
      .map(f => f.userId);

    const requesters: User[] = [];
    for (const requesterId of requesterIds) {
      const requester = await this.getUser(requesterId);
      if (requester) requesters.push(requester);
    }

    return requesters;
  }

  async getFriendSuggestions(userId: number): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    const existingConnections = Array.from(this.friendships.values())
      .filter(f => f.userId === userId || f.friendId === userId)
      .map(f => f.userId === userId ? f.friendId : f.userId);

    return allUsers
      .filter(user => user.id !== userId && !existingConnections.includes(user.id))
      .slice(0, 5);
  }

  // Likes
  async createLike(insertLike: InsertLike): Promise<Like> {
    const like: Like = {
      ...insertLike,
      id: this.currentLikeId++,
      createdAt: new Date(),
    };
    const key = `${like.userId}-${like.postId}`;
    this.likes.set(key, like);
    await this.updatePostCounts(like.postId, 'likesCount', 1);
    return like;
  }

  async deleteLike(userId: number, postId: number): Promise<void> {
    const key = `${userId}-${postId}`;
    if (this.likes.delete(key)) {
      await this.updatePostCounts(postId, 'likesCount', -1);
    }
  }

  async isPostLiked(userId: number, postId: number): Promise<boolean> {
    const key = `${userId}-${postId}`;
    return this.likes.has(key);
  }

  // Comments
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const comment: Comment = {
      ...insertComment,
      id: this.currentCommentId++,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);
    await this.updatePostCounts(comment.postId, 'commentsCount', 1);
    return comment;
  }

  async getPostComments(postId: number): Promise<CommentWithUser[]> {
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const commentsWithUser: CommentWithUser[] = [];

    for (const comment of postComments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        commentsWithUser.push({
          ...comment,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            username: user.username,
          }
        });
      }
    }

    return commentsWithUser;
  }

  // Chat
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...insertMessage,
      id: this.currentChatMessageId++,
      createdAt: new Date(),
    };
    this.chatMessages.set(message.id, message);
    return message;
  }

  async getChatMessages(userId1: number, userId2: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async deleteUser(userId: number): Promise<boolean> {
    const deleted = this.users.delete(userId);
    // Also delete user's posts, likes, comments, etc.
    this.posts.forEach((post, id) => {
      if (post.userId === userId) {
        this.posts.delete(id);
      }
    });
    this.likes.forEach((like, id) => {
      if (like.userId === userId) {
        this.likes.delete(id);
      }
    });
    this.comments.forEach((comment, id) => {
      if (comment.userId === userId) {
        this.comments.delete(id);
      }
    });
    this.friendships.forEach((friendship, id) => {
      if (friendship.userId === userId || friendship.friendId === userId) {
        this.friendships.delete(id);
      }
    });
    return deleted;
  }

  async deletePost(postId: number): Promise<boolean> {
    const deleted = this.posts.delete(postId);
    // Also delete post's likes and comments
    this.likes.forEach((like, id) => {
      if (like.postId === postId) {
        this.likes.delete(id);
      }
    });
    this.comments.forEach((comment, id) => {
      if (comment.postId === postId) {
        this.comments.delete(id);
      }
    });
    return deleted;
  }
}

export const storage = new MemStorage();