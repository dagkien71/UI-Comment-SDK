export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
}

export class ImageCompressor {
  /**
   * Compress image before converting to base64
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = "jpeg",
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const mimeType =
          format === "webp"
            ? "image/webp"
            : format === "png"
            ? "image/png"
            : "image/jpeg";

        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get optimal compression settings based on file size
   */
  static getOptimalSettings(fileSize: number): CompressionOptions {
    if (fileSize > 5 * 1024 * 1024) {
      // > 5MB
      return { maxWidth: 800, maxHeight: 800, quality: 0.6, format: "jpeg" };
    } else if (fileSize > 2 * 1024 * 1024) {
      // > 2MB
      return { maxWidth: 1000, maxHeight: 1000, quality: 0.7, format: "jpeg" };
    } else if (fileSize > 1024 * 1024) {
      // > 1MB
      return { maxWidth: 1200, maxHeight: 1200, quality: 0.8, format: "jpeg" };
    } else {
      return { maxWidth: 1500, maxHeight: 1500, quality: 0.9, format: "jpeg" };
    }
  }

  /**
   * Estimate compressed size
   */
  static estimateCompressedSize(
    originalSize: number,
    options: CompressionOptions
  ): number {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

    // Rough estimation: consider resolution reduction and quality
    const resolutionFactor = Math.min(
      1,
      (maxWidth * maxHeight) / (1920 * 1080)
    );
    const qualityFactor = quality;

    return Math.round(originalSize * resolutionFactor * qualityFactor * 0.7); // 0.7 for format efficiency
  }
}
