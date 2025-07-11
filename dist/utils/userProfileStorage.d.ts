import { User } from "../types";
export interface UserProfileStorage {
    saveUserProfile(user: User): void;
    loadUserProfile(): User | null;
    clearUserProfile(): void;
    updateUserProfile(updates: Partial<User>): User | null;
}
export declare class LocalUserProfileStorage implements UserProfileStorage {
    private storageKey;
    constructor(storageKey?: string);
    saveUserProfile(user: User): void;
    loadUserProfile(): User | null;
    clearUserProfile(): void;
    updateUserProfile(updates: Partial<User>): User | null;
}
export declare const userProfileStorage: LocalUserProfileStorage;
//# sourceMappingURL=userProfileStorage.d.ts.map