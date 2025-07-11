import { Comment } from "../types";
export declare class HybridCommentStorage {
    private static readonly STORAGE_KEY;
    private static readonly JSON_FILE_PATH;
    static loadComments(): Promise<Comment[]>;
    private static loadFromLocalStorage;
    private static loadFromJsonFile;
    private static mergeComments;
    static saveComments(comments: Comment[]): Promise<void>;
    private static saveToLocalStorage;
    private static saveToJsonFile;
    private static downloadJsonFile;
    static addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment>;
    static updateComment(updatedComment: Comment): Promise<Comment>;
    static deleteComment(commentId: string): Promise<void>;
    static getCommentsForUrl(url: string): Promise<Comment[]>;
    private static generateId;
    static clearAllComments(): Promise<void>;
    static syncToFile(): Promise<void>;
    static importFromFile(): Promise<void>;
}
//# sourceMappingURL=HybridCommentStorage.d.ts.map