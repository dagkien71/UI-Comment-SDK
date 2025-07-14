import { CommentAttachment } from "../types";
import { ImageCompressor } from "./imageCompression";
import {
  AdvancedImageCompressor,
  AdvancedCompressionOptions,
} from "./advancedImageCompression";

export class Base64UploadManager {
  private maxFileSize: number;
  private allowedTypes: string[];
  private enableCompression: boolean;
  private compressionMode: "basic" | "advanced" | "minimal";
  private advancedOptions?: AdvancedCompressionOptions;

  constructor(
    maxFileSize: number = 5 * 1024 * 1024,
    enableCompression: boolean = true,
    compressionMode: "basic" | "advanced" | "minimal" = "basic",
    advancedOptions?: AdvancedCompressionOptions
  ) {
    // 5MB default
    this.maxFileSize = maxFileSize;
    this.enableCompression = enableCompression;
    this.compressionMode = compressionMode;
    this.advancedOptions = advancedOptions;
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
      let base64: string;
      let finalSize: number;

      if (this.enableCompression && this.isImage(file)) {
        // Advanced compression based on mode
        if (
          this.compressionMode === "advanced" ||
          this.compressionMode === "minimal"
        ) {
          const scenario =
            this.compressionMode === "minimal" ? "minimal" : "balanced";
          const options =
            this.advancedOptions ||
            AdvancedImageCompressor.getOptimalSettings(file.size, scenario);

          base64 = await AdvancedImageCompressor.compressImageAdvanced(
            file,
            options
          );

          // Estimate compressed size
          const base64Size = this.getBase64Size(base64);
          finalSize = base64Size;

          console.log(
            `📸 Advanced image compression (${scenario}): ${this.formatFileSize(
              file.size
            )} → ${this.formatFileSize(finalSize)}`
          );
        } else {
          // Basic compression
          const compressionOptions = ImageCompressor.getOptimalSettings(
            file.size
          );
          base64 = await ImageCompressor.compressImage(
            file,
            compressionOptions
          );

          // Estimate compressed size
          finalSize = ImageCompressor.estimateCompressedSize(
            file.size,
            compressionOptions
          );

          console.log(
            `📸 Basic image compression: ${this.formatFileSize(
              file.size
            )} → ~${this.formatFileSize(finalSize)}`
          );
        }
      } else {
        // Use original file for non-images or when compression is disabled
        base64 = await this.fileToBase64(file);
        finalSize = file.size;
      }

      return {
        id: this.generateId(),
        filename: file.name,
        url: base64,
        type: file.type.startsWith("image/") ? "image" : "file",
        size: finalSize,
        originalSize: file.size, // Keep original size for reference
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
   * Calculate base64 size in bytes
   */
  private getBase64Size(base64: string): number {
    // Remove data URL prefix
    const base64Data = base64.split(",")[1];
    if (!base64Data) return 0;

    // Calculate size: base64 is 4/3 of original size
    return Math.ceil((base64Data.length * 3) / 4);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Create different compression instances
export const base64UploadManager = new Base64UploadManager(); // Basic compression
export const advancedUploadManager = new Base64UploadManager(
  5 * 1024 * 1024,
  true,
  "advanced"
); // Advanced compression
export const minimalUploadManager = new Base64UploadManager(
  5 * 1024 * 1024,
  true,
  "minimal"
); // Minimal size compression

// Create custom instances with specific options
export const createCustomUploadManager = (
  options: AdvancedCompressionOptions
) => {
  return new Base64UploadManager(5 * 1024 * 1024, true, "advanced", options);
};
