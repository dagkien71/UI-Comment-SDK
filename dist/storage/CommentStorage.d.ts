import { Comment } from "../types";
export declare class CommentStorage {
    private static readonly STORAGE_KEY;
    static loadComments(): Comment[];
    static saveComments(comments: Comment[]): void;
    static addComment(comment: Comment): Comment;
    static updateComment(updatedComment: Comment): Comment;
    static deleteComment(commentId: string): void;
    static getCommentsForUrl(url: string): Comment[];
    static getCommentsForXPath(xpath: string, url: string): Comment[];
    static clearAllComments(): void;
    static exportComments(): string;
    static importComments(jsonString: string): void;
    private static generateId;
    static getStorageInfo(): {
        totalComments: number;
        storageSize: number;
        lastUpdated: string | null;
    };
}
