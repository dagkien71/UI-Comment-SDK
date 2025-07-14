import { Comment } from "../types";

export class CommentStorage {
  private static readonly STORAGE_KEY = "uicm-comments";

  // Load comments from localStorage
  public static loadComments(): Comment[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return data.comments || [];
      }
    } catch (error) {
      console.error("Failed to load comments from storage:", error);
    }
    return [];
  }

  // Save comments to localStorage
  public static saveComments(comments: Comment[]): void {
    try {
      const data = {
        comments,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save comments to storage:", error);
    }
  }

  // Add a new comment
  public static addComment(comment: Comment): Comment {
    const comments = this.loadComments();
    const newComment = {
      ...comment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    this.saveComments(comments);
    return newComment;
  }

  // Update an existing comment
  public static updateComment(updatedComment: Comment): Comment {
    const comments = this.loadComments();
    const index = comments.findIndex((c) => c.id === updatedComment.id);
    if (index !== -1) {
      comments[index] = updatedComment;
      this.saveComments(comments);
    }
    return updatedComment;
  }

  // Delete a comment
  public static deleteComment(commentId: string): void {
    const comments = this.loadComments();
    const filteredComments = comments.filter((c) => c.id !== commentId);
    this.saveComments(filteredComments);
  }

  // Get comments for specific URL
  public static getCommentsForUrl(url: string): Comment[] {
    const allComments = this.loadComments();
    return allComments.filter((comment) => comment.url === url);
  }

  // Get comments for specific element XPath
  public static getCommentsForXPath(xpath: string, url: string): Comment[] {
    const allComments = this.loadComments();
    return allComments.filter(
      (comment) => comment.xpath === xpath && comment.url === url
    );
  }

  // Clear all comments (for development/testing)
  public static clearAllComments(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Export comments to JSON file (for backup)
  public static exportComments(): string {
    const comments = this.loadComments();
    return JSON.stringify(
      {
        comments,
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
      },
      null,
      2
    );
  }

  // Import comments from JSON string
  public static importComments(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      if (data.comments && Array.isArray(data.comments)) {
        this.saveComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to import comments:", error);
    }
  }

  // Generate unique ID
  private static generateId(): string {
    return (
      "comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  // Get storage info
  public static getStorageInfo(): {
    totalComments: number;
    storageSize: number;
    lastUpdated: string | null;
  } {
    const comments = this.loadComments();
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const storageSize = stored ? new Blob([stored]).size : 0;

    let lastUpdated = null;
    try {
      const data = JSON.parse(stored || "{}");
      lastUpdated = data.lastUpdated || null;
    } catch (error) {
      // Ignore parse errors
    }

    return {
      totalComments: comments.length,
      storageSize,
      lastUpdated,
    };
  }
}
