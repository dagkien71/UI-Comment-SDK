import { User } from "../types";

const USER_PROFILE_KEY = "uicm-user-profile";

export interface UserProfileStorage {
  saveUserProfile(user: User): void;
  loadUserProfile(): User | null;
  clearUserProfile(): void;
  updateUserProfile(updates: Partial<User>): User | null;
}

export class LocalUserProfileStorage implements UserProfileStorage {
  private storageKey: string;

  constructor(storageKey: string = USER_PROFILE_KEY) {
    this.storageKey = storageKey;
  }

  public saveUserProfile(user: User): void {
    try {
      const userData = JSON.stringify(user);
      localStorage.setItem(this.storageKey, userData);
    } catch (error) {
      // console.error("Failed to save user profile to localStorage:", error);
    }
  }

  public loadUserProfile(): User | null {
    try {
      const userData = localStorage.getItem(this.storageKey);
      if (!userData) {
        return null;
      }

      const user = JSON.parse(userData) as User;
      return user;
    } catch (error) {
      // console.error("Failed to load user profile from localStorage:", error);
      return null;
    }
  }

  public clearUserProfile(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      // console.error("Failed to clear user profile from localStorage:", error);
    }
  }

  public updateUserProfile(updates: Partial<User>): User | null {
    try {
      const currentUser = this.loadUserProfile();
      if (!currentUser) {
        return null;
      }

      const updatedUser: User = {
        ...currentUser,
        ...updates,
      };

      this.saveUserProfile(updatedUser);
      return updatedUser;
    } catch (error) {
      // console.error("Failed to update user profile in localStorage:", error);
      return null;
    }
  }
}

// Default instance
export const userProfileStorage = new LocalUserProfileStorage();
