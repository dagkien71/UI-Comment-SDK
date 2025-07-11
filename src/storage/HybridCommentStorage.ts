import { Comment } from "../types";

export class HybridCommentStorage {
  private static readonly STORAGE_KEY = "uicm-comments";
  private static readonly JSON_FILE_PATH = "/src/storage/comments.json";

  // Load comments từ cả localStorage và file JSON
  public static async loadComments(): Promise<Comment[]> {
    try {
      // Load từ localStorage trước
      const localComments = this.loadFromLocalStorage();

      // Load từ file JSON
      const fileComments = await this.loadFromJsonFile();

      // Merge comments (localStorage có priority)
      const mergedComments = this.mergeComments(localComments, fileComments);

      return mergedComments;
    } catch (error) {
      console.error("Failed to load comments:", error);
      return [];
    }
  }

  // Load từ localStorage
  private static loadFromLocalStorage(): Comment[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.comments || [];
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
    return [];
  }

  // Load từ file JSON
  private static async loadFromJsonFile(): Promise<Comment[]> {
    try {
      // Trong environment development, có thể load từ file
      const isDevelopment =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost";
      if (isDevelopment) {
        const response = await fetch(this.JSON_FILE_PATH);
        if (response.ok) {
          const data = await response.json();
          return data.comments || [];
        }
      }
    } catch (error: any) {
      console.log(
        "Could not load from JSON file (this is normal in production):",
        error.message
      );
    }
    return [];
  }

  // Merge comments từ hai nguồn
  private static mergeComments(
    localComments: Comment[],
    fileComments: Comment[]
  ): Comment[] {
    const commentMap = new Map<string, Comment>();

    // Add file comments first
    fileComments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    // Override with local comments (có priority cao hơn)
    localComments.forEach((comment) => {
      commentMap.set(comment.id, comment);
    });

    return Array.from(commentMap.values());
  }

  // Save comments vào cả localStorage và file JSON
  public static async saveComments(comments: Comment[]): Promise<void> {
    try {
      // Save vào localStorage
      this.saveToLocalStorage(comments);

      // Save vào file JSON (development only)
      await this.saveToJsonFile(comments);
    } catch (error) {
      console.error("Failed to save comments:", error);
    }
  }

  // Save vào localStorage
  private static saveToLocalStorage(comments: Comment[]): void {
    try {
      const data = {
        comments,
        lastUpdated: new Date().toISOString(),
        source: "hybrid-storage",
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  // Save vào file JSON (development only)
  private static async saveToJsonFile(comments: Comment[]): Promise<void> {
    try {
      const isDevelopment =
        typeof window !== "undefined" &&
        window.location.hostname === "localhost";
      if (isDevelopment) {
        const data = {
          comments,
          lastUpdated: new Date().toISOString(),
          version: "1.0.0",
          source: "hybrid-storage",
        };

        // Tạo JSON string
        const jsonString = JSON.stringify(data, null, 2);

        // Log để copy vào file manually
        console.log("📝 Copy this JSON to src/storage/comments.json:");
        console.log(jsonString);

        // Tự động download file
        this.downloadJsonFile(jsonString);
      }
    } catch (error) {
      console.error("Failed to save to JSON file:", error);
    }
  }

  // Download JSON file
  private static downloadJsonFile(jsonString: string): void {
    try {
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "comments.json";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(
        "💾 Downloaded comments.json - Please replace src/storage/comments.json with this file"
      );
    } catch (error) {
      console.error("Failed to download JSON file:", error);
    }
  }

  // Add new comment
  public static async addComment(
    comment: Omit<Comment, "id" | "createdAt">
  ): Promise<Comment> {
    const comments = await this.loadComments();

    const newComment: Comment = {
      ...comment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    await this.saveComments(comments);

    return newComment;
  }

  // Update comment
  public static async updateComment(updatedComment: Comment): Promise<Comment> {
    const comments = await this.loadComments();
    const index = comments.findIndex((c) => c.id === updatedComment.id);

    if (index !== -1) {
      comments[index] = updatedComment;
      await this.saveComments(comments);
    }

    return updatedComment;
  }

  // Delete comment
  public static async deleteComment(commentId: string): Promise<void> {
    const comments = await this.loadComments();
    const filteredComments = comments.filter((c) => c.id !== commentId);
    await this.saveComments(filteredComments);
  }

  // Get comments for URL
  public static async getCommentsForUrl(url: string): Promise<Comment[]> {
    const allComments = await this.loadComments();
    return allComments.filter((comment) => comment.url === url);
  }

  // Generate unique ID
  private static generateId(): string {
    return (
      "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Clear all comments
  public static async clearAllComments(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
    await this.saveComments([]);
  }

  // Sync từ localStorage lên file JSON
  public static async syncToFile(): Promise<void> {
    const localComments = this.loadFromLocalStorage();
    await this.saveToJsonFile(localComments);
    console.log("✅ Synced localStorage comments to JSON file");
  }

  // Import từ file JSON vào localStorage
  public static async importFromFile(): Promise<void> {
    const fileComments = await this.loadFromJsonFile();
    this.saveToLocalStorage(fileComments);
    console.log("✅ Imported file comments to localStorage");
  }
}
