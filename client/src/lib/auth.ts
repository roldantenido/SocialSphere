import { User } from "@shared/schema";

export interface AuthState {
  user: User | null;
  sessionId: string | null;
  isAuthenticated: boolean;
}

export const authStorage = {
  getSessionId(): string | null {
    return localStorage.getItem("sessionId");
  },
  
  setSessionId(sessionId: string): void {
    localStorage.setItem("sessionId", sessionId);
  },
  
  removeSessionId(): void {
    localStorage.removeItem("sessionId");
  },
  
  getUser(): User | null {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  },
  
  setUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  },
  
  removeUser(): void {
    localStorage.removeItem("user");
  },
  
  clear(): void {
    this.removeSessionId();
    this.removeUser();
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const sessionId = authStorage.getSessionId();
  return sessionId ? { Authorization: `Bearer ${sessionId}` } : {};
};
