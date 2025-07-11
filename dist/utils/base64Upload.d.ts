import { CommentAttachment } from "../types";
export declare class Base64UploadManager {
    private maxFileSize;
    private allowedTypes;
    constructor(maxFileSize?: number);
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
     * Generate unique ID
     */
    private generateId;
}
export declare const base64UploadManager: Base64UploadManager;
//# sourceMappingURL=base64Upload.d.ts.map