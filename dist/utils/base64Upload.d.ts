import { CommentAttachment } from "../types";
import { AdvancedCompressionOptions } from "./advancedImageCompression";
export declare class Base64UploadManager {
    private maxFileSize;
    private allowedTypes;
    private enableCompression;
    private compressionMode;
    private advancedOptions?;
    constructor(maxFileSize?: number, enableCompression?: boolean, compressionMode?: "basic" | "advanced" | "minimal", advancedOptions?: AdvancedCompressionOptions);
    /**
     * Convert file to base64 and create attachment
     */
    uploadFile(file: File): Promise<CommentAttachment>;
    /**
     * Convert file to base64 string
     */
    private fileToBase64;
    /**
     * Upload multiple files
     */
    uploadFiles(files: File[]): Promise<CommentAttachment[]>;
    /**
     * Check if file is an image
     */
    isImage(file: File): boolean;
    /**
     * Get file size in human readable format
     */
    private formatFileSize;
    /**
     * Calculate base64 size in bytes
     */
    private getBase64Size;
    /**
     * Generate unique ID
     */
    private generateId;
}
export declare const base64UploadManager: Base64UploadManager;
export declare const advancedUploadManager: Base64UploadManager;
export declare const minimalUploadManager: Base64UploadManager;
export declare const createCustomUploadManager: (options: AdvancedCompressionOptions) => Base64UploadManager;
