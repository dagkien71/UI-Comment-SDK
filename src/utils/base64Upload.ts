import { CommentAttachment } from "../types";

export class Base64UploadManager {
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor(maxFileSize: number = 5 * 1024 * 1024) {
    // 5MB default
    this.maxFileSize = maxFileSize;
    this.allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
      "application/x-rar-compressed",
    ];
  }

  /**
   * Convert file to base64 and create attachment
   */
  async uploadFile(file: File): Promise<CommentAttachment> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error(
        `File too large. Maximum size is ${this.formatFileSize(
          this.maxFileSize
        )}`
      );
    }

    // Validate file type
    if (this.allowedTypes.indexOf(file.type) === -1) {
      throw new Error(
        `File type not allowed. Allowed types: ${this.allowedTypes.join(", ")}`
      );
    }

    try {
      const base64 = await this.fileToBase64(file);

      return {
        id: this.generateId(),
        filename: file.name,
        url: base64,
        type: file.type.startsWith("image/") ? "image" : "file",
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Base64 conversion failed:", error);
      throw new Error(`Failed to process file: ${file.name}`);
    }
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[]): Promise<CommentAttachment[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Check if file is an image
   */
  isImage(file: File): boolean {
    return file.type.startsWith("image/");
  }

  /**
   * Get file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Create default instance
export const base64UploadManager = new Base64UploadManager();
