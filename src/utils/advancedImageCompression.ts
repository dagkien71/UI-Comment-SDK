export interface AdvancedCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "avif" | "png";
  progressive?: boolean;
  multiplePasses?: boolean;
  adaptiveQuality?: boolean;
  targetSize?: number; // Target size in bytes
  blur?: number; // Blur factor for further compression
  sharpen?: boolean; // Apply sharpening after compression
}

export class AdvancedImageCompressor {
  /**
   * Advanced compression with multiple techniques
   */
  static async compressImageAdvanced(
    file: File,
    options: AdvancedCompressionOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.6,
      format = "webp",
      progressive = true,
      multiplePasses = true,
      adaptiveQuality = true,
      targetSize,
      blur = 0,
      sharpen = false,
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = async () => {
        try {
          // Step 1: Resize image
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Step 2: Apply blur if specified
          if (blur > 0) {
            ctx!.filter = `blur(${blur}px)`;
          }

          // Step 3: Draw image
          ctx!.drawImage(img, 0, 0, width, height);

          // Step 4: Apply sharpening if specified
          if (sharpen) {
            await this.applySharpening(ctx!, width, height);
          }

          // Step 5: Progressive compression with multiple passes
          let finalBase64: string;
          if (multiplePasses && targetSize) {
            finalBase64 = await this.progressiveCompression(
              canvas,
              format,
              targetSize,
              adaptiveQuality
            );
          } else {
            finalBase64 = canvas.toDataURL(this.getMimeType(format), quality);
          }

          resolve(finalBase64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Progressive compression - try different quality levels to reach target size
   */
  private static async progressiveCompression(
    canvas: HTMLCanvasElement,
    format: string,
    targetSize: number,
    adaptiveQuality: boolean
  ): Promise<string> {
    const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
    const mimeType = this.getMimeType(format);

    for (const quality of qualities) {
      const base64 = canvas.toDataURL(mimeType, quality);
      const size = this.getBase64Size(base64);

      if (size <= targetSize) {
        console.log(
          `✅ Progressive compression: ${this.formatSize(
            size
          )} (target: ${this.formatSize(targetSize)})`
        );
        return base64;
      }
    }

    // If still too large, try with lower resolution
    return this.downscaleAndCompress(canvas, format, targetSize);
  }

  /**
   * Downscale image and compress
   */
  private static async downscaleAndCompress(
    canvas: HTMLCanvasElement,
    format: string,
    targetSize: number
  ): Promise<string> {
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const mimeType = this.getMimeType(format);

    // Try different scales
    const scales = [0.8, 0.6, 0.5, 0.4, 0.3, 0.2];

    for (const scale of scales) {
      const newCanvas = document.createElement("canvas");
      const newCtx = newCanvas.getContext("2d")!;

      newCanvas.width = originalWidth * scale;
      newCanvas.height = originalHeight * scale;

      newCtx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);

      const base64 = newCanvas.toDataURL(mimeType, 0.5);
      const size = this.getBase64Size(base64);

      if (size <= targetSize) {
        console.log(
          `✅ Downscaled compression: ${this.formatSize(
            size
          )} (scale: ${scale})`
        );
        return base64;
      }
    }

    // Last resort: return smallest possible
    const finalCanvas = document.createElement("canvas");
    const finalCtx = finalCanvas.getContext("2d")!;
    finalCanvas.width = 200;
    finalCanvas.height = 200;
    finalCtx.drawImage(canvas, 0, 0, 200, 200);

    return finalCanvas.toDataURL(mimeType, 0.3);
  }

  /**
   * Apply sharpening filter
   */
  private static async applySharpening(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): Promise<void> {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Simple unsharp mask
    const factor = 0.5;
    const threshold = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (gray > threshold) {
        data[i] = Math.min(255, r + factor * (r - gray));
        data[i + 1] = Math.min(255, g + factor * (g - gray));
        data[i + 2] = Math.min(255, b + factor * (b - gray));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Get MIME type for format
   */
  private static getMimeType(format: string): string {
    switch (format) {
      case "webp":
        return "image/webp";
      case "avif":
        return "image/avif";
      case "png":
        return "image/png";
      default:
        return "image/jpeg";
    }
  }

  /**
   * Calculate base64 size in bytes
   */
  private static getBase64Size(base64: string): number {
    // Remove data URL prefix
    const base64Data = base64.split(",")[1];
    if (!base64Data) return 0;

    // Calculate size: base64 is 4/3 of original size
    return Math.ceil((base64Data.length * 3) / 4);
  }

  /**
   * Format size to human readable
   */
  private static formatSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get optimal compression settings for different scenarios
   */
  static getOptimalSettings(
    fileSize: number,
    scenario: "minimal" | "balanced" | "quality" = "balanced"
  ): AdvancedCompressionOptions {
    switch (scenario) {
      case "minimal":
        // Maximum compression for smallest size
        return {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.3,
          format: "webp",
          progressive: true,
          multiplePasses: true,
          adaptiveQuality: true,
          targetSize: Math.min(fileSize * 0.1, 100 * 1024), // 10% of original or 100KB max
          blur: 0.5,
          sharpen: false,
        };

      case "balanced":
        // Balanced between size and quality
        return {
          maxWidth: 600,
          maxHeight: 600,
          quality: 0.6,
          format: "webp",
          progressive: true,
          multiplePasses: true,
          adaptiveQuality: true,
          targetSize: Math.min(fileSize * 0.3, 300 * 1024), // 30% of original or 300KB max
          blur: 0,
          sharpen: true,
        };

      case "quality":
        // Prioritize quality over size
        return {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          format: "webp",
          progressive: false,
          multiplePasses: false,
          adaptiveQuality: false,
          blur: 0,
          sharpen: true,
        };

      default:
        return this.getOptimalSettings(fileSize, "balanced");
    }
  }

  /**
   * Compress with specific target size
   */
  static async compressToTargetSize(
    file: File,
    targetSizeBytes: number,
    format: "jpeg" | "webp" | "avif" = "webp"
  ): Promise<string> {
    return this.compressImageAdvanced(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      format,
      progressive: true,
      multiplePasses: true,
      adaptiveQuality: true,
      targetSize: targetSizeBytes,
      blur: 0,
      sharpen: false,
    });
  }
}
