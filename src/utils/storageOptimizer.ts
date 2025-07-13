import { Comment, CommentAttachment } from "../types";

export interface StorageStats {
  totalComments: number;
  totalAttachments: number;
  totalSize: number;
  compressedSize: number;
  savings: number;
  savingsPercentage: number;
}

export class StorageOptimizer {
  /**
   * Analyze storage usage and provide statistics
   */
  static analyzeStorage(comments: Comment[]): StorageStats {
    let totalSize = 0;
    let compressedSize = 0;
    let totalAttachments = 0;

    const processComments = (commentList: Comment[]) => {
      commentList.forEach((comment) => {
        if (comment.attachments) {
          comment.attachments.forEach((attachment) => {
            totalAttachments++;

            // Calculate base64 size (roughly 4/3 of original size)
            const base64Size = attachment.url.length * 0.75;
            totalSize += base64Size;

            // If compressed, use compressed size
            if (attachment.originalSize) {
              compressedSize += base64Size;
            } else {
              compressedSize += base64Size;
            }
          });
        }

        // Process replies recursively
        if (comment.replies.length > 0) {
          processComments(comment.replies);
        }
      });
    };

    processComments(comments);

    const savings = totalSize - compressedSize;
    const savingsPercentage = totalSize > 0 ? (savings / totalSize) * 100 : 0;

    return {
      totalComments: comments.length,
      totalAttachments,
      totalSize: Math.round(totalSize),
      compressedSize: Math.round(compressedSize),
      savings: Math.round(savings),
      savingsPercentage: Math.round(savingsPercentage * 100) / 100,
    };
  }

  /**
   * Get storage recommendations
   */
  static getRecommendations(stats: StorageStats): string[] {
    const recommendations: string[] = [];

    if (stats.totalSize > 10 * 1024 * 1024) {
      // > 10MB
      recommendations.push(
        "⚠️ Storage size is large (>10MB). Consider enabling image compression."
      );
    }

    if (stats.savingsPercentage < 20) {
      recommendations.push(
        "💡 Enable image compression to reduce storage by 20-60%"
      );
    }

    if (stats.totalAttachments > 50) {
      recommendations.push(
        "📁 Consider implementing file cleanup for old attachments"
      );
    }

    if (stats.totalSize > 50 * 1024 * 1024) {
      // > 50MB
      recommendations.push(
        "🚨 Storage size is very large (>50MB). Consider external storage solution."
      );
    }

    return recommendations;
  }

  /**
   * Estimate JSON file size
   */
  static estimateJsonSize(comments: Comment[]): number {
    const jsonString = JSON.stringify(comments);
    return new Blob([jsonString]).size;
  }

  /**
   * Clean up old attachments (older than X days)
   */
  static cleanupOldAttachments(
    comments: Comment[],
    daysOld: number = 30
  ): Comment[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const cleanComments = (commentList: Comment[]): Comment[] => {
      return commentList.map((comment) => {
        // Clean attachments
        const cleanedAttachments = comment.attachments?.filter((attachment) => {
          const uploadDate = new Date(attachment.uploadedAt);
          return uploadDate > cutoffDate;
        });

        // Clean replies
        const cleanedReplies = cleanComments(comment.replies);

        return {
          ...comment,
          attachments: cleanedAttachments,
          replies: cleanedReplies,
        };
      });
    };

    return cleanComments(comments);
  }

  /**
   * Convert size to human readable format
   */
  static formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
