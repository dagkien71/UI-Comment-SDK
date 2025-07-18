(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.UICommentSDK = {}));
})(this, (function (exports) { 'use strict';

    exports.CommentStatus = void 0;
    (function (CommentStatus) {
        CommentStatus["BUG"] = "bug";
        CommentStatus["FEATURE_REQUEST"] = "feature_request";
        CommentStatus["DEV_COMPLETED"] = "dev_completed";
        CommentStatus["DONE"] = "done";
        CommentStatus["ARCHIVED"] = "archived";
    })(exports.CommentStatus || (exports.CommentStatus = {}));

    class ImageCompressor {
        /**
         * Compress image before converting to base64
         */
        static async compressImage(file, options = {}) {
            const { maxWidth = 1200, maxHeight = 1200, quality = 0.8, format = "jpeg", } = options;
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
                    const mimeType = format === "webp"
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
        static getOptimalSettings(fileSize) {
            if (fileSize > 5 * 1024 * 1024) {
                // > 5MB
                return { maxWidth: 800, maxHeight: 800, quality: 0.6, format: "jpeg" };
            }
            else if (fileSize > 2 * 1024 * 1024) {
                // > 2MB
                return { maxWidth: 1000, maxHeight: 1000, quality: 0.7, format: "jpeg" };
            }
            else if (fileSize > 1024 * 1024) {
                // > 1MB
                return { maxWidth: 1200, maxHeight: 1200, quality: 0.8, format: "jpeg" };
            }
            else {
                return { maxWidth: 1500, maxHeight: 1500, quality: 0.9, format: "jpeg" };
            }
        }
        /**
         * Estimate compressed size
         */
        static estimateCompressedSize(originalSize, options) {
            const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;
            // Rough estimation: consider resolution reduction and quality
            const resolutionFactor = Math.min(1, (maxWidth * maxHeight) / (1920 * 1080));
            const qualityFactor = quality;
            return Math.round(originalSize * resolutionFactor * qualityFactor * 0.7); // 0.7 for format efficiency
        }
    }

    class AdvancedImageCompressor {
        /**
         * Advanced compression with multiple techniques
         */
        static async compressImageAdvanced(file, options = {}) {
            const { maxWidth = 800, maxHeight = 800, quality = 0.6, format = "webp", progressive = true, multiplePasses = true, adaptiveQuality = true, targetSize, blur = 0, sharpen = false, } = options;
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
                            ctx.filter = `blur(${blur}px)`;
                        }
                        // Step 3: Draw image
                        ctx.drawImage(img, 0, 0, width, height);
                        // Step 4: Apply sharpening if specified
                        if (sharpen) {
                            await this.applySharpening(ctx, width, height);
                        }
                        // Step 5: Progressive compression with multiple passes
                        let finalBase64;
                        if (multiplePasses && targetSize) {
                            finalBase64 = await this.progressiveCompression(canvas, format, targetSize, adaptiveQuality);
                        }
                        else {
                            finalBase64 = canvas.toDataURL(this.getMimeType(format), quality);
                        }
                        resolve(finalBase64);
                    }
                    catch (error) {
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
        static async progressiveCompression(canvas, format, targetSize, adaptiveQuality) {
            const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
            const mimeType = this.getMimeType(format);
            for (const quality of qualities) {
                const base64 = canvas.toDataURL(mimeType, quality);
                const size = this.getBase64Size(base64);
                if (size <= targetSize) {
                    console.log(`✅ Progressive compression: ${this.formatSize(size)} (target: ${this.formatSize(targetSize)})`);
                    return base64;
                }
            }
            // If still too large, try with lower resolution
            return this.downscaleAndCompress(canvas, format, targetSize);
        }
        /**
         * Downscale image and compress
         */
        static async downscaleAndCompress(canvas, format, targetSize) {
            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            const mimeType = this.getMimeType(format);
            // Try different scales
            const scales = [0.8, 0.6, 0.5, 0.4, 0.3, 0.2];
            for (const scale of scales) {
                const newCanvas = document.createElement("canvas");
                const newCtx = newCanvas.getContext("2d");
                newCanvas.width = originalWidth * scale;
                newCanvas.height = originalHeight * scale;
                newCtx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
                const base64 = newCanvas.toDataURL(mimeType, 0.5);
                const size = this.getBase64Size(base64);
                if (size <= targetSize) {
                    console.log(`✅ Downscaled compression: ${this.formatSize(size)} (scale: ${scale})`);
                    return base64;
                }
            }
            // Last resort: return smallest possible
            const finalCanvas = document.createElement("canvas");
            const finalCtx = finalCanvas.getContext("2d");
            finalCanvas.width = 200;
            finalCanvas.height = 200;
            finalCtx.drawImage(canvas, 0, 0, 200, 200);
            return finalCanvas.toDataURL(mimeType, 0.3);
        }
        /**
         * Apply sharpening filter
         */
        static async applySharpening(ctx, width, height) {
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
        static getMimeType(format) {
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
        static getBase64Size(base64) {
            // Remove data URL prefix
            const base64Data = base64.split(",")[1];
            if (!base64Data)
                return 0;
            // Calculate size: base64 is 4/3 of original size
            return Math.ceil((base64Data.length * 3) / 4);
        }
        /**
         * Format size to human readable
         */
        static formatSize(bytes) {
            if (bytes === 0)
                return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }
        /**
         * Get optimal compression settings for different scenarios
         */
        static getOptimalSettings(fileSize, scenario = "balanced") {
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
        static async compressToTargetSize(file, targetSizeBytes, format = "webp") {
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

    class Base64UploadManager {
        constructor(maxFileSize = 5 * 1024 * 1024, enableCompression = true, compressionMode = "basic", advancedOptions) {
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
        async uploadFile(file) {
            // Validate file size
            if (file.size > this.maxFileSize) {
                throw new Error(`File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`);
            }
            // Validate file type
            if (this.allowedTypes.indexOf(file.type) === -1) {
                throw new Error(`File type not allowed. Allowed types: ${this.allowedTypes.join(", ")}`);
            }
            try {
                let base64;
                let finalSize;
                if (this.enableCompression && this.isImage(file)) {
                    // Advanced compression based on mode
                    if (this.compressionMode === "advanced" ||
                        this.compressionMode === "minimal") {
                        const scenario = this.compressionMode === "minimal" ? "minimal" : "balanced";
                        const options = this.advancedOptions ||
                            AdvancedImageCompressor.getOptimalSettings(file.size, scenario);
                        base64 = await AdvancedImageCompressor.compressImageAdvanced(file, options);
                        // Estimate compressed size
                        const base64Size = this.getBase64Size(base64);
                        finalSize = base64Size;
                        console.log(`📸 Advanced image compression (${scenario}): ${this.formatFileSize(file.size)} → ${this.formatFileSize(finalSize)}`);
                    }
                    else {
                        // Basic compression
                        const compressionOptions = ImageCompressor.getOptimalSettings(file.size);
                        base64 = await ImageCompressor.compressImage(file, compressionOptions);
                        // Estimate compressed size
                        finalSize = ImageCompressor.estimateCompressedSize(file.size, compressionOptions);
                        console.log(`📸 Basic image compression: ${this.formatFileSize(file.size)} → ~${this.formatFileSize(finalSize)}`);
                    }
                }
                else {
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
            }
            catch (error) {
                console.error("Base64 conversion failed:", error);
                throw new Error(`Failed to process file: ${file.name}`);
            }
        }
        /**
         * Convert file to base64 string
         */
        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        /**
         * Upload multiple files
         */
        async uploadFiles(files) {
            const uploadPromises = files.map((file) => this.uploadFile(file));
            return Promise.all(uploadPromises);
        }
        /**
         * Check if file is an image
         */
        isImage(file) {
            return file.type.startsWith("image/");
        }
        /**
         * Get file size in human readable format
         */
        formatFileSize(bytes) {
            if (bytes === 0)
                return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }
        /**
         * Calculate base64 size in bytes
         */
        getBase64Size(base64) {
            // Remove data URL prefix
            const base64Data = base64.split(",")[1];
            if (!base64Data)
                return 0;
            // Calculate size: base64 is 4/3 of original size
            return Math.ceil((base64Data.length * 3) / 4);
        }
        /**
         * Generate unique ID
         */
        generateId() {
            return Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
    }
    // Create different compression instances
    const base64UploadManager = new Base64UploadManager(); // Basic compression
    const advancedUploadManager = new Base64UploadManager(5 * 1024 * 1024, true, "advanced"); // Advanced compression
    const minimalUploadManager = new Base64UploadManager(5 * 1024 * 1024, true, "minimal"); // Minimal size compression
    // Create custom instances with specific options
    const createCustomUploadManager = (options) => {
        return new Base64UploadManager(5 * 1024 * 1024, true, "advanced", options);
    };

    class ImageModal {
        constructor(imageUrl) {
            this.isVisible = false;
            this.keydownHandler = null;
            this.imageElement = null;
            this.currentScale = 1;
            this.minScale = 0.5;
            this.maxScale = 3;
            this.imageUrl = imageUrl;
            this.element = this.createElement();
            this.setupEventListeners();
        }
        createElement() {
            const modal = document.createElement("div");
            modal.className = "uicm-image-modal";
            modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      pointer-events: auto;
    `;
            const imageContainer = document.createElement("div");
            imageContainer.className = "uicm-image-container";
            imageContainer.style.cssText = `
      position: relative;
      max-width: 80vw;
      max-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    `;
            const image = document.createElement("img");
            image.src = this.imageUrl;
            image.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transition: transform 0.3s ease;
      cursor: zoom-in;
    `;
            // Store reference to image element
            this.imageElement = image;
            const closeButton = document.createElement("button");
            closeButton.className = "uicm-image-close";
            closeButton.innerHTML = "×";
            closeButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
            closeButton.addEventListener("mouseenter", () => {
                closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            });
            closeButton.addEventListener("mouseleave", () => {
                closeButton.style.backgroundColor = "transparent";
            });
            const downloadButton = document.createElement("button");
            downloadButton.className = "uicm-image-download";
            downloadButton.innerHTML = "⬇";
            downloadButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 50px;
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
            downloadButton.addEventListener("mouseenter", () => {
                downloadButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            });
            downloadButton.addEventListener("mouseleave", () => {
                downloadButton.style.backgroundColor = "transparent";
            });
            downloadButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                this.downloadImage();
            });
            // Zoom controls
            const zoomInButton = document.createElement("button");
            zoomInButton.className = "uicm-image-zoom-in";
            zoomInButton.innerHTML = "🔍+";
            zoomInButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 100px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
            zoomInButton.addEventListener("mouseenter", () => {
                zoomInButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            });
            zoomInButton.addEventListener("mouseleave", () => {
                zoomInButton.style.backgroundColor = "transparent";
            });
            zoomInButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                this.zoomIn();
            });
            const zoomOutButton = document.createElement("button");
            zoomOutButton.className = "uicm-image-zoom-out";
            zoomOutButton.innerHTML = "🔍-";
            zoomOutButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 140px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
            zoomOutButton.addEventListener("mouseenter", () => {
                zoomOutButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            });
            zoomOutButton.addEventListener("mouseleave", () => {
                zoomOutButton.style.backgroundColor = "transparent";
            });
            zoomOutButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                this.zoomOut();
            });
            const resetButton = document.createElement("button");
            resetButton.className = "uicm-image-reset";
            resetButton.innerHTML = "🔄";
            resetButton.style.cssText = `
      position: absolute;
      top: -40px;
      right: 180px;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    `;
            resetButton.addEventListener("mouseenter", () => {
                resetButton.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            });
            resetButton.addEventListener("mouseleave", () => {
                resetButton.style.backgroundColor = "transparent";
            });
            resetButton.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                this.resetZoom();
            });
            imageContainer.appendChild(image);
            imageContainer.appendChild(closeButton);
            imageContainer.appendChild(downloadButton);
            imageContainer.appendChild(zoomInButton);
            imageContainer.appendChild(zoomOutButton);
            imageContainer.appendChild(resetButton);
            modal.appendChild(imageContainer);
            return modal;
        }
        setupEventListeners() {
            // Close on background click (outside image)
            this.element.addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                if (e.target === this.element) {
                    this.hide();
                }
            });
            // Close button click
            const closeButton = this.element.querySelector(".uicm-image-close");
            if (closeButton) {
                closeButton.addEventListener("click", (e) => {
                    e.stopPropagation(); // Prevent event from bubbling up
                    this.hide();
                });
            }
            // Image click to zoom in/out
            if (this.imageElement) {
                this.imageElement.addEventListener("click", (e) => {
                    e.stopPropagation(); // Prevent modal from closing
                    this.toggleZoom();
                });
                // Mouse wheel zoom
                this.imageElement.addEventListener("wheel", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.deltaY < 0) {
                        this.zoomIn();
                    }
                    else {
                        this.zoomOut();
                    }
                });
            }
        }
        downloadImage() {
            const link = document.createElement("a");
            link.href = this.imageUrl;
            link.download = `image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        zoomIn() {
            if (this.imageElement && this.currentScale < this.maxScale) {
                this.currentScale = Math.min(this.maxScale, this.currentScale + 0.25);
                this.updateImageTransform();
                this.updateCursor();
            }
        }
        zoomOut() {
            if (this.imageElement && this.currentScale > this.minScale) {
                this.currentScale = Math.max(this.minScale, this.currentScale - 0.25);
                this.updateImageTransform();
                this.updateCursor();
            }
        }
        resetZoom() {
            if (this.imageElement) {
                this.currentScale = 1;
                this.updateImageTransform();
                this.updateCursor();
            }
        }
        toggleZoom() {
            if (this.currentScale === 1) {
                this.zoomIn();
            }
            else {
                this.resetZoom();
            }
        }
        updateImageTransform() {
            if (this.imageElement) {
                this.imageElement.style.transform = `scale(${this.currentScale})`;
            }
        }
        updateCursor() {
            if (this.imageElement) {
                if (this.currentScale === 1) {
                    this.imageElement.style.cursor = "zoom-in";
                }
                else {
                    this.imageElement.style.cursor = "zoom-out";
                }
            }
        }
        show() {
            if (!this.isVisible) {
                document.body.appendChild(this.element);
                this.isVisible = true;
                // Add escape key handler only when modal is visible
                this.keydownHandler = (e) => {
                    if (e.key === "Escape" && this.isVisible) {
                        this.hide();
                    }
                };
                document.addEventListener("keydown", this.keydownHandler);
                // Prevent body scroll when modal is open
                document.body.style.overflow = "hidden";
                // Trigger animation
                requestAnimationFrame(() => {
                    this.element.style.opacity = "1";
                    this.element.style.visibility = "visible";
                    this.element.style.pointerEvents = "auto"; // Re-enable pointer events
                });
            }
        }
        hide() {
            if (this.isVisible) {
                // Immediately prevent any further interactions
                this.isVisible = false;
                this.element.style.opacity = "0";
                this.element.style.visibility = "hidden";
                this.element.style.pointerEvents = "none"; // Prevent any clicks during fade out
                // Remove escape key handler
                if (this.keydownHandler) {
                    document.removeEventListener("keydown", this.keydownHandler);
                    this.keydownHandler = null;
                }
                // Restore body scroll
                document.body.style.overflow = "";
                setTimeout(() => {
                    if (this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                    }
                }, 300);
            }
        }
        destroy() {
            this.hide();
            // Ensure keydown handler is removed
            if (this.keydownHandler) {
                document.removeEventListener("keydown", this.keydownHandler);
                this.keydownHandler = null;
            }
        }
    }

    /**
     * Calculate center position for modals and forms
     */
    function getCenterPosition(element, options = {}) {
        const { padding = 20 } = options;
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        // Get element dimensions
        const rect = element.getBoundingClientRect();
        const elementWidth = rect.width || 400; // fallback width
        const elementHeight = rect.height || 300; // fallback height;
        // Calculate center position
        const x = Math.max(padding, (viewportWidth - elementWidth) / 2);
        const y = Math.max(padding, (viewportHeight - elementHeight) / 2);
        return { x, y };
    }
    /**
     * Calculate relative position within an element from absolute coordinates
     */
    function getRelativePositionFromAbsolute(element, absolutePosition) {
        const rect = element.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(1, (absolutePosition.x - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (absolutePosition.y - rect.top) / rect.height)),
        };
    }
    /**
     * Get comment position from click event and target element
     */
    function getCommentPositionFromClick(element, clickEvent) {
        const absolutePosition = { x: clickEvent.clientX, y: clickEvent.clientY };
        const relativePosition = getRelativePositionFromAbsolute(element, absolutePosition);
        return {
            position: absolutePosition,
            relativePosition,
        };
    }
    /**
     * Create a unique ID for elements (used for comment IDs)
     */
    function generateId() {
        return `uicm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Create SDK root container if it doesn't exist
     */
    function ensureSDKRoot() {
        let root = document.getElementById("uicm-root");
        if (!root) {
            root = document.createElement("div");
            root.id = "uicm-root";
            root.setAttribute("data-uicm-element", "true");
            // Position the layer
            root.style.position = "fixed";
            root.style.top = "0";
            root.style.left = "0";
            root.style.width = "100vw";
            root.style.height = "100vh";
            root.style.pointerEvents = "none"; // Allow events to pass through by default
            root.style.zIndex = "999999";
            // Create separate layers for different components
            const highlightLayer = document.createElement("div");
            highlightLayer.id = "uicm-highlight-layer";
            highlightLayer.style.position = "absolute";
            highlightLayer.style.top = "0";
            highlightLayer.style.left = "0";
            highlightLayer.style.width = "100%";
            highlightLayer.style.height = "100%";
            highlightLayer.style.pointerEvents = "none";
            highlightLayer.style.display = "none"; // Hidden by default
            root.appendChild(highlightLayer);
            // Combined interaction layer for both bubbles and forms
            const interactionLayer = document.createElement("div");
            interactionLayer.id = "uicm-interaction-layer";
            interactionLayer.style.position = "absolute";
            interactionLayer.style.top = "0";
            interactionLayer.style.left = "0";
            interactionLayer.style.width = "100%";
            interactionLayer.style.height = "100%";
            interactionLayer.style.pointerEvents = "auto"; // Bubbles and forms need to be clickable
            interactionLayer.style.display = "none"; // Hidden by default
            root.appendChild(interactionLayer);
            document.body.appendChild(root);
        }
        return root;
    }
    /**
     * Debounce function for performance optimization
     */
    function debounce(func, wait) {
        let timeout = null;
        return (...args) => {
            if (timeout !== null) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    /**
     * Get XPath of an element
     */
    function getXPath(element) {
        if (!element)
            return "";
        if (element.id)
            return `//*[@id="${element.id}"]`;
        const paths = [];
        let current = element;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 1;
            let hasSibling = false;
            // Count previous siblings with same tag name
            let sibling = current.previousSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE &&
                    sibling.tagName === current.tagName) {
                    index++;
                    hasSibling = true;
                }
                sibling = sibling.previousSibling;
            }
            // Build path
            const tagName = current.tagName.toLowerCase();
            const pathIndex = hasSibling ? `[${index}]` : "";
            paths.unshift(`${tagName}${pathIndex}`);
            // Move up to parent
            current = current.parentElement;
        }
        return `/${paths.join("/")}`;
    }

    const ROLE_COLORS = {
        developer: {
            bg: "#dbeafe",
            text: "#1e40af",
            border: "#3b82f6",
        },
        designer: {
            bg: "#fef3c7",
            text: "#92400e",
            border: "#f59e0b",
        },
        "product-manager": {
            bg: "#dcfce7",
            text: "#166534",
            border: "#22c55e",
        },
        qa: {
            bg: "#fce7f3",
            text: "#be185d",
            border: "#ec4899",
        },
        stakeholder: {
            bg: "#e0e7ff",
            text: "#3730a3",
            border: "#6366f1",
        },
        other: {
            bg: "#f3f4f6",
            text: "#374151",
            border: "#6b7280",
        },
    };
    function getRoleColor(role) {
        return ROLE_COLORS[role] || ROLE_COLORS.other;
    }
    function getRoleDisplayName(role) {
        const displayNames = {
            developer: "Developer",
            designer: "Designer",
            "product-manager": "Product Manager",
            qa: "QA",
            stakeholder: "Stakeholder",
            other: "Other",
        };
        return displayNames[role] || "Other";
    }

    class CommentModal {
        constructor(props) {
            this.imageModal = null;
            this.handleOutsideClick = (e) => {
                if (!this.element.contains(e.target)) {
                    this.props.onClose();
                }
            };
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        detectAndFormatUrls(text) {
            // URL regex pattern
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return text.replace(urlRegex, (url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="uicm-url-link">${url}</a>`;
            });
        }
        formatFileSize(bytes) {
            if (bytes === 0)
                return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }
        addFilePreview(attachment, container, onRemove) {
            // No limit on number of images
            const previewItem = document.createElement("div");
            previewItem.className = "uicm-file-preview-item";
            previewItem.style.position = "relative";
            if (attachment.type === "image") {
                const imagePreview = document.createElement("img");
                imagePreview.className = "uicm-file-preview-image";
                imagePreview.src = attachment.url;
                imagePreview.alt = attachment.filename;
                imagePreview.style.cursor = "pointer";
                // Add click handler to open image modal
                imagePreview.addEventListener("click", () => {
                    if (this.imageModal) {
                        this.imageModal.destroy();
                    }
                    this.imageModal = new ImageModal(attachment.url);
                    this.imageModal.show();
                });
                previewItem.appendChild(imagePreview);
            }
            else {
                const fileIcon = document.createElement("span");
                fileIcon.className = "uicm-file-preview-icon";
                fileIcon.innerHTML = "📎";
                previewItem.appendChild(fileIcon);
            }
            // Only show file size (not name or url)
            const fileSize = document.createElement("span");
            fileSize.className = "uicm-file-preview-size";
            fileSize.textContent = this.formatFileSize(attachment.size);
            previewItem.appendChild(fileSize);
            // Remove button absolutely positioned top right
            const removeButton = document.createElement("button");
            removeButton.className = "uicm-file-preview-remove";
            removeButton.innerHTML = "×";
            removeButton.type = "button";
            removeButton.style.position = "absolute";
            removeButton.style.top = "2px";
            removeButton.style.right = "2px";
            removeButton.style.zIndex = "2";
            removeButton.onclick = () => {
                previewItem.remove();
                onRemove();
            };
            previewItem.appendChild(removeButton);
            container.appendChild(previewItem);
        }
        createElement() {
            const modal = document.createElement("div");
            modal.className = "uicm-comment-modal";
            modal.style.position = "absolute";
            modal.style.zIndex = "10000";
            // Temporarily add to DOM to get accurate dimensions
            document.body.appendChild(modal);
            // Use center position instead of click position
            const centerPosition = getCenterPosition(modal, { padding: 20 });
            // Set center position
            modal.style.left = `${centerPosition.x}px`;
            modal.style.top = `${centerPosition.y}px`;
            // Remove from DOM temporarily
            document.body.removeChild(modal);
            // Gradient header bar
            const headerBar = document.createElement("div");
            headerBar.className = "uicm-modal-header-bar";
            // Main header container
            const header = document.createElement("div");
            header.className = "uicm-modal-header";
            // Header content wrapper
            const headerContent = document.createElement("div");
            headerContent.className = "uicm-modal-header-content";
            // Top section: Title, description, and close button
            const topSection = document.createElement("div");
            topSection.className = "uicm-modal-top-section";
            // Left side: Title and description
            const titleSection = document.createElement("div");
            titleSection.className = "uicm-modal-title-section";
            const title = document.createElement("h3");
            title.className = "uicm-modal-title";
            title.textContent = "Comment";
            const description = document.createElement("p");
            description.className = "uicm-modal-description";
            description.textContent = "View and manage feedback";
            titleSection.appendChild(title);
            titleSection.appendChild(description);
            // Right side: Close button
            const closeButton = document.createElement("button");
            closeButton.className = "uicm-close-button";
            closeButton.innerHTML = "×";
            closeButton.title = "Close";
            closeButton.onclick = () => this.props.onClose();
            topSection.appendChild(titleSection);
            topSection.appendChild(closeButton);
            // Bottom section: Status select and delete button
            const bottomSection = document.createElement("div");
            bottomSection.className = "uicm-modal-bottom-section";
            const mainComment = this.props.comments[0];
            // Status select with color coding
            const statusSelect = document.createElement("select");
            statusSelect.className = "uicm-status-select";
            statusSelect.value = mainComment.status;
            statusSelect.setAttribute("data-status", mainComment.status);
            // Add status options with color coding
            const statuses = [
                exports.CommentStatus.BUG,
                exports.CommentStatus.FEATURE_REQUEST,
                exports.CommentStatus.DEV_COMPLETED,
                exports.CommentStatus.DONE,
                exports.CommentStatus.ARCHIVED,
            ];
            statuses.forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status.toUpperCase();
                option.selected = status === mainComment.status;
                statusSelect.appendChild(option);
            });
            // Status change handler
            statusSelect.addEventListener("change", async (e) => {
                const newStatus = e.target.value;
                if (newStatus !== mainComment.status) {
                    await this.props.onStatusChange(mainComment.id, newStatus);
                    // Update the data-status attribute for color coding
                    statusSelect.setAttribute("data-status", newStatus);
                }
            });
            // Delete button (only show if onDeleteComment callback is provided)
            if (this.props.onDeleteComment) {
                const deleteButton = document.createElement("button");
                deleteButton.className = "uicm-delete-button";
                deleteButton.innerHTML = "🗑️";
                deleteButton.title = "Delete comment";
                // Delete functionality
                deleteButton.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this comment and all its replies? This action cannot be undone.")) {
                        try {
                            deleteButton.disabled = true;
                            deleteButton.innerHTML = "⏳";
                            deleteButton.title = "Deleting...";
                            deleteButton.style.opacity = "0.7";
                            // Delete the main comment (which will delete all replies too)
                            await this.props.onDeleteComment(mainComment.id);
                            // Close the modal after successful deletion
                            this.props.onClose();
                        }
                        catch (error) {
                            console.error("Failed to delete comment:", error);
                            deleteButton.disabled = false;
                            deleteButton.innerHTML = "🗑️";
                            deleteButton.title = "Delete comment";
                            deleteButton.style.opacity = "1";
                            alert("Failed to delete comment. Please try again.");
                        }
                    }
                });
                bottomSection.appendChild(statusSelect);
                bottomSection.appendChild(deleteButton);
            }
            else {
                // If no delete function, just add the status select
                bottomSection.appendChild(statusSelect);
            }
            // Assemble header
            headerContent.appendChild(topSection);
            headerContent.appendChild(bottomSection);
            header.appendChild(headerContent);
            // Comments list
            const commentsList = document.createElement("div");
            commentsList.className = "uicm-comments-list";
            this.props.comments.forEach((comment) => {
                const commentItem = this.createCommentItem(comment);
                commentsList.appendChild(commentItem);
            });
            // Reply form
            const replyForm = this.createReplyForm();
            modal.appendChild(headerBar);
            modal.appendChild(header);
            modal.appendChild(commentsList);
            modal.appendChild(replyForm);
            return modal;
        }
        createCommentItem(comment) {
            const item = document.createElement("div");
            item.className = "uicm-comment-item";
            // Avatar with gradient background
            const avatar = document.createElement("div");
            avatar.className = "uicm-comment-avatar";
            if (comment.createdBy.avatar) {
                avatar.innerHTML = `<img src="${comment.createdBy.avatar}" alt="${comment.createdBy.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            else {
                avatar.textContent = comment.createdBy.name.charAt(0).toUpperCase();
            }
            // Content
            const content = document.createElement("div");
            content.className = "uicm-comment-content";
            const commentHeader = document.createElement("div");
            commentHeader.className = "uicm-comment-header";
            const authorName = document.createElement("span");
            authorName.className = "uicm-author-name";
            authorName.textContent = comment.createdBy.name;
            // Add role badge
            const roleBadge = document.createElement("span");
            roleBadge.className = "uicm-role-badge";
            roleBadge.textContent = getRoleDisplayName(comment.role);
            // Apply role colors
            const roleColors = getRoleColor(comment.role);
            roleBadge.style.backgroundColor = roleColors.bg;
            roleBadge.style.color = roleColors.text;
            roleBadge.style.borderColor = roleColors.border;
            const timeAgo = document.createElement("span");
            timeAgo.className = "uicm-comment-time";
            timeAgo.textContent = this.formatTimeAgo(comment.createdAt);
            commentHeader.appendChild(authorName);
            commentHeader.appendChild(roleBadge);
            commentHeader.appendChild(timeAgo);
            const commentText = document.createElement("p");
            commentText.className = "uicm-comment-text";
            commentText.innerHTML = this.detectAndFormatUrls(comment.content);
            content.appendChild(commentHeader);
            content.appendChild(commentText);
            // Add attachments if any
            if (comment.attachments && comment.attachments.length > 0) {
                const attachmentsContainer = document.createElement("div");
                attachmentsContainer.className = "uicm-comment-attachments";
                // Add class for multiple images layout
                const imageAttachments = comment.attachments.filter((a) => a.type === "image");
                if (imageAttachments.length > 1) {
                    attachmentsContainer.classList.add("has-multiple-images");
                }
                comment.attachments.forEach((attachment, index) => {
                    const attachmentItem = document.createElement("div");
                    attachmentItem.className = "uicm-attachment-item";
                    if (attachment.type === "image") {
                        const imagePreview = document.createElement("img");
                        imagePreview.className = "uicm-attachment-image";
                        imagePreview.src = attachment.url;
                        imagePreview.alt = attachment.filename;
                        imagePreview.style.cursor = "pointer";
                        // Add click handler to open image modal
                        imagePreview.addEventListener("click", () => {
                            if (this.imageModal) {
                                this.imageModal.destroy();
                            }
                            this.imageModal = new ImageModal(attachment.url);
                            this.imageModal.show();
                        });
                        attachmentItem.appendChild(imagePreview);
                    }
                    else {
                        const fileIcon = document.createElement("span");
                        fileIcon.className = "uicm-attachment-icon";
                        fileIcon.innerHTML = "📎";
                        const fileInfo = document.createElement("div");
                        fileInfo.className = "uicm-attachment-info";
                        const fileName = document.createElement("span");
                        fileName.className = "uicm-attachment-name";
                        fileName.textContent = attachment.filename;
                        const fileSize = document.createElement("span");
                        fileSize.className = "uicm-attachment-size";
                        fileSize.textContent = this.formatFileSize(attachment.size);
                        fileInfo.appendChild(fileName);
                        fileInfo.appendChild(fileSize);
                        attachmentItem.appendChild(fileIcon);
                        attachmentItem.appendChild(fileInfo);
                        attachmentItem.style.cursor = "pointer";
                        attachmentItem.addEventListener("click", () => {
                            window.open(attachment.url, "_blank");
                        });
                    }
                    attachmentsContainer.appendChild(attachmentItem);
                });
                content.appendChild(attachmentsContainer);
            }
            item.appendChild(avatar);
            item.appendChild(content);
            return item;
        }
        createReplyForm() {
            const form = document.createElement("div");
            form.className = "uicm-reply-form";
            const replyHeader = document.createElement("div");
            replyHeader.className = "uicm-reply-header";
            // Avatar for current user
            const avatar = document.createElement("div");
            // Editable user name
            const nameInput = document.createElement("input");
            nameInput.className = "uicm-reply-user-name-input";
            nameInput.type = "text";
            nameInput.value = this.props.currentUser.name;
            nameInput.placeholder = "Your name";
            // Update avatar when name changes
            nameInput.addEventListener("input", () => {
                if (nameInput.value.trim()) {
                    avatar.textContent = nameInput.value.trim().charAt(0).toUpperCase();
                }
                else {
                    avatar.textContent = this.props.currentUser.name
                        .charAt(0)
                        .toUpperCase();
                }
            });
            replyHeader.appendChild(avatar);
            replyHeader.appendChild(nameInput);
            // Input container
            const inputContainer = document.createElement("div");
            inputContainer.className = "uicm-reply-input-container";
            const input = document.createElement("textarea");
            input.className = "uicm-reply-input";
            input.placeholder = "Write a reply...";
            input.rows = 2;
            // File upload section
            const fileUploadSection = document.createElement("div");
            fileUploadSection.className = "uicm-file-upload-section";
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.className = "uicm-file-input";
            fileInput.style.display = "none";
            fileInput.accept = "image/*,application/pdf,.doc,.docx,.txt,.zip,.rar";
            fileInput.multiple = true;
            const fileUploadButton = document.createElement("button");
            fileUploadButton.className = "uicm-file-upload-button";
            fileUploadButton.type = "button";
            fileUploadButton.innerHTML = "📎";
            fileUploadButton.onclick = () => fileInput.click();
            const filePreviewContainer = document.createElement("div");
            filePreviewContainer.className = "uicm-file-preview-container";
            let selectedAttachments = [];
            // Handle file selection
            fileInput.addEventListener("change", async (e) => {
                const files = e.target.files;
                if (files) {
                    for (const file of Array.from(files)) {
                        try {
                            // Upload file using Base64UploadManager
                            const attachment = await base64UploadManager.uploadFile(file);
                            selectedAttachments.push(attachment);
                            this.addFilePreview(attachment, filePreviewContainer, () => {
                                selectedAttachments = selectedAttachments.filter((a) => a.id !== attachment.id);
                                updateSendButtonState();
                            });
                        }
                        catch (error) {
                            console.error("Failed to upload file:", error);
                            const errorMessage = error instanceof Error ? error.message : "Unknown error";
                            alert(`Failed to upload ${file.name}: ${errorMessage}`);
                        }
                    }
                    updateSendButtonState();
                }
            });
            const updateSendButtonState = () => {
                const hasContent = input.value.trim().length > 0;
                const hasName = nameInput.value.trim().length > 0;
                const hasAttachments = selectedAttachments.length > 0;
                sendButton.disabled =
                    (!hasContent && !hasAttachments) ||
                        !hasName ||
                        input.value.length > 500;
            };
            fileUploadSection.appendChild(fileInput);
            fileUploadSection.appendChild(fileUploadButton);
            fileUploadSection.appendChild(filePreviewContainer);
            // Character counter
            const charCounter = document.createElement("div");
            charCounter.className = "uicm-reply-char-counter";
            // Action buttons
            const actions = document.createElement("div");
            actions.className = "uicm-reply-actions";
            const sendButton = document.createElement("button");
            sendButton.className = "uicm-reply-send";
            sendButton.textContent = "Reply";
            sendButton.disabled = true;
            actions.appendChild(sendButton);
            // Restructure: file upload button next to textarea, file previews at top, actions at bottom
            form.appendChild(replyHeader);
            form.appendChild(filePreviewContainer); // File previews at top
            // Input container with textarea and file upload button side by side
            inputContainer.appendChild(input);
            inputContainer.appendChild(fileUploadButton);
            inputContainer.appendChild(charCounter);
            form.appendChild(inputContainer);
            form.appendChild(actions); // Reply button at bottom
            // Input event handlers
            input.addEventListener("input", () => {
                const length = input.value.length;
                const maxLength = 500;
                charCounter.textContent = `${length} / ${maxLength}`;
                // Update send button state
                updateSendButtonState();
                if (length > maxLength * 0.8) {
                    charCounter.classList.add("uicm-warning");
                }
                else {
                    charCounter.classList.remove("uicm-warning");
                }
                if (length > maxLength) {
                    charCounter.classList.add("uicm-error");
                }
                else {
                    charCounter.classList.remove("uicm-error");
                }
                // Auto-resize textarea
                input.style.height = "auto";
                input.style.height = Math.min(input.scrollHeight, 120) + "px";
            });
            // Handle paste events for images
            input.addEventListener("paste", async (e) => {
                const items = e.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.type.indexOf("image") !== -1) {
                            e.preventDefault();
                            const file = item.getAsFile();
                            if (file) {
                                // Show loading state
                                const originalPlaceholder = input.placeholder;
                                input.placeholder = "🔄 Processing image...";
                                input.disabled = true;
                                // Show loading indicator
                                const loadingIndicator = document.createElement("div");
                                loadingIndicator.className = "uicm-paste-loading";
                                loadingIndicator.innerHTML = `
                <div class="uicm-loading-spinner"></div>
                <span>Processing image: ${file.name}</span>
              `;
                                loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                color: #1e293b;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                z-index: 1000;
              `;
                                const spinner = loadingIndicator.querySelector(".uicm-loading-spinner");
                                spinner.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: uicm-spin 1s linear infinite;
              `;
                                this.element.appendChild(loadingIndicator);
                                try {
                                    const attachment = await base64UploadManager.uploadFile(file);
                                    selectedAttachments.push(attachment);
                                    this.addFilePreview(attachment, filePreviewContainer, () => {
                                        selectedAttachments = selectedAttachments.filter((a) => a.id !== attachment.id);
                                        updateSendButtonState();
                                    });
                                    updateSendButtonState();
                                    console.log("📸 Image pasted and uploaded in reply:", attachment.filename);
                                    // Show success message briefly
                                    loadingIndicator.innerHTML = `
                  <span style="color: #10b981;">✅</span>
                  <span>Image uploaded successfully!</span>
                `;
                                    setTimeout(() => {
                                        if (loadingIndicator.parentNode) {
                                            loadingIndicator.parentNode.removeChild(loadingIndicator);
                                        }
                                    }, 1000);
                                }
                                catch (error) {
                                    console.error("Failed to paste image in reply:", error);
                                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                                    // Show error message
                                    loadingIndicator.innerHTML = `
                  <span style="color: #ef4444;">❌</span>
                  <span>Failed to upload: ${errorMessage}</span>
                `;
                                    setTimeout(() => {
                                        if (loadingIndicator.parentNode) {
                                            loadingIndicator.parentNode.removeChild(loadingIndicator);
                                        }
                                    }, 3000);
                                }
                                finally {
                                    // Restore input state
                                    input.placeholder = originalPlaceholder;
                                    input.disabled = false;
                                    input.focus();
                                }
                            }
                        }
                    }
                }
            });
            // Name input validation
            nameInput.addEventListener("input", () => {
                updateSendButtonState();
            });
            // Send reply
            const sendReply = async () => {
                const content = input.value.trim();
                const userName = nameInput.value.trim();
                const hasContent = content.length > 0;
                const hasAttachments = selectedAttachments.length > 0;
                if ((!hasContent && !hasAttachments) ||
                    !userName ||
                    this.props.comments.length === 0)
                    return;
                try {
                    sendButton.disabled = true;
                    sendButton.textContent = "Sending...";
                    // Use custom name if provided, otherwise use current user
                    const userForReply = userName !== this.props.currentUser.name
                        ? { ...this.props.currentUser, name: userName }
                        : this.props.currentUser;
                    console.log("📤 Sending reply with attachments:", selectedAttachments.length);
                    await this.props.onAddReply(this.props.comments[0].id, content, userForReply, selectedAttachments.length > 0 ? selectedAttachments : undefined);
                    // Clear form after successful send
                    input.value = "";
                    charCounter.textContent = "0 / 500";
                    charCounter.classList.remove("uicm-warning", "uicm-error");
                    input.style.height = "auto";
                    // Clear attachments
                    selectedAttachments = [];
                    filePreviewContainer.innerHTML = "";
                    fileInput.value = "";
                    // Force refresh the modal to show the new reply with attachments
                    console.log("🔄 Force refreshing modal after reply");
                    setTimeout(() => {
                        // This will trigger a refresh of the modal content
                        const event = new CustomEvent("uicm-reply-added", {
                            detail: { commentId: this.props.comments[0].id },
                        });
                        document.dispatchEvent(event);
                    }, 100);
                    console.log("✅ Reply sent successfully");
                }
                catch (error) {
                    console.error("Failed to send reply:", error);
                }
                finally {
                    sendButton.disabled = false;
                    sendButton.textContent = "Reply";
                }
            };
            sendButton.onclick = sendReply;
            input.addEventListener("keydown", (e) => {
                if ((e.ctrlKey || e.metaKey) &&
                    e.key === "Enter" &&
                    !sendButton.disabled) {
                    e.preventDefault();
                    sendReply();
                }
            });
            form.appendChild(replyHeader);
            form.appendChild(inputContainer);
            return form;
        }
        updateComments(comments) {
            const previousCount = this.props.comments.length;
            this.props.comments = comments;
            this.refreshCommentsList();
            // Update comment count in header
            const commentCount = this.element.querySelector(".uicm-comment-count");
            if (commentCount) {
                commentCount.textContent = `${comments.length} comment${comments.length !== 1 ? "s" : ""}`;
            }
            // Scroll to bottom to show newest reply
            const commentsList = this.element.querySelector(".uicm-comments-list");
            if (commentsList) {
                commentsList.scrollTop = commentsList.scrollHeight;
                // Highlight newest reply if a new one was added
                if (comments.length > previousCount) {
                    const commentItems = commentsList.querySelectorAll(".uicm-comment-item");
                    const newestItem = commentItems[commentItems.length - 1];
                    if (newestItem) {
                        newestItem.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
                        newestItem.style.transition = "background-color 0.3s ease";
                        // Remove highlight after animation
                        setTimeout(() => {
                            newestItem.style.backgroundColor = "";
                        }, 1000);
                    }
                }
            }
        }
        updateUser(user) {
            this.props.currentUser = user;
            // Refresh the modal to show updated user info
            this.refreshCommentsList();
        }
        refreshCommentsList() {
            const commentsList = this.element.querySelector(".uicm-comments-list");
            if (commentsList) {
                commentsList.innerHTML = "";
                this.props.comments.forEach((comment) => {
                    const commentItem = this.createCommentItem(comment);
                    commentsList.appendChild(commentItem);
                });
            }
        }
        formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (diffInSeconds < 60)
                return "just now";
            if (diffInSeconds < 3600)
                return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400)
                return `${Math.floor(diffInSeconds / 3600)}h ago`;
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        }
        attachEventListeners() {
            // Prevent modal from closing when clicking inside modal
            this.element.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            // Prevent modal from closing when interacting with form elements
            this.element.addEventListener("mousedown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("mouseup", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keydown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keyup", (e) => {
                e.stopPropagation();
            });
            // Close modal when clicking outside
            setTimeout(() => {
                document.addEventListener("click", this.handleOutsideClick);
            }, 0);
        }
        getElement() {
            return this.element;
        }
        reposition() {
            // Use center position instead of click position
            const centerPosition = getCenterPosition(this.element, { padding: 20 });
            // Apply center position
            this.element.style.position = "fixed";
            this.element.style.left = `${centerPosition.x}px`;
            this.element.style.top = `${centerPosition.y}px`;
            this.element.style.transform = "none";
        }
        destroy() {
            if (this.imageModal) {
                this.imageModal.destroy();
                this.imageModal = null;
            }
            document.removeEventListener("click", this.handleOutsideClick);
            this.element.remove();
        }
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$a = "/* Comment Sidebar - Optimized */\n.uicm-comment-sidebar {\n  position: fixed;\n  top: 0;\n  right: 0;\n  width: 320px;\n  height: 100vh;\n  background: white;\n  border-left: 1px solid #e5e7eb;\n  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);\n  z-index: 9999999999;\n  transform: translateX(100%);\n  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  display: flex;\n  flex-direction: column;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  visibility: visible;\n  opacity: 1;\n  pointer-events: auto;\n}\n\n.uicm-comment-sidebar.show {\n  transform: translateX(0);\n}\n\n/* Header */\n.uicm-sidebar-header {\n  padding: 16px 20px;\n  border-bottom: 1px solid #e5e7eb;\n  background: linear-gradient(135deg, #f8fafc, #f1f5f9);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.uicm-sidebar-title {\n  margin: 0;\n  font-size: 16px;\n  font-weight: 600;\n  color: #1e293b;\n}\n\n.uicm-sidebar-close {\n  background: none;\n  border: none;\n  font-size: 18px;\n  cursor: pointer;\n  color: #64748b;\n  padding: 4px;\n  border-radius: 4px;\n  transition: all 0.2s ease;\n}\n\n.uicm-sidebar-close:hover {\n  background-color: #f1f5f9;\n  color: #374151;\n}\n\n/* Tabs */\n.uicm-sidebar-tabs {\n  display: flex;\n  background: linear-gradient(135deg, #f8fafc, #f1f5f9);\n  border-bottom: 1px solid #e5e7eb;\n  padding: 0;\n  position: relative;\n}\n\n.uicm-sidebar-tabs::after {\n  content: \"\";\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);\n}\n\n.uicm-sidebar-tab {\n  flex: 1;\n  padding: 16px 20px;\n  background: none;\n  border: none;\n  font-size: 13px;\n  font-weight: 600;\n  color: #64748b;\n  cursor: pointer;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  border-bottom: 3px solid transparent;\n  position: relative;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n}\n\n.uicm-sidebar-tab::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.05),\n    rgba(59, 130, 246, 0.02)\n  );\n  opacity: 0;\n  transition: opacity 0.3s ease;\n}\n\n.uicm-sidebar-tab:hover {\n  color: #374151;\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.08),\n    rgba(59, 130, 246, 0.04)\n  );\n}\n\n.uicm-sidebar-tab:hover::before {\n  opacity: 1;\n}\n\n.uicm-sidebar-tab.active {\n  color: #1e40af;\n  border-bottom-color: #3b82f6;\n  background: linear-gradient(135deg, #ffffff, #f8fafc);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n  position: relative;\n}\n\n.uicm-sidebar-tab.active::after {\n  content: \"\";\n  position: absolute;\n  bottom: -1px;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background: #3b82f6;\n  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);\n}\n\n.uicm-sidebar-tab.active:hover {\n  color: #1e3a8a;\n  background: linear-gradient(135deg, #ffffff, #f1f5f9);\n}\n\n/* Tab indicators */\n.uicm-sidebar-tab::after {\n  content: \"\";\n  position: absolute;\n  bottom: 0;\n  left: 50%;\n  transform: translateX(-50%);\n  width: 0;\n  height: 3px;\n  background: linear-gradient(90deg, #3b82f6, #06b6d4);\n  border-radius: 2px 2px 0 0;\n  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.uicm-sidebar-tab.active::after {\n  width: 60%;\n}\n\n/* Filter Toggle */\n.uicm-sidebar-filter-toggle {\n  background: linear-gradient(135deg, #374151, #4b5563);\n  border-top: none;\n  color: white;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 12px 20px;\n  width: 100%;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  position: relative;\n}\n\n.uicm-filter-toggle-icon {\n  font-size: 14px;\n  opacity: 0.7;\n}\n\n.uicm-filter-toggle-text {\n  font-size: 13px;\n  font-weight: 600;\n  color: inherit;\n}\n\n.uicm-filter-toggle-arrow {\n  font-size: 10px;\n  opacity: 0.6;\n  transition: transform 0.3s ease;\n}\n\n.uicm-sidebar-filter-toggle:hover .uicm-filter-toggle-arrow {\n  transform: rotate(180deg);\n}\n\n/* Filters */\n.uicm-sidebar-filters {\n  background: linear-gradient(135deg, #f8fafc, #f1f5f9);\n  border-bottom: 1px solid #e5e7eb;\n  overflow: hidden;\n  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  max-height: 0;\n}\n\n.uicm-sidebar-filters-closed {\n  max-height: 0;\n}\n\n.uicm-sidebar-filters-open {\n  max-height: 200px;\n}\n\n.uicm-sidebar-filters::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 1px;\n  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);\n}\n\n.uicm-sidebar-filter-header {\n  padding: 12px 20px 8px;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.uicm-sidebar-filter-icon {\n  font-size: 14px;\n  color: #64748b;\n}\n\n.uicm-sidebar-filter-title {\n  font-size: 12px;\n  font-weight: 600;\n  color: #64748b;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n\n.uicm-sidebar-filter-buttons {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 8px;\n  padding: 0 20px 16px;\n}\n\n.uicm-status-filter-btn {\n  background: linear-gradient(\n    135deg,\n    rgba(255, 255, 255, 0.9),\n    rgba(248, 250, 252, 0.8)\n  );\n  border: 1px solid rgba(255, 255, 255, 0.4);\n  color: #374151;\n  font-size: 11px;\n  font-weight: 600;\n  padding: 8px 12px;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n  position: relative;\n  overflow: hidden;\n}\n\n.uicm-status-filter-btn::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.1),\n    rgba(59, 130, 246, 0.05)\n  );\n  opacity: 0;\n  transition: opacity 0.3s ease;\n}\n\n.uicm-status-filter-btn:hover {\n  background: linear-gradient(\n    135deg,\n    rgba(255, 255, 255, 1),\n    rgba(248, 250, 252, 0.9)\n  );\n  border-color: rgba(59, 130, 246, 0.3);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);\n}\n\n.uicm-status-filter-btn:hover::before {\n  opacity: 1;\n}\n\n.uicm-status-filter-btn.active {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.15),\n    rgba(59, 130, 246, 0.1)\n  );\n  border-color: rgba(59, 130, 246, 0.4);\n  color: #1e40af;\n  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);\n}\n\n.uicm-status-filter-btn.active:hover {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.2),\n    rgba(59, 130, 246, 0.15)\n  );\n}\n\n.uicm-filter-btn-icon {\n  font-size: 12px;\n  margin-right: 4px;\n}\n\n.uicm-filter-btn-text {\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.3px;\n}\n\n/* Stats */\n.uicm-sidebar-stats {\n  padding: 12px 20px;\n  background: linear-gradient(135deg, #f8fafc, #f1f5f9);\n  border-bottom: 1px solid #e5e7eb;\n}\n\n.uicm-sidebar-stats-content {\n  font-size: 12px;\n  color: #64748b;\n  text-align: center;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\n/* Comments List */\n.uicm-sidebar-comments-list {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f1f5f9;\n}\n\n.uicm-sidebar-comments-list::-webkit-scrollbar {\n  width: 6px;\n}\n\n.uicm-sidebar-comments-list::-webkit-scrollbar-track {\n  background: #f1f5f9;\n  border-radius: 3px;\n}\n\n.uicm-sidebar-comments-list::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n\n.uicm-sidebar-comments-list::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n\n.uicm-sidebar-comment-item {\n  background: rgba(255, 255, 255, 0.8);\n  border: none;\n  border-bottom: 1px solid rgba(229, 231, 235, 0.5);\n  border-radius: 0;\n  padding: 16px 20px;\n  margin-bottom: 0;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n\n.uicm-sidebar-comment-item:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n}\n\n.uicm-sidebar-comment-header {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  margin-bottom: 8px;\n}\n\n.uicm-sidebar-comment-avatar {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-weight: 600;\n  font-size: 14px;\n  flex-shrink: 0;\n}\n\n.uicm-sidebar-comment-user-info {\n  flex: 1;\n  min-width: 0;\n}\n\n.uicm-sidebar-comment-name-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 2px;\n}\n\n.uicm-sidebar-comment-name {\n  font-weight: 600;\n  color: #1f2937;\n  font-size: 14px;\n}\n\n.uicm-sidebar-comment-role {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.1),\n    rgba(139, 92, 246, 0.1)\n  );\n  color: #3b82f6;\n  font-size: 10px;\n  font-weight: 600;\n  padding: 2px 6px;\n  border-radius: 6px;\n  border: 1px solid rgba(59, 130, 246, 0.2);\n  text-transform: uppercase;\n  letter-spacing: 0.3px;\n}\n\n.uicm-sidebar-comment-time {\n  font-size: 11px;\n  color: #6b7280;\n  margin-left: auto;\n}\n\n.uicm-sidebar-comment-page {\n  font-size: 11px;\n  color: #6b7280;\n  margin-top: 2px;\n}\n\n.uicm-sidebar-comment-content {\n  color: #374151;\n  line-height: 1.4;\n  font-size: 13px;\n  margin: 0;\n  word-wrap: break-word;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n}\n\n.uicm-sidebar-comment-footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-top: 8px;\n  gap: 8px;\n}\n\n.uicm-sidebar-comment-status {\n  font-size: 10px;\n  font-weight: 600;\n  padding: 2px 6px;\n  border-radius: 4px;\n  text-transform: uppercase;\n  letter-spacing: 0.3px;\n}\n\n.uicm-sidebar-comment-replies {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 11px;\n  color: #6b7280;\n}\n\n.uicm-sidebar-comment-replies-icon {\n  font-size: 12px;\n}\n\n.uicm-sidebar-empty {\n  text-align: center;\n  padding: 40px 20px;\n  color: #6b7280;\n}\n\n.uicm-sidebar-empty-icon {\n  font-size: 48px;\n  margin-bottom: 16px;\n  opacity: 0.5;\n}\n\n.uicm-sidebar-empty-title {\n  font-size: 16px;\n  font-weight: 600;\n  margin-bottom: 8px;\n  color: #374151;\n}\n\n.uicm-sidebar-empty-subtitle {\n  font-size: 14px;\n  color: #6b7280;\n}\n\n/* Dark theme support */\n@media (prefers-color-scheme: dark) {\n  .uicm-comment-sidebar {\n    background: #1f2937;\n    border-left-color: #374151;\n    color: #f9fafb;\n  }\n\n  .uicm-sidebar-header {\n    background: linear-gradient(135deg, #374151, #4b5563);\n    border-bottom-color: #374151;\n  }\n\n  .uicm-sidebar-title {\n    color: #f9fafb;\n  }\n\n  .uicm-sidebar-tabs {\n    background: linear-gradient(135deg, #374151, #4b5563);\n    border-bottom-color: #4b5563;\n  }\n\n  .uicm-sidebar-tabs::after {\n    background: linear-gradient(90deg, transparent, #4b5563, transparent);\n  }\n\n  .uicm-sidebar-tab {\n    color: #9ca3af;\n  }\n\n  .uicm-sidebar-tab::before {\n    background: linear-gradient(\n      135deg,\n      rgba(96, 165, 250, 0.1),\n      rgba(96, 165, 250, 0.05)\n    );\n  }\n\n  .uicm-sidebar-tab:hover {\n    color: #d1d5db;\n    background: linear-gradient(\n      135deg,\n      rgba(96, 165, 250, 0.15),\n      rgba(96, 165, 250, 0.08)\n    );\n  }\n\n  .uicm-sidebar-tab.active {\n    color: #60a5fa;\n    background: linear-gradient(135deg, #1f2937, #374151);\n    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);\n  }\n\n  .uicm-sidebar-tab.active::after {\n    background: #60a5fa;\n    box-shadow: 0 0 8px rgba(96, 165, 250, 0.4);\n  }\n\n  .uicm-sidebar-tab.active:hover {\n    color: #93c5fd;\n    background: linear-gradient(135deg, #1f2937, #4b5563);\n  }\n\n  .uicm-sidebar-tab::after {\n    background: linear-gradient(90deg, #60a5fa, #06b6d4);\n  }\n\n  .uicm-sidebar-stats {\n    background: #374151;\n    border-bottom-color: #4b5563;\n    color: #d1d5db;\n  }\n\n  .uicm-sidebar-comment-item {\n    background: #1f2937;\n    border-bottom-color: #374151;\n  }\n\n  .uicm-sidebar-comment-item:hover {\n    background-color: #374151;\n  }\n\n  .uicm-sidebar-comment-name {\n    color: #f9fafb;\n  }\n\n  .uicm-sidebar-comment-content {\n    color: #d1d5db;\n  }\n}\n\n/* Mobile Responsive */\n@media (max-width: 640px) {\n  .uicm-comment-sidebar {\n    width: 100vw;\n    right: 0;\n  }\n\n  .uicm-sidebar-header {\n    padding: 12px 16px;\n  }\n\n  .uicm-sidebar-title {\n    font-size: 14px;\n  }\n\n  .uicm-sidebar-tabs {\n    padding: 0;\n  }\n\n  .uicm-sidebar-tab {\n    padding: 12px 16px;\n    font-size: 12px;\n  }\n\n  .uicm-sidebar-stats {\n    padding: 8px 16px;\n  }\n\n  .uicm-sidebar-comment-item {\n    padding: 12px;\n    margin-bottom: 8px;\n  }\n\n  .uicm-sidebar-comment-name {\n    font-size: 13px;\n  }\n\n  .uicm-sidebar-comment-content {\n    font-size: 12px;\n  }\n}\n";
    styleInject(css_248z$a);

    class CommentSidebar {
        constructor(props) {
            this.isVisible = false;
            this.currentTab = "active";
            this.currentStatusFilter = "all";
            this.isFilterOpen = false;
            this.commentsList = null;
            this.statsContent = null;
            this.filterContainer = null;
            this.filterToggleBtn = null;
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        formatTimeAgo(dateString) {
            const now = new Date();
            const date = new Date(dateString);
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (diffInSeconds < 60)
                return "just now";
            if (diffInSeconds < 3600)
                return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400)
                return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 2592000)
                return `${Math.floor(diffInSeconds / 86400)}d ago`;
            return date.toLocaleDateString();
        }
        getStatusColor(status) {
            switch (status) {
                case exports.CommentStatus.BUG:
                    return { bg: "#dc3545", text: "white" };
                case exports.CommentStatus.FEATURE_REQUEST:
                    return { bg: "#ffc107", text: "black" };
                case exports.CommentStatus.DEV_COMPLETED:
                    return { bg: "#3b82f6", text: "white" };
                case exports.CommentStatus.DONE:
                    return { bg: "#28a745", text: "white" };
                case exports.CommentStatus.ARCHIVED:
                    return { bg: "#6c757d", text: "white" };
                default:
                    return { bg: "#007bff", text: "white" };
            }
        }
        getPageName(url) {
            try {
                const urlObj = new URL(url);
                const path = urlObj.pathname;
                // Extract page name from path
                if (path === "/" || path === "")
                    return "Home";
                const segments = path.split("/").filter(Boolean);
                if (segments.length === 0)
                    return "Home";
                // Convert path to readable name
                const pageName = segments[segments.length - 1]
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
                return pageName || "Unknown Page";
            }
            catch {
                return "Unknown Page";
            }
        }
        getFilteredComments() {
            let filteredComments;
            if (this.currentTab === "active") {
                filteredComments = this.props.comments.filter((c) => c.status !== "archived");
            }
            else {
                filteredComments = this.props.comments.filter((c) => c.status === "archived");
            }
            // Apply status filter if not "all"
            if (this.currentStatusFilter !== "all") {
                filteredComments = filteredComments.filter((c) => c.status === this.currentStatusFilter);
            }
            return filteredComments;
        }
        switchTab(tab) {
            this.currentTab = tab;
            this.updateCommentsDisplay();
            this.updateStats();
            this.updateTabStates();
        }
        switchStatusFilter(status) {
            this.currentStatusFilter = status;
            this.updateCommentsDisplay();
            this.updateStats();
            this.updateFilterStates();
        }
        toggleFilter() {
            this.isFilterOpen = !this.isFilterOpen;
            if (this.filterContainer) {
                if (this.isFilterOpen) {
                    this.filterContainer.classList.remove("uicm-sidebar-filters-closed");
                    this.filterContainer.classList.add("uicm-sidebar-filters-open");
                }
                else {
                    this.filterContainer.classList.remove("uicm-sidebar-filters-open");
                    this.filterContainer.classList.add("uicm-sidebar-filters-closed");
                }
            }
            if (this.filterToggleBtn) {
                const arrow = this.filterToggleBtn.querySelector(".uicm-filter-toggle-arrow");
                if (arrow) {
                    arrow.textContent = this.isFilterOpen ? "▲" : "▼";
                }
            }
        }
        updateCommentsDisplay() {
            if (!this.commentsList)
                return;
            this.commentsList.innerHTML = "";
            const filteredComments = this.getFilteredComments();
            if (filteredComments.length === 0) {
                const emptyState = document.createElement("div");
                emptyState.className = "uicm-sidebar-empty";
                const emptyText = this.currentTab === "active"
                    ? "No active comments yet"
                    : "No archived comments";
                const emptySubtext = this.currentTab === "active"
                    ? "Start commenting on any element to see them here"
                    : "Archived comments will appear here";
                emptyState.innerHTML = `
        <div class="uicm-sidebar-empty-icon">��</div>
        <div class="uicm-sidebar-empty-title">${emptyText}</div>
        <div class="uicm-sidebar-empty-subtitle">${emptySubtext}</div>
      `;
                this.commentsList.appendChild(emptyState);
            }
            else {
                filteredComments.forEach((comment) => {
                    const commentItem = this.createCommentItem(comment);
                    this.commentsList.appendChild(commentItem);
                });
            }
        }
        updateStats() {
            if (!this.statsContent)
                return;
            const activeComments = this.props.comments.filter((c) => c.status !== "archived").length;
            const archivedComments = this.props.comments.filter((c) => c.status === "archived").length;
            const totalReplies = this.props.comments.reduce((sum, comment) => sum + comment.replies.length, 0);
            this.statsContent.innerHTML = `
      <span>📝 ${this.currentTab === "active" ? activeComments : archivedComments} ${this.currentTab === "active" ? "active" : "archived"}</span>
      <span>💬 ${totalReplies} replies</span>
      <span>📊 ${activeComments + archivedComments} total</span>
    `;
        }
        createCommentItem(comment) {
            const item = document.createElement("div");
            item.className = "uicm-sidebar-comment-item";
            // Click to navigate
            item.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.onNavigateToComment(comment);
            });
            // Header with avatar, name, role, and time
            const header = document.createElement("div");
            header.className = "uicm-sidebar-comment-header";
            // Avatar
            const avatar = document.createElement("div");
            avatar.className = "uicm-sidebar-comment-avatar";
            let avatarChar = "?";
            if (comment &&
                comment.createdBy &&
                typeof comment.createdBy.name === "string" &&
                comment.createdBy.name.length > 0) {
                avatarChar = comment.createdBy.name.charAt(0).toUpperCase();
            }
            avatar.textContent = avatarChar;
            // User info container
            const userInfo = document.createElement("div");
            userInfo.className = "uicm-sidebar-comment-user-info";
            // Name and role row
            const nameRow = document.createElement("div");
            nameRow.className = "uicm-sidebar-comment-name-row";
            const name = document.createElement("span");
            name.className = "uicm-sidebar-comment-name";
            name.textContent = comment.createdBy.name;
            // Role badge
            const roleBadge = document.createElement("span");
            roleBadge.className = "uicm-sidebar-comment-role";
            const roleColors = getRoleColor(comment.role);
            roleBadge.style.backgroundColor = roleColors.bg;
            roleBadge.style.color = roleColors.text;
            roleBadge.style.borderColor = roleColors.border;
            roleBadge.textContent = getRoleDisplayName(comment.role);
            // Time
            const time = document.createElement("span");
            time.className = "uicm-sidebar-comment-time";
            time.textContent = this.formatTimeAgo(comment.createdAt);
            nameRow.appendChild(name);
            nameRow.appendChild(roleBadge);
            nameRow.appendChild(time);
            // Page name
            const pageName = document.createElement("div");
            pageName.className = "uicm-sidebar-comment-page";
            pageName.textContent = this.getPageName(comment.url);
            userInfo.appendChild(nameRow);
            userInfo.appendChild(pageName);
            header.appendChild(avatar);
            header.appendChild(userInfo);
            // Content
            const content = document.createElement("div");
            content.className = "uicm-sidebar-comment-content";
            content.textContent = comment.content;
            // Footer with status and reply count
            const footer = document.createElement("div");
            footer.className = "uicm-sidebar-comment-footer";
            // Status badge
            const statusBadge = document.createElement("span");
            statusBadge.className = "uicm-sidebar-comment-status";
            const statusColors = this.getStatusColor(comment.status);
            statusBadge.style.backgroundColor = statusColors.bg;
            statusBadge.style.color = statusColors.text;
            statusBadge.textContent = comment?.status?.toUpperCase();
            // Reply count
            const replyCount = document.createElement("span");
            replyCount.className = "uicm-sidebar-comment-replies";
            const replyIcon = document.createElement("span");
            replyIcon.className = "uicm-sidebar-comment-replies-icon";
            replyIcon.textContent = "💬";
            replyCount.appendChild(replyIcon);
            replyCount.appendChild(document.createTextNode(`${comment.replies.length}`));
            footer.appendChild(statusBadge);
            footer.appendChild(replyCount);
            item.appendChild(header);
            item.appendChild(content);
            item.appendChild(footer);
            return item;
        }
        createElement() {
            const sidebar = document.createElement("div");
            sidebar.className = "uicm-comment-sidebar";
            // Header
            const header = document.createElement("div");
            header.className = "uicm-sidebar-header";
            const title = document.createElement("h3");
            title.className = "uicm-sidebar-title";
            title.textContent = "All Comments";
            const closeButton = document.createElement("button");
            closeButton.className = "uicm-sidebar-close";
            closeButton.innerHTML = "×";
            closeButton.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.onClose();
            });
            header.appendChild(title);
            header.appendChild(closeButton);
            // Tabs
            const tabsContainer = document.createElement("div");
            tabsContainer.className = "uicm-sidebar-tabs";
            const activeTab = document.createElement("button");
            activeTab.className = "uicm-sidebar-tab uicm-sidebar-tab-active";
            activeTab.textContent = "Active";
            activeTab.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab("active");
            });
            const archiveTab = document.createElement("button");
            archiveTab.className = "uicm-sidebar-tab";
            archiveTab.textContent = "Archive";
            archiveTab.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab("archive");
            });
            tabsContainer.appendChild(activeTab);
            tabsContainer.appendChild(archiveTab);
            // Filter Toggle Button
            this.filterToggleBtn = document.createElement("button");
            this.filterToggleBtn.className = "uicm-sidebar-filter-toggle";
            this.filterToggleBtn.innerHTML = `
      <span class="uicm-filter-toggle-icon">🔍</span>
      <span class="uicm-filter-toggle-text">Filter</span>
      <span class="uicm-filter-toggle-arrow">▼</span>
    `;
            this.filterToggleBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilter();
            });
            // Status Filters
            this.filterContainer = document.createElement("div");
            this.filterContainer.className =
                "uicm-sidebar-filters uicm-sidebar-filters-closed";
            const filterHeader = document.createElement("div");
            filterHeader.className = "uicm-sidebar-filter-header";
            const filterIcon = document.createElement("span");
            filterIcon.className = "uicm-sidebar-filter-icon";
            filterIcon.innerHTML = "🔍";
            const filterTitle = document.createElement("div");
            filterTitle.className = "uicm-sidebar-filter-title";
            filterTitle.textContent = "Filter by Status";
            filterHeader.appendChild(filterIcon);
            filterHeader.appendChild(filterTitle);
            const filterButtons = document.createElement("div");
            filterButtons.className = "uicm-sidebar-filter-buttons";
            // All filter button
            const allFilterBtn = document.createElement("button");
            allFilterBtn.className = "uicm-status-filter-btn active";
            allFilterBtn.setAttribute("data-status", "all");
            allFilterBtn.innerHTML = `
      <span class="uicm-filter-btn-icon">📋</span>
      <span class="uicm-filter-btn-text">All</span>
    `;
            allFilterBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchStatusFilter("all");
            });
            // Status filter buttons
            const statusFilters = [
                {
                    status: exports.CommentStatus.BUG,
                    label: "Bug",
                    icon: "🐛",
                    color: "#dc3545",
                    colorDark: "#c82333",
                    colorDarker: "#a71e2a",
                    colorRgb: "220, 53, 69",
                },
                {
                    status: exports.CommentStatus.FEATURE_REQUEST,
                    label: "Feature",
                    icon: "💡",
                    color: "#ffc107",
                    colorDark: "#e0a800",
                    colorDarker: "#d39e00",
                    colorRgb: "255, 193, 7",
                },
                {
                    status: exports.CommentStatus.DEV_COMPLETED,
                    label: "Dev Done",
                    icon: "✅",
                    color: "#3b82f6",
                    colorDark: "#2563eb",
                    colorDarker: "#1d4ed8",
                    colorRgb: "59, 130, 246",
                },
                {
                    status: exports.CommentStatus.DONE,
                    label: "Done",
                    icon: "🎉",
                    color: "#28a745",
                    colorDark: "#218838",
                    colorDarker: "#1e7e34",
                    colorRgb: "40, 167, 69",
                },
            ];
            statusFilters.forEach(({ status, label, icon, color, colorDark, colorDarker, colorRgb }) => {
                const filterBtn = document.createElement("button");
                filterBtn.className = "uicm-status-filter-btn";
                filterBtn.setAttribute("data-status", status);
                filterBtn.setAttribute("data-color", color);
                filterBtn.innerHTML = `
        <span class="uicm-filter-btn-icon">${icon}</span>
        <span class="uicm-filter-btn-text">${label}</span>
      `;
                // Set CSS custom properties for color coding
                filterBtn.style.setProperty("--status-color", color);
                filterBtn.style.setProperty("--status-color-dark", colorDark);
                filterBtn.style.setProperty("--status-color-darker", colorDarker);
                filterBtn.style.setProperty("--status-color-rgb", colorRgb);
                filterBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.switchStatusFilter(status);
                });
                filterButtons.appendChild(filterBtn);
            });
            this.filterContainer.appendChild(filterHeader);
            this.filterContainer.appendChild(filterButtons);
            // Stats
            const stats = document.createElement("div");
            stats.className = "uicm-sidebar-stats";
            const activeComments = this.props.comments.filter((c) => c.status !== "archived").length;
            const archivedComments = this.props.comments.filter((c) => c.status === "archived").length;
            const totalReplies = this.props.comments.reduce((sum, comment) => sum + comment.replies.length, 0);
            this.statsContent = document.createElement("div");
            this.statsContent.className = "uicm-sidebar-stats-content";
            this.statsContent.innerHTML = `
      <span>📝 ${activeComments} active</span>
      <span>💬 ${totalReplies} replies</span>
      <span>📊 ${activeComments + archivedComments} total</span>
    `;
            stats.appendChild(this.statsContent);
            // Comments list
            this.commentsList = document.createElement("div");
            this.commentsList.className = "uicm-sidebar-comments-list";
            // Populate comments based on current tab
            this.updateCommentsDisplay();
            sidebar.appendChild(header);
            sidebar.appendChild(tabsContainer);
            sidebar.appendChild(this.filterToggleBtn);
            sidebar.appendChild(this.filterContainer);
            sidebar.appendChild(stats);
            sidebar.appendChild(this.commentsList);
            return sidebar;
        }
        attachEventListeners() {
            // ESC key to close
            const escHandler = (e) => {
                if (e.key === "Escape" && this.isVisible) {
                    this.props.onClose();
                }
            };
            document.addEventListener("keydown", escHandler);
            // Clean up on destroy
            this.element.addEventListener("destroy", () => {
                document.removeEventListener("keydown", escHandler);
            });
        }
        show() {
            this.isVisible = true;
            document.body.appendChild(this.element);
            this.element.offsetHeight;
            this.element.classList.add("show");
        }
        hide() {
            this.isVisible = false;
            // Remove show class to trigger slide out animation
            this.element.classList.remove("show");
            // Remove from DOM after animation
            setTimeout(() => {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 300);
        }
        updateComments(comments) {
            this.props.comments = comments;
            this.updateCommentsDisplay();
            this.updateStats();
            this.updateTabStates();
            this.updateFilterStates();
        }
        updateTabStates() {
            const activeTab = this.element.querySelector(".uicm-sidebar-tab.active");
            const archiveTab = this.element.querySelector(".uicm-sidebar-tab.archive");
            if (activeTab) {
                activeTab.classList.toggle("active", this.currentTab === "active");
            }
            if (archiveTab) {
                archiveTab.classList.toggle("active", this.currentTab === "archive");
            }
        }
        updateFilterStates() {
            if (!this.filterContainer)
                return;
            const filterButtons = this.filterContainer.querySelectorAll(".uicm-status-filter-btn");
            filterButtons.forEach((btn) => {
                const status = btn.getAttribute("data-status");
                if (status === this.currentStatusFilter ||
                    (status === "all" && this.currentStatusFilter === "all")) {
                    btn.classList.add("active");
                }
                else {
                    btn.classList.remove("active");
                }
            });
        }
        getElement() {
            return this.element;
        }
        destroy() {
            this.hide();
            this.element.dispatchEvent(new Event("destroy"));
        }
    }

    class CommentsTable {
        constructor(props) {
            this.selectedComments = new Set();
            this.sortConfig = { key: "createdAt", direction: "desc" };
            this.filterConfig = {};
            this.filteredComments = [];
            this.destroyed = false;
            this.imageModal = null; // <--- Thêm biến này
            this.handleEscKey = (e) => {
                if (e.key === "Escape") {
                    this.props.onClose();
                }
            };
            this.escHandler = null;
            this.props = props;
            this.element = this.createElement();
            this.updateFilteredComments();
            this.render();
            this.attachEventListeners();
        }
        createElement() {
            const modal = document.createElement("div");
            modal.className = "uicm-comments-table-modal";
            modal.innerHTML = `
      <div class="uicm-comments-table-overlay"></div>
      <div class="uicm-comments-table-container">
        <div class="uicm-comments-table-header">
          <h2>Comments Management</h2>
          <button class="uicm-comments-table-close" aria-label="Close">×</button>
        </div>
        
        <div class="uicm-comments-table-toolbar">
          <div class="uicm-comments-table-filters">
            <input type="text" class="uicm-search-input" placeholder="Search comments...">
            
            <select class="uicm-status-filter">
              <option value="">All Status</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="dev_completed">Dev Completed</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
            
            <input type="date" class="uicm-date-start" placeholder="Start Date">
            <input type="date" class="uicm-date-end" placeholder="End Date">
            
            <button class="uicm-clear-filters uicm-allow-bubble">Clear Filters</button>
          </div>
          
          <div class="uicm-comments-table-actions">
            <button class="uicm-delete-selected uicm-allow-bubble" disabled>Delete Selected</button>
            <button class="uicm-export-excel uicm-allow-bubble">Export CSV</button>
          </div>
        </div>
        
        <div class="uicm-comments-table-wrapper">
          <table class="uicm-comments-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" class="uicm-select-all">
                </th>
                <th class="sortable" data-key="createdAt">
                  Date Created
                  <span class="sort-indicator">↓</span>
                </th>
                <th class="sortable" data-key="role">
                  Role
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="author">
                  Name
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="status">
                  Status
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="content">
                  Content
                  <span class="sort-indicator"></span>
                </th>
                <th>Attachments</th>
                <th>URL</th>
                <th>Replies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody class="uicm-comments-table-body">
            </tbody>
          </table>
        </div>
        
        <div class="uicm-comments-table-footer">
          <div class="uicm-comments-count">
            Total: <span class="total-count">0</span> comments
            (<span class="selected-count">0</span> selected)
          </div>
        </div>
      </div>
    `;
            return modal;
        }
        updateFilteredComments() {
            let filtered = [...this.props.comments];
            // Apply search filter
            if (this.filterConfig.searchText?.trim()) {
                const searchText = this.filterConfig.searchText.toLowerCase();
                filtered = filtered.filter((comment) => comment.content.toLowerCase().includes(searchText) ||
                    comment.createdBy.name.toLowerCase().includes(searchText));
            }
            // Apply status filter
            if (this.filterConfig.status?.length) {
                filtered = filtered.filter((comment) => this.filterConfig.status.includes(comment.status));
            }
            // Apply author filter
            if (this.filterConfig.author?.length) {
                filtered = filtered.filter((comment) => this.filterConfig.author.includes(comment.createdBy.name));
            }
            // Apply date range filter
            if (this.filterConfig.dateRange?.start ||
                this.filterConfig.dateRange?.end) {
                filtered = filtered.filter((comment) => {
                    const commentDate = new Date(comment.createdAt);
                    const start = this.filterConfig.dateRange?.start
                        ? new Date(this.filterConfig.dateRange.start)
                        : null;
                    const end = this.filterConfig.dateRange?.end
                        ? new Date(this.filterConfig.dateRange.end)
                        : null;
                    if (start && commentDate < start)
                        return false;
                    if (end && commentDate > end)
                        return false;
                    return true;
                });
            }
            // Apply sorting
            filtered.sort((a, b) => {
                let aValue, bValue;
                switch (this.sortConfig.key) {
                    case "author":
                        aValue = a.createdBy.name;
                        bValue = b.createdBy.name;
                        break;
                    case "role":
                        aValue = a.createdBy.role || "other";
                        bValue = b.createdBy.role || "other";
                        break;
                    case "statusText":
                        aValue = this.getStatusDisplayName(a.status);
                        bValue = this.getStatusDisplayName(b.status);
                        break;
                    default:
                        aValue = a[this.sortConfig.key];
                        bValue = b[this.sortConfig.key];
                }
                if (aValue < bValue)
                    return this.sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue)
                    return this.sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
            this.filteredComments = filtered;
        }
        render() {
            const tbody = this.element.querySelector(".uicm-comments-table-body");
            const totalCount = this.element.querySelector(".total-count");
            const selectedCount = this.element.querySelector(".selected-count");
            tbody.innerHTML = "";
            this.filteredComments.forEach((comment) => {
                const row = this.createCommentRow(comment);
                tbody.appendChild(row);
            });
            totalCount.textContent = this.filteredComments.length.toString();
            selectedCount.textContent = this.selectedComments.size.toString();
            // Update delete button state
            const deleteButton = this.element.querySelector(".uicm-delete-selected");
            deleteButton.disabled = this.selectedComments.size === 0;
            // Update select all checkbox
            const selectAllCheckbox = this.element.querySelector(".uicm-select-all");
            if (this.filteredComments.length === 0) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            }
            else if (this.selectedComments.size === this.filteredComments.length) {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = true;
            }
            else if (this.selectedComments.size > 0) {
                selectAllCheckbox.indeterminate = true;
                selectAllCheckbox.checked = false;
            }
            else {
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.checked = false;
            }
        }
        createCommentRow(comment) {
            const row = document.createElement("tr");
            row.className = "uicm-comment-row";
            row.dataset.commentId = comment.id;
            const isSelected = this.selectedComments.has(comment.id);
            const statusColor = this.getStatusColor(comment.status);
            const statusName = this.getStatusDisplayName(comment.status);
            const roleColor = getRoleColor(comment.createdBy.role || "other");
            const formattedDate = new Date(comment.createdAt).toLocaleString();
            const attachmentsCell = document.createElement("td");
            attachmentsCell.className = "attachments-cell";
            if (comment.attachments && comment.attachments.length > 0) {
                comment.attachments.forEach((att) => {
                    if (att.type === "image") {
                        const thumb = document.createElement("img");
                        thumb.src = att.url;
                        thumb.alt = att.filename;
                        thumb.className = "uicm-attachment-thumb";
                        thumb.style.width = "36px";
                        thumb.style.height = "36px";
                        thumb.style.objectFit = "cover";
                        thumb.style.borderRadius = "6px";
                        thumb.style.marginRight = "4px";
                        thumb.style.cursor = "pointer";
                        thumb.title = att.filename;
                        thumb.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (this.imageModal) {
                                this.imageModal.destroy();
                                this.imageModal = null;
                            }
                            this.imageModal = new ImageModal(att.url);
                            this.imageModal.show();
                        });
                        attachmentsCell.appendChild(thumb);
                    }
                    else {
                        const fileIcon = document.createElement("span");
                        fileIcon.innerHTML = "📎";
                        fileIcon.style.fontSize = "18px";
                        fileIcon.style.marginRight = "2px";
                        fileIcon.title = att.filename;
                        attachmentsCell.appendChild(fileIcon);
                        const fileName = document.createElement("span");
                        fileName.textContent = att.filename;
                        fileName.style.fontSize = "12px";
                        fileName.style.marginRight = "6px";
                        attachmentsCell.appendChild(fileName);
                    }
                });
            }
            else {
                attachmentsCell.textContent = "-";
            }
            row.innerHTML = `
      <td>
        <input type="checkbox" class="uicm-comment-select" ${isSelected ? "checked" : ""}>
      </td>
      <td class="date-cell">${formattedDate}</td>
      <td class="role-cell">
        <span class="author-role" style="color: ${roleColor}">${getRoleDisplayName(comment.createdBy.role || "other")}</span>
      </td>
      <td class="author-cell">
        <span class="author-name">${comment.createdBy.name}</span>
      </td>
      <td class="status-cell">
        <span class="status-badge" style="background-color: ${statusColor}">${statusName}</span>
      </td>
      <td class="content-cell">
        <div class="comment-content">${this.truncateText(comment.content, 100)}</div>
      </td>
    `;
            row.appendChild(attachmentsCell);
            row.innerHTML += `
      <td class="url-cell">
        <span class="url-text" title="${comment.url}" style="display:inline-block; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle;">${comment.url}</span>
      </td>
      <td class="replies-cell">
        <span class="replies-count">${comment.replies.length}</span>
      </td>
      <td class="actions-cell">
        <button class="uicm-edit-comment" data-comment-id="${comment.id}" style="display: none;" disabled>Edit</button>
        <button class="uicm-delete-comment uicm-allow-bubble" data-comment-id="${comment.id}" title="Delete">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><path d="M6 8V15M10 8V15M14 8V15M3 5H17M8 5V3.5C8 2.67157 8.67157 2 9.5 2H10.5C11.3284 2 12 2.67157 12 3.5V5M4 5V16.5C4 17.3284 4.67157 18 5.5 18H14.5C15.3284 18 16 17.3284 16 16.5V5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    `;
            return row;
        }
        attachEventListeners() {
            // Close button
            const closeButton = this.element.querySelector(".uicm-comments-table-close");
            closeButton.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.closeModal();
            }, true);
            // Overlay click to close
            const overlay = this.element.querySelector(".uicm-comments-table-overlay");
            overlay.addEventListener("click", (e) => {
                // Only close if clicking directly on overlay, not on child elements
                if (e.target === overlay) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.closeModal();
                }
            }, true);
            // Search input with debounce
            const searchInput = this.element.querySelector(".uicm-search-input");
            let searchDebounce = null;
            searchInput.addEventListener("input", (e) => {
                if (searchDebounce)
                    clearTimeout(searchDebounce);
                searchDebounce = setTimeout(() => {
                    this.filterConfig.searchText = e.target.value;
                    this.updateFilteredComments();
                    this.render();
                }, 300);
            });
            // Status filter (single select)
            const statusFilter = this.element.querySelector(".uicm-status-filter");
            statusFilter.addEventListener("change", () => {
                const value = statusFilter.value;
                this.filterConfig.status = value ? [value] : undefined;
                this.updateFilteredComments();
                this.render();
            });
            // Date filters
            const dateStart = this.element.querySelector(".uicm-date-start");
            const dateEnd = this.element.querySelector(".uicm-date-end");
            dateStart.addEventListener("change", (e) => {
                if (!this.filterConfig.dateRange)
                    this.filterConfig.dateRange = {};
                this.filterConfig.dateRange.start = e.target.value;
                this.updateFilteredComments();
                this.render();
            });
            dateEnd.addEventListener("change", (e) => {
                if (!this.filterConfig.dateRange)
                    this.filterConfig.dateRange = {};
                this.filterConfig.dateRange.end = e.target.value;
                this.updateFilteredComments();
                this.render();
            });
            // Clear filters
            const clearFilters = this.element.querySelector(".uicm-clear-filters");
            clearFilters.addEventListener("click", () => {
                // Clear any pending debounce
                if (searchDebounce) {
                    clearTimeout(searchDebounce);
                    searchDebounce = null;
                }
                // Reset filter config completely
                this.filterConfig = {
                    status: undefined,
                    author: undefined,
                    dateRange: undefined,
                    searchText: undefined,
                };
                // Reset form values
                searchInput.value = "";
                statusFilter.value = "";
                dateStart.value = "";
                dateEnd.value = "";
                // Force re-filter and render immediately
                this.updateFilteredComments();
                this.render();
                // Optional: Force trigger events for any external listeners
                setTimeout(() => {
                    const inputEvent = new Event("input", { bubbles: true });
                    const changeEvent = new Event("change", { bubbles: true });
                    searchInput.dispatchEvent(inputEvent);
                    statusFilter.dispatchEvent(changeEvent);
                    dateStart.dispatchEvent(changeEvent);
                    dateEnd.dispatchEvent(changeEvent);
                }, 0);
            });
            // Sort headers
            const sortableHeaders = this.element.querySelectorAll(".sortable");
            sortableHeaders.forEach((header) => {
                header.addEventListener("click", () => {
                    const key = header.getAttribute("data-key");
                    if (this.sortConfig.key === key) {
                        this.sortConfig.direction =
                            this.sortConfig.direction === "asc" ? "desc" : "asc";
                    }
                    else {
                        this.sortConfig.key = key;
                        this.sortConfig.direction = "asc";
                    }
                    this.updateSortIndicators();
                    this.updateFilteredComments();
                    this.render();
                });
            });
            // Select all checkbox
            const selectAllCheckbox = this.element.querySelector(".uicm-select-all");
            selectAllCheckbox.addEventListener("change", () => {
                if (selectAllCheckbox.checked) {
                    this.filteredComments.forEach((comment) => this.selectedComments.add(comment.id));
                }
                else {
                    this.selectedComments.clear();
                }
                this.render();
            });
            // Table event delegation
            const table = this.element.querySelector(".uicm-comments-table");
            table.addEventListener("click", (e) => {
                const target = e.target;
                // Comment selection
                if (target.classList.contains("uicm-comment-select")) {
                    const checkbox = target;
                    const row = checkbox.closest(".uicm-comment-row");
                    const commentId = row.dataset.commentId;
                    if (checkbox.checked) {
                        this.selectedComments.add(commentId);
                    }
                    else {
                        this.selectedComments.delete(commentId);
                    }
                    this.render();
                }
                // Delete single comment
                if (target.classList.contains("uicm-delete-comment")) {
                    const commentId = target.dataset.commentId;
                    this.deleteComment(commentId);
                }
            });
            // Delete selected
            const deleteSelected = this.element.querySelector(".uicm-delete-selected");
            deleteSelected.addEventListener("click", () => {
                this.deleteSelectedComments();
            });
            // Export CSV
            const exportExcel = this.element.querySelector(".uicm-export-excel");
            exportExcel.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                exportCommentsToCSV(this.filteredComments, "comments_export.csv", { separator: ";" }, (error) => {
                    alert("Export failed: " + error);
                });
            });
            // ESC key to close
            this.escHandler = (e) => {
                if (e.key === "Escape") {
                    this.props.onClose();
                }
            };
            document.addEventListener("keydown", this.escHandler, true);
            // Prevent event propagation outside modal (but allow close buttons to work)
            this.element.addEventListener("mousedown", (e) => {
                const target = e.target;
                // Allow close button and overlay clicks to bubble
                if (!target.classList.contains("uicm-comments-table-overlay") &&
                    !target.classList.contains("uicm-comments-table-close") &&
                    !target.classList.contains("uicm-allow-bubble")) {
                    e.stopPropagation();
                }
            }, true);
            this.element.addEventListener("click", (e) => {
                const target = e.target;
                // Allow close button and overlay clicks to bubble
                if (!target.classList.contains("uicm-comments-table-overlay") &&
                    !target.classList.contains("uicm-comments-table-close") &&
                    !target.classList.contains("uicm-allow-bubble")) {
                    e.stopPropagation();
                }
            }, true);
            this.element.addEventListener("keydown", (e) => {
                // Allow ESC to bubble for closing, block others
                if (e.key !== "Escape") {
                    e.stopPropagation();
                }
            }, true);
        }
        updateSortIndicators() {
            const headers = this.element.querySelectorAll(".sortable");
            headers.forEach((header) => {
                const indicator = header.querySelector(".sort-indicator");
                const key = header.getAttribute("data-key");
                if (key === this.sortConfig.key) {
                    indicator.textContent = this.sortConfig.direction === "asc" ? "↑" : "↓";
                }
                else {
                    indicator.textContent = "";
                }
            });
        }
        async deleteComment(commentId) {
            if (!window.confirm("Are you sure you want to delete this comment?"))
                return;
            try {
                // Gọi callback để xóa ở API/localStorage nếu có
                if (this.props.onDeleteComments) {
                    await this.props.onDeleteComments([commentId]);
                }
                // Xóa khỏi UI sau khi API thành công hoặc nếu không có callback
                this.props.comments = this.props.comments.filter((c) => c.id !== commentId);
                this.filteredComments = this.filteredComments.filter((c) => c.id !== commentId);
                this.selectedComments.delete(commentId);
                this.render();
            }
            catch (error) {
                alert("Failed to delete comment from server/localStorage!");
                console.error(error);
            }
        }
        async deleteSelectedComments() {
            if (this.selectedComments.size === 0)
                return;
            if (confirm(`Are you sure you want to delete ${this.selectedComments.size} selected comments?`)) {
                await this.props.onDeleteComments(Array.from(this.selectedComments));
                this.selectedComments.clear();
                this.updateFilteredComments();
                this.render();
            }
        }
        getStatusColor(status) {
            switch (status) {
                case exports.CommentStatus.BUG:
                    return "#ef4444";
                case exports.CommentStatus.FEATURE_REQUEST:
                    return "#f59e0b";
                case exports.CommentStatus.DEV_COMPLETED:
                    return "#3b82f6";
                case exports.CommentStatus.DONE:
                    return "#10b981";
                case exports.CommentStatus.ARCHIVED:
                    return "#6b7280";
                default:
                    return "#6b7280";
            }
        }
        getStatusDisplayName(status) {
            switch (status) {
                case exports.CommentStatus.BUG:
                    return "Bug";
                case exports.CommentStatus.FEATURE_REQUEST:
                    return "Feature Request";
                case exports.CommentStatus.DEV_COMPLETED:
                    return "Dev Completed";
                case exports.CommentStatus.DONE:
                    return "Done";
                case exports.CommentStatus.ARCHIVED:
                    return "Archived";
                default:
                    return "Unknown";
            }
        }
        truncateText(text, maxLength) {
            if (text.length <= maxLength)
                return text;
            return text.substring(0, maxLength) + "...";
        }
        closeModal() {
            if (this.destroyed) {
                return;
            }
            this.destroyed = true;
            // Clean up event listeners first
            if (this.escHandler) {
                document.removeEventListener("keydown", this.escHandler);
                this.escHandler = null;
            }
            // Remove from DOM
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            // Call onClose callback
            try {
                this.props.onClose();
            }
            catch (error) {
                console.error("❌ Error in onClose callback:", error);
            }
        }
        getElement() {
            return this.element;
        }
        destroy() {
            if (this.destroyed) {
                return;
            }
            this.destroyed = true;
            if (this.escHandler) {
                document.removeEventListener("keydown", this.escHandler);
                this.escHandler = null;
            }
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            if (this.imageModal) {
                this.imageModal.destroy();
                this.imageModal = null;
            }
        }
    }
    function exportCommentsToCSV(comments, filename = "comments_export.csv", options = { separator: "," }, onError) {
        try {
            if (!comments || !Array.isArray(comments) || comments.length === 0) {
                const msg = "Không có dữ liệu hợp lệ để xuất!";
                onError?.(msg);
                alert(msg);
                return;
            }
            // Only export the required fields in the specified order
            const data = comments.map((c) => ({
                "Created Date": c?.createdAt
                    ? (() => {
                        const d = new Date(c.createdAt);
                        const pad = (n) => n.toString().padStart(2, "0");
                        return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(d.getDate())} ${pad(d.getMonth() + 1)} ${d.getFullYear()}`;
                    })()
                    : "",
                Content: c?.content ?? "",
                Name: c?.createdBy?.name ?? "",
                Role: typeof getRoleDisplayName === "function"
                    ? getRoleDisplayName(c?.createdBy?.role || "other")
                    : c?.createdBy?.role || "",
                Status: c?.status ?? "",
                Attachments: Array.isArray(c?.attachments)
                    ? c.attachments.map((a) => a.filename).join("; ")
                    : "",
                URL: c?.url ?? "",
            }));
            if (!data.length) {
                const msg = "Không có dữ liệu hợp lệ để xuất!";
                onError?.(msg);
                alert(msg);
                return;
            }
            const escapeCsvValue = (value) => {
                if (value == null)
                    return "";
                const str = String(value)
                    .replace(/"/g, '""')
                    .replace(/^([=+\-@])/g, "'$1");
                return `"${str.replace(/\n/g, " ")}"`;
            };
            const separator = options.separator || ",";
            const headers = [
                "Created Date",
                "Content",
                "Name",
                "Role",
                "Status",
                "Attachments",
                "URL",
            ];
            const csvRows = [headers.join(separator)];
            for (const row of data) {
                const values = headers.map((h) => escapeCsvValue(row[h]));
                csvRows.push(values.join(separator));
            }
            const BOM = "\uFEFF";
            const csvString = BOM + csvRows.join("\n");
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            const blobUrl = URL.createObjectURL(blob);
            const safeFilename = filename.endsWith(".csv")
                ? filename
                : `${filename}.csv`;
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = safeFilename;
            document.body.appendChild(a);
            a.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            a.click();
            document.body.removeChild(a);
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 5000);
        }
        catch (error) {
            const msg = "Lỗi khi xuất CSV: " +
                (error instanceof Error ? error.message : "Lỗi không xác định");
            onError?.(msg);
            alert(msg);
            console.error(error);
        }
    }

    class CommentsTableButton {
        constructor(props) {
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        createElement() {
            const button = document.createElement("button");
            button.className = `uicm-comments-table-btn uicm-comments-table-btn--${this.props.theme}`;
            button.setAttribute("aria-label", "Open Comments Table");
            button.title = "View All Comments in Table";
            if (this.props.isVisible !== true) {
                button.style.display = "none";
                button.style.opacity = "0";
                button.style.transform = "scale(0.8) translateY(20px)";
            }
            this.updateButtonContent(button);
            return button;
        }
        updateButtonContent(buttonElement) {
            buttonElement.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
        }
        updateContent() {
            if (this.element) {
                this.updateButtonContent(this.element);
            }
        }
        attachEventListeners() {
            this.element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.onClick();
            });
        }
        updateCommentsCount(count) {
            this.props.commentsCount = count;
            this.updateContent();
        }
        updateTheme(theme) {
            this.element.className = this.element.className.replace(/uicm-comments-table-btn--(light|dark)/, `uicm-comments-table-btn--${theme}`);
            this.props.theme = theme;
        }
        getElement() {
            return this.element;
        }
        destroy() {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
        setVisible(visible) {
            if (visible) {
                this.element.style.display = "flex";
                setTimeout(() => {
                    this.element.style.opacity = "1";
                    this.element.style.transform = "scale(1) translateY(0)";
                }, 10);
            }
            else {
                this.element.style.opacity = "0";
                this.element.style.transform = "scale(0.8) translateY(20px)";
                setTimeout(() => {
                    this.element.style.display = "none";
                }, 300);
            }
        }
    }

    class DebugIcon {
        constructor(props) {
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        createElement() {
            const icon = document.createElement("div");
            icon.className = "uicm-debug-icon";
            icon.setAttribute("data-uicm-element", "true");
            icon.style.position = "fixed";
            icon.style.right = "20px";
            icon.style.top = "20px";
            icon.style.width = "40px";
            icon.style.height = "40px";
            icon.style.borderRadius = "50%";
            icon.style.backgroundColor = this.props.isActive
                ? "rgba(255, 0, 0, 0.8)"
                : "rgba(0, 0, 0, 0.5)";
            icon.style.display = "flex";
            icon.style.alignItems = "center";
            icon.style.justifyContent = "center";
            icon.style.cursor = "pointer";
            icon.style.transition = "all 0.3s ease";
            icon.style.zIndex = "999999";
            icon.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
            icon.style.pointerEvents = "auto";
            // Add hover effect
            icon.addEventListener("mouseenter", () => {
                icon.style.transform = "scale(1.1)";
                icon.style.backgroundColor = this.props.isActive
                    ? "rgba(255, 0, 0, 1)"
                    : "rgba(0, 0, 0, 0.8)";
            });
            icon.addEventListener("mouseleave", () => {
                icon.style.transform = "scale(1)";
                icon.style.backgroundColor = this.props.isActive
                    ? "rgba(255, 0, 0, 0.8)"
                    : "rgba(0, 0, 0, 0.5)";
            });
            icon.innerHTML = this.getIconHTML();
            return icon;
        }
        getIconHTML() {
            if (this.props.isActive) {
                return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
            }
            else {
                return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
      `;
            }
        }
        attachEventListeners() {
            this.element.addEventListener("click", (e) => {
                e.stopPropagation();
                this.props.onClick();
            });
            // Add tooltip functionality
            let tooltip = null;
            this.element.addEventListener("mouseenter", () => {
                tooltip = this.createTooltip();
                document.body.appendChild(tooltip);
            });
            this.element.addEventListener("mouseleave", () => {
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });
        }
        createTooltip() {
            const tooltip = document.createElement("div");
            tooltip.className = "uicm-tooltip";
            tooltip.setAttribute("data-uicm-element", "true");
            const iconRect = this.element.getBoundingClientRect();
            tooltip.style.left = `${iconRect.right + 8}px`;
            tooltip.style.top = `${iconRect.top + iconRect.height / 2 - 12}px`;
            return tooltip;
        }
        updateState(isActive) {
            this.props.isActive = isActive;
            this.element.className = "uicm-debug-icon";
            // Update background color based on active state
            this.element.style.backgroundColor = this.props.isActive
                ? "rgba(255, 0, 0, 0.8)"
                : "rgba(0, 0, 0, 0.5)";
            this.element.innerHTML = this.getIconHTML();
        }
        updateTheme(theme) {
            this.props.theme = theme;
        }
        getElement() {
            return this.element;
        }
        destroy() {
            // Remove any existing tooltips
            const tooltips = document.querySelectorAll(".uicm-tooltip");
            tooltips.forEach((tooltip) => tooltip.remove());
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    class HybridCommentStorage {
        // Load comments từ cả localStorage và file JSON
        static async loadComments() {
            try {
                // Load từ localStorage trước
                const localComments = this.loadFromLocalStorage();
                // Load từ file JSON
                const fileComments = await this.loadFromJsonFile();
                // Merge comments (localStorage có priority)
                const mergedComments = this.mergeComments(localComments, fileComments);
                return mergedComments;
            }
            catch (error) {
                return [];
            }
        }
        // Load từ localStorage
        static loadFromLocalStorage() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    return data.comments || [];
                }
            }
            catch (error) { }
            return [];
        }
        // Load từ file JSON
        static async loadFromJsonFile() {
            try {
                // Trong environment development, có thể load từ file
                const isDevelopment = typeof window !== "undefined" &&
                    window.location.hostname === "localhost";
                if (isDevelopment) {
                    const response = await fetch(this.JSON_FILE_PATH);
                    if (response.ok) {
                        const data = await response.json();
                        return data.comments || [];
                    }
                }
            }
            catch (error) { }
            return [];
        }
        // Merge comments từ hai nguồn
        static mergeComments(localComments, fileComments) {
            const commentMap = new Map();
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
        static async saveComments(comments) {
            try {
                // Save vào localStorage
                this.saveToLocalStorage(comments);
                // Save vào file JSON (development only)
                await this.saveToJsonFile(comments);
            }
            catch (error) { }
        }
        // Save vào localStorage
        static saveToLocalStorage(comments) {
            try {
                const data = {
                    comments,
                    lastUpdated: new Date().toISOString(),
                    source: "hybrid-storage",
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            }
            catch (error) { }
        }
        // Save vào file JSON (development only)
        static async saveToJsonFile(comments) {
            try {
                const isDevelopment = typeof window !== "undefined" &&
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
                    // Tự động download file
                    this.downloadJsonFile(jsonString);
                }
            }
            catch (error) { }
        }
        // Download JSON file
        static downloadJsonFile(jsonString) {
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
            }
            catch (error) { }
        }
        // Add new comment
        static async addComment(comment) {
            const comments = await this.loadComments();
            const newComment = {
                ...comment,
                id: this.generateId(),
                createdAt: new Date().toISOString(),
            };
            comments.push(newComment);
            await this.saveComments(comments);
            return newComment;
        }
        // Update comment
        static async updateComment(updatedComment) {
            const comments = await this.loadComments();
            const index = comments.findIndex((c) => c.id === updatedComment.id);
            if (index !== -1) {
                comments[index] = updatedComment;
                await this.saveComments(comments);
            }
            return updatedComment;
        }
        // Delete comment
        static async deleteComment(commentId) {
            const comments = await this.loadComments();
            const filteredComments = comments.filter((c) => c.id !== commentId);
            await this.saveComments(filteredComments);
        }
        // Update user name in all comments
        static async updateUserNameInAllComments(userId, newName) {
            const comments = await this.loadComments();
            let hasChanges = false;
            // Update main comments
            for (const comment of comments) {
                if (comment.createdBy.id === userId) {
                    comment.createdBy.name = newName;
                    hasChanges = true;
                }
                // Update replies
                for (const reply of comment.replies) {
                    if (reply.createdBy.id === userId) {
                        reply.createdBy.name = newName;
                        hasChanges = true;
                    }
                }
            }
            // Save only if there were changes
            if (hasChanges) {
                await this.saveComments(comments);
            }
        }
        // Get comments for URL
        static async getCommentsForUrl(url) {
            const allComments = await this.loadComments();
            return allComments.filter((comment) => comment.url === url);
        }
        // Generate unique ID
        static generateId() {
            return ("comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
        }
        // Clear all comments
        static async clearAllComments() {
            localStorage.removeItem(this.STORAGE_KEY);
            await this.saveComments([]);
        }
        // Sync từ localStorage lên file JSON
        static async syncToFile() {
            const localComments = this.loadFromLocalStorage();
            await this.saveToJsonFile(localComments);
        }
        // Import từ file JSON vào localStorage
        static async importFromFile() {
            const fileComments = await this.loadFromJsonFile();
            this.saveToLocalStorage(fileComments);
        }
    }
    HybridCommentStorage.STORAGE_KEY = "uicm-comments";
    HybridCommentStorage.JSON_FILE_PATH = "/src/storage/comments.json";

    class ProfileSettingsModal {
        constructor(props) {
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        createElement() {
            const modal = document.createElement("div");
            modal.className = "uicm-profile-modal";
            modal.innerHTML = `
      <div class="uicm-profile-modal-overlay"></div>
      <div class="uicm-profile-modal-content">
        <div class="uicm-profile-modal-header">
          <h3 class="uicm-profile-modal-title">Profile Settings</h3>
          <button class="uicm-profile-modal-close" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="uicm-profile-modal-body">
          <div class="uicm-profile-avatar-section">
            <div class="uicm-profile-avatar">
              <span class="uicm-profile-avatar-text">${this.props.currentUser.name
            .charAt(0)
            .toUpperCase()}</span>
            </div>
            <div class="uicm-profile-avatar-info">
              <p class="uicm-profile-avatar-label">Profile Picture</p>
              <p class="uicm-profile-avatar-subtitle">Avatar will be generated from your name</p>
            </div>
          </div>

          <form class="uicm-profile-form">
            <div class="uicm-form-group">
              <label class="uicm-form-label" for="profile-name">Name</label>
              <input 
                type="text" 
                id="profile-name" 
                class="uicm-form-input" 
                value="${this.props.currentUser.name}"
                placeholder="Enter your name"
                maxlength="50"
              />
              <div class="uicm-form-help">This name will be displayed on your comments</div>
            </div>

            <div class="uicm-form-group">
              <label class="uicm-form-label" for="profile-role">Role</label>
              <select id="profile-role" class="uicm-form-select">
                <option value="developer" ${this.props.currentUser.role === "developer" ? "selected" : ""}>Developer</option>
                <option value="designer" ${this.props.currentUser.role === "designer" ? "selected" : ""}>Designer</option>
                <option value="product-manager" ${this.props.currentUser.role === "product-manager"
            ? "selected"
            : ""}>Product Manager</option>
                <option value="qa" ${this.props.currentUser.role === "qa" ? "selected" : ""}>QA Tester</option>
                <option value="stakeholder" ${this.props.currentUser.role === "stakeholder"
            ? "selected"
            : ""}>Stakeholder</option>
                <option value="other" ${this.props.currentUser.role === "other" ? "selected" : ""}>Other</option>
              </select>
              <div class="uicm-form-help">Your role helps others understand your perspective</div>
            </div>
          </form>
        </div>

        <div class="uicm-profile-modal-footer">
          <button class="uicm-btn uicm-btn-secondary" type="button">Cancel</button>
          <button class="uicm-btn uicm-btn-primary" type="button">Save Changes</button>
        </div>
      </div>
    `;
            return modal;
        }
        attachEventListeners() {
            // Prevent modal from closing when clicking inside modal content
            const modalContent = this.element.querySelector(".uicm-profile-modal-content");
            if (modalContent) {
                modalContent.addEventListener("click", (e) => {
                    e.stopPropagation();
                });
            }
            // Close button
            const closeBtn = this.element.querySelector(".uicm-profile-modal-close");
            if (closeBtn) {
                closeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.props.onClose();
                });
            }
            // Cancel button
            const cancelBtn = this.element.querySelector(".uicm-btn-secondary");
            if (cancelBtn) {
                cancelBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.props.onClose();
                });
            }
            // Save button
            const saveBtn = this.element.querySelector(".uicm-btn-primary");
            if (saveBtn) {
                saveBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    await this.handleSave();
                });
            }
            // Close on overlay click
            const overlay = this.element.querySelector(".uicm-profile-modal-overlay");
            if (overlay) {
                overlay.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.props.onClose();
                });
            }
            // Prevent clicks inside modal from bubbling
            this.element.addEventListener("click", (e) => {
                e.stopPropagation();
            });
            // Prevent other events from bubbling
            this.element.addEventListener("mousedown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("mouseup", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keydown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keyup", (e) => {
                e.stopPropagation();
            });
            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === "Escape") {
                    this.props.onClose();
                }
            };
            document.addEventListener("keydown", handleEscape);
            // Clean up escape listener when modal is destroyed
            this.element.addEventListener("remove", () => {
                document.removeEventListener("keydown", handleEscape);
            });
            // Update avatar when name changes
            const nameInput = this.element.querySelector("#profile-name");
            const avatarText = this.element.querySelector(".uicm-profile-avatar-text");
            if (nameInput && avatarText) {
                nameInput.addEventListener("input", (e) => {
                    e.stopPropagation();
                    const name = nameInput.value.trim();
                    if (name) {
                        avatarText.textContent = name.charAt(0).toUpperCase();
                    }
                    else {
                        avatarText.textContent = this.props.currentUser.name
                            .charAt(0)
                            .toUpperCase();
                    }
                });
            }
        }
        async handleSave() {
            const nameInput = this.element.querySelector("#profile-name");
            const roleSelect = this.element.querySelector("#profile-role");
            const saveBtn = this.element.querySelector(".uicm-btn-primary");
            if (!nameInput || !roleSelect || !saveBtn)
                return;
            const name = nameInput.value.trim();
            const role = roleSelect.value;
            if (!name) {
                // Show error
                nameInput.classList.add("uicm-form-input-error");
                return;
            }
            // Remove error state
            nameInput.classList.remove("uicm-form-input-error");
            // Disable save button
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";
            try {
                const updatedUser = {
                    ...this.props.currentUser,
                    name,
                    role: role, // Type assertion for role
                };
                // Check if name has changed
                const nameChanged = this.props.currentUser.name !== name;
                // Update profile first
                await this.props.onSave(updatedUser);
                // If name changed, update all comments
                if (nameChanged) {
                    await HybridCommentStorage.updateUserNameInAllComments(this.props.currentUser.id, name);
                }
                this.props.onClose();
            }
            catch (error) {
                saveBtn.disabled = false;
                saveBtn.textContent = "Save Changes";
            }
        }
        getElement() {
            return this.element;
        }
        destroy() {
            // Remove escape listener
            const handleEscape = (e) => {
                if (e.key === "Escape") {
                    this.props.onClose();
                }
            };
            document.removeEventListener("keydown", handleEscape);
            this.element.remove();
        }
    }

    const USER_PROFILE_KEY = "uicm-user-profile";
    class LocalUserProfileStorage {
        constructor(storageKey = USER_PROFILE_KEY) {
            this.storageKey = storageKey;
        }
        saveUserProfile(user) {
            try {
                const userData = JSON.stringify(user);
                localStorage.setItem(this.storageKey, userData);
            }
            catch (error) {
                // console.error("Failed to save user profile to localStorage:", error);
            }
        }
        loadUserProfile() {
            try {
                const userData = localStorage.getItem(this.storageKey);
                if (!userData) {
                    return null;
                }
                const user = JSON.parse(userData);
                return user;
            }
            catch (error) {
                // console.error("Failed to load user profile from localStorage:", error);
                return null;
            }
        }
        clearUserProfile() {
            try {
                localStorage.removeItem(this.storageKey);
            }
            catch (error) {
                // console.error("Failed to clear user profile from localStorage:", error);
            }
        }
        updateUserProfile(updates) {
            try {
                const currentUser = this.loadUserProfile();
                if (!currentUser) {
                    return null;
                }
                const updatedUser = {
                    ...currentUser,
                    ...updates,
                };
                this.saveUserProfile(updatedUser);
                return updatedUser;
            }
            catch (error) {
                // console.error("Failed to update user profile in localStorage:", error);
                return null;
            }
        }
    }
    // Default instance
    const userProfileStorage = new LocalUserProfileStorage();

    class SettingsButton {
        constructor(props) {
            this.profileModal = null;
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        createElement() {
            const button = document.createElement("button");
            button.className = "uicm-settings-button";
            button.type = "button";
            button.title = "Profile Settings";
            button.style.display = this.props.isVisible === true ? "flex" : "none";
            if (this.props.isVisible !== true) {
                button.style.opacity = "0";
                button.style.transform = "scale(0.8) translateY(20px)";
            }
            // Use a simple gear icon with CSS
            button.innerHTML = `
      <div class="uicm-settings-icon">
        <div class="uicm-gear-icon">⚙</div>
      </div>
    `;
            return button;
        }
        attachEventListeners() {
            this.element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openProfileSettings();
            });
        }
        openProfileSettings() {
            // Close existing modal if any
            if (this.profileModal) {
                this.profileModal.destroy();
                this.profileModal = null;
            }
            // Create and show profile settings modal
            this.profileModal = new ProfileSettingsModal({
                currentUser: this.props.currentUser,
                onSave: async (updatedUser) => {
                    // Save to localStorage first
                    userProfileStorage.saveUserProfile(updatedUser);
                    // Then update in SDK
                    await this.props.onUserUpdate(updatedUser);
                    // Update current user in props
                    this.props.currentUser = updatedUser;
                    console.log("✅ Profile saved to localStorage and updated in SDK");
                },
                onClose: () => {
                    if (this.profileModal) {
                        this.profileModal.destroy();
                        this.profileModal = null;
                    }
                },
            });
            // Add modal to body
            document.body.appendChild(this.profileModal.getElement());
        }
        getElement() {
            return this.element;
        }
        setVisible(visible) {
            if (visible) {
                this.element.style.display = "flex";
                // Trigger animation by removing and re-adding the element
                setTimeout(() => {
                    this.element.style.opacity = "1";
                    this.element.style.transform = "scale(1) translateY(0)";
                }, 10);
            }
            else {
                this.element.style.opacity = "0";
                this.element.style.transform = "scale(0.8) translateY(20px)";
                setTimeout(() => {
                    this.element.style.display = "none";
                }, 300); // Match transition duration
            }
        }
        destroy() {
            if (this.profileModal) {
                this.profileModal.destroy();
                this.profileModal = null;
            }
            this.element.remove();
        }
    }

    class SidebarButton {
        constructor(props) {
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        createElement() {
            const button = document.createElement("button");
            button.className = "uicm-sidebar-button";
            button.type = "button";
            button.title = "View All Comments";
            button.style.display = this.props.isVisible === true ? "flex" : "none";
            if (this.props.isVisible !== true) {
                button.style.opacity = "0";
                button.style.transform = "scale(0.8) translateY(20px)";
            }
            // Use a list icon
            button.innerHTML = `
      <div class="uicm-sidebar-icon">
        <div class="uicm-list-icon">📋</div>
      </div>
    `;
            return button;
        }
        attachEventListeners() {
            this.element.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.onClick();
            });
        }
        getElement() {
            return this.element;
        }
        setVisible(visible) {
            if (visible) {
                this.element.style.display = "flex";
                // Trigger animation by removing and re-adding the element
                setTimeout(() => {
                    this.element.style.opacity = "1";
                    this.element.style.transform = "scale(1) translateY(0)";
                }, 10);
            }
            else {
                this.element.style.opacity = "0";
                this.element.style.transform = "scale(0.8) translateY(20px)";
                setTimeout(() => {
                    this.element.style.display = "none";
                }, 300); // Match transition duration
            }
        }
        updateUser(user) {
            this.props.currentUser = user;
            // Sidebar button doesn't display user info, so no UI update needed
        }
        destroy() {
            this.element.remove();
        }
    }

    class CommentBubble {
        constructor(props) {
            this.modal = null;
            this.imageModal = null;
            this.handleClick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Get click position from mouse event
                const mouseEvent = e;
                const clickPosition = {
                    x: mouseEvent.clientX || this.props.position.x,
                    y: mouseEvent.clientY || this.props.position.y,
                };
                this.showModal(clickPosition);
            };
            this.props = props;
            this.element = this.createElement();
            this.attachEventListeners();
        }
        checkBubbleVisibility() {
            const rect = this.element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Check what element is at the bubble's center point
            document.elementFromPoint(centerX, centerY);
        }
        testBubbleClickability() {
            const rect = this.element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            // Check what element is at the bubble's center point
            document.elementFromPoint(centerX, centerY);
            // Try to trigger a click programmatically to test
            this.element.click();
        }
        getStatusColor() {
            switch (this.props.comment.status) {
                case exports.CommentStatus.BUG:
                    return { bg: "#dc3545", border: "#c82333", text: "white" }; // Red
                case exports.CommentStatus.FEATURE_REQUEST:
                    return { bg: "#ffc107", border: "#e0a800", text: "black" }; // Yellow
                case exports.CommentStatus.DEV_COMPLETED:
                    return { bg: "#3b82f6", border: "#2066b3", text: "white" }; // Blue
                case exports.CommentStatus.DONE:
                    return { bg: "#28a745", border: "#1e7e34", text: "white" }; // Green
                case exports.CommentStatus.ARCHIVED:
                    return { bg: "#6c757d", border: "#545b62", text: "white" }; // Gray
                default:
                    return { bg: "#007bff", border: "#0056b3", text: "white" }; // Default blue
            }
        }
        createElement() {
            const bubble = document.createElement("div");
            bubble.className = "uicm-comment-bubble";
            bubble.style.position = "absolute";
            bubble.style.left = `${this.props.position.x}px`;
            bubble.style.top = `${this.props.position.y}px`;
            bubble.style.width = "32px";
            bubble.style.height = "32px";
            bubble.style.borderRadius = "50%";
            const colors = this.getStatusColor();
            bubble.style.backgroundColor = colors.bg;
            bubble.style.border = `2px solid ${colors.border}`;
            bubble.style.color = colors.text;
            bubble.style.cursor = "pointer";
            bubble.style.display = "flex";
            bubble.style.alignItems = "center";
            bubble.style.justifyContent = "center";
            bubble.style.fontSize = "16px";
            bubble.style.fontWeight = "bold";
            bubble.style.zIndex = "100"; // Relative to interaction layer which has z-index 2
            bubble.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
            bubble.style.transition = "all 0.2s ease";
            bubble.style.position = "relative";
            // Show chat icon instead of number
            bubble.innerHTML = "💬";
            // Create comment count badge
            const commentCount = 1 + (this.props.comment.replies?.length || 0);
            const countBadge = document.createElement("div");
            countBadge.className = "uicm-comment-count-badge";
            countBadge.textContent = commentCount.toString();
            countBadge.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      background: ${colors.bg};
      color: ${colors.text};
      border: 2px solid ${colors.border};
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      z-index: 101;
    `;
            bubble.appendChild(countBadge);
            // Add status and role tooltip
            const roleColors = getRoleColor(this.props.comment.role);
            bubble.title = `Status: ${this.props.comment.status.toUpperCase()} | Role: ${this.props.comment.role.toUpperCase()} | Comments: ${commentCount}`;
            // Add role indicator with color
            const roleIndicator = document.createElement("div");
            roleIndicator.className = "uicm-role-indicator";
            roleIndicator.style.cssText = `
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${roleColors.border};
      border: 1px solid white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      z-index: 102;
    `;
            bubble.appendChild(roleIndicator);
            return bubble;
        }
        attachEventListeners() {
            this.element.addEventListener("click", this.handleClick);
            this.element.addEventListener("mouseenter", () => {
                this.element.style.transform = "scale(1.1)";
            });
            this.element.addEventListener("mouseleave", () => {
                this.element.style.transform = "scale(1)";
            });
            // Listen for reply added events to refresh modal
            document.addEventListener("uicm-reply-added", (e) => {
                const customEvent = e;
                if (customEvent.detail.commentId === this.props.comment.id &&
                    this.modal) {
                    const updatedComments = [
                        this.props.comment,
                        ...this.props.comment.replies,
                    ];
                    this.modal.updateComments(updatedComments);
                }
            });
        }
        showModal(position) {
            // Destroy existing modal if any
            if (this.modal) {
                this.modal.destroy();
                this.modal = null;
            }
            // Get all comments for this element (main comment + replies)
            const allComments = [this.props.comment, ...this.props.comment.replies];
            // Calculate initial modal position
            const initialPosition = {
                x: position.x + 30,
                y: position.y,
            };
            // Create modal with initial position
            this.modal = new CommentModal({
                comments: allComments,
                currentUser: this.props.currentUser,
                position: initialPosition,
                onClose: () => {
                    if (this.modal) {
                        this.modal.destroy();
                        this.modal = null;
                    }
                },
                onAddReply: async (commentId, content, user, attachments) => {
                    await this.props.onReply(commentId, content, user, attachments);
                    // Update modal with refreshed comment data (including new reply)
                    if (this.modal) {
                        const updatedComments = [
                            this.props.comment,
                            ...this.props.comment.replies,
                        ];
                        this.modal.updateComments(updatedComments);
                    }
                    // Update comment count display
                    const commentCount = 1 + (this.props.comment.replies?.length || 0);
                    const countBadge = this.element.querySelector(".uicm-comment-count-badge");
                    if (countBadge) {
                        countBadge.textContent = commentCount.toString();
                    }
                    this.element.title = `Status: ${this.props.comment.status.toUpperCase()} | Comments: ${commentCount}`;
                },
                onStatusChange: async (commentId, status) => {
                    await this.props.onStatusChange(commentId, status);
                    // Update bubble appearance
                    this.updateBubbleAppearance();
                },
                onDeleteComment: async (commentId) => {
                    await this.props.onDelete(commentId);
                    // Update bubble appearance after deletion
                    this.updateBubbleAppearance();
                    // If this was the main comment being deleted, close modal
                    if (commentId === this.props.comment.id) {
                        if (this.modal) {
                            this.modal.destroy();
                            this.modal = null;
                        }
                    }
                },
            });
            // Use CommentManager for centralized modal management
            this.props.onShowModal(this.modal);
            // Add modal to interaction layer
            const interactionLayer = document.getElementById("uicm-interaction-layer");
            if (interactionLayer) {
                interactionLayer.appendChild(this.modal.getElement());
                // Reposition modal to ensure it stays within viewport
                this.modal.reposition();
            }
        }
        updateComment(comment) {
            this.props.comment = comment;
            this.updateBubbleAppearance();
            // Update modal if it exists and is open
            if (this.modal) {
                const updatedComments = [
                    this.props.comment,
                    ...this.props.comment.replies,
                ];
                this.modal.updateComments(updatedComments);
            }
        }
        updateUser(user) {
            this.props.currentUser = user;
            // Refresh modal if it's open
            if (this.modal) {
                this.modal.updateUser(user);
            }
        }
        updateBubbleAppearance() {
            const colors = this.getStatusColor();
            this.element.style.backgroundColor = colors.bg;
            this.element.style.border = `2px solid ${colors.border}`;
            this.element.style.color = colors.text;
            const commentCount = 1 + (this.props.comment.replies?.length || 0);
            // Update count badge
            const countBadge = this.element.querySelector(".uicm-comment-count-badge");
            if (countBadge) {
                countBadge.textContent = commentCount.toString();
                countBadge.style.background = colors.bg;
                countBadge.style.color = colors.text;
                countBadge.style.borderColor = colors.border;
            }
            // Update role indicator
            const roleIndicator = this.element.querySelector(".uicm-role-indicator");
            if (roleIndicator) {
                const roleColors = getRoleColor(this.props.comment.role);
                roleIndicator.style.background = roleColors.border;
            }
            this.element.title = `Status: ${this.props.comment.status.toUpperCase()} | Role: ${this.props.comment.role.toUpperCase()} | Comments: ${commentCount}`;
        }
        updatePosition(position) {
            this.props.position = position;
            this.element.style.left = `${position.x}px`;
            this.element.style.top = `${position.y}px`;
        }
        getElement() {
            return this.element;
        }
        destroy() {
            if (this.modal) {
                this.modal.destroy();
            }
            this.element.removeEventListener("click", this.handleClick);
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
        testClickability() {
            this.testBubbleClickability();
        }
    }

    class CommentForm {
        constructor(props) {
            this.isSubmitting = false;
            this.selectedAttachments = [];
            this.imageModal = null;
            this.props = props;
            this.element = this.createElement();
            this.setupEventListeners();
        }
        addFilePreview(attachment, container, onRemove) {
            // No limit on number of images
            const previewItem = document.createElement("div");
            previewItem.className = "uicm-file-preview-item";
            previewItem.style.position = "relative";
            if (attachment.type === "image") {
                const imagePreview = document.createElement("img");
                imagePreview.className = "uicm-file-preview-image";
                imagePreview.src = attachment.url;
                imagePreview.alt = attachment.filename;
                imagePreview.style.cursor = "pointer";
                // Add click handler to open image modal
                imagePreview.addEventListener("click", () => {
                    if (this.imageModal) {
                        this.imageModal.destroy();
                    }
                    this.imageModal = new ImageModal(attachment.url);
                    this.imageModal.show();
                });
                previewItem.appendChild(imagePreview);
            }
            else {
                const fileIcon = document.createElement("span");
                fileIcon.className = "uicm-file-preview-icon";
                fileIcon.innerHTML = "📎";
                previewItem.appendChild(fileIcon);
            }
            // Only show file size (not name or url)
            const fileSize = document.createElement("span");
            fileSize.className = "uicm-file-preview-size";
            fileSize.textContent = this.formatFileSize(attachment.size);
            previewItem.appendChild(fileSize);
            // Remove button absolutely positioned top right
            const removeButton = document.createElement("button");
            removeButton.className = "uicm-file-preview-remove";
            removeButton.innerHTML = "×";
            removeButton.type = "button";
            removeButton.style.position = "absolute";
            removeButton.style.top = "2px";
            removeButton.style.right = "2px";
            removeButton.style.zIndex = "2";
            removeButton.onclick = () => {
                previewItem.remove();
                onRemove();
            };
            previewItem.appendChild(removeButton);
            container.appendChild(previewItem);
        }
        formatFileSize(bytes) {
            if (bytes === 0)
                return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }
        createElement() {
            const form = document.createElement("div");
            form.className = "uicm-comment-form";
            form.style.position = "absolute";
            form.style.zIndex = "10000";
            // Temporarily add to DOM to get accurate dimensions
            document.body.appendChild(form);
            // Use center position instead of click position
            const centerPosition = getCenterPosition(form, { padding: 20 });
            // Set center position
            form.style.left = `${centerPosition.x}px`;
            form.style.top = `${centerPosition.y}px`;
            // Remove from DOM temporarily
            document.body.removeChild(form);
            // Header with improved layout
            const header = document.createElement("div");
            header.className = "uicm-form-header";
            // Header content container
            const headerContent = document.createElement("div");
            headerContent.className = "uicm-form-header-content";
            // Title section
            const titleSection = document.createElement("div");
            titleSection.className = "uicm-form-title-section";
            const title = document.createElement("h2");
            title.className = "uicm-form-title";
            title.textContent = "Add Comment";
            const subtitle = document.createElement("p");
            subtitle.className = "uicm-form-subtitle";
            subtitle.textContent = "Share your thoughts or feedback";
            titleSection.appendChild(title);
            titleSection.appendChild(subtitle);
            // Action buttons section
            const actionSection = document.createElement("div");
            actionSection.className = "uicm-form-action-section";
            // Close button with improved styling
            const closeButton = document.createElement("button");
            closeButton.className = "uicm-close-button";
            closeButton.innerHTML = "×";
            closeButton.setAttribute("aria-label", "Close comment form");
            closeButton.title = "Close";
            closeButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.props.onCancel();
            };
            actionSection.appendChild(closeButton);
            // Assemble header
            headerContent.appendChild(titleSection);
            headerContent.appendChild(actionSection);
            header.appendChild(headerContent);
            // Content area
            const content = document.createElement("div");
            content.className = "uicm-form-content";
            // User info section
            const userInfo = document.createElement("div");
            userInfo.className = "uicm-user-info";
            const avatar = document.createElement("div");
            avatar.className = "uicm-user-avatar";
            avatar.textContent = this.props.currentUser.name.charAt(0).toUpperCase();
            if (this.props.currentUser.avatar) {
                avatar.style.backgroundImage = `url(${this.props.currentUser.avatar})`;
                avatar.style.backgroundSize = "cover";
                avatar.textContent = "";
            }
            // Cache avatar element
            this.avatar = avatar;
            const userDetails = document.createElement("div");
            userDetails.className = "uicm-user-details";
            // Editable name input
            this.nameInput = document.createElement("input");
            this.nameInput.type = "text";
            this.nameInput.className = "uicm-user-name-input";
            this.nameInput.value = this.props.currentUser.name;
            this.nameInput.placeholder = "Your name";
            this.nameInput.maxLength = 50;
            userDetails.appendChild(this.nameInput);
            userInfo.appendChild(avatar);
            userInfo.appendChild(userDetails);
            // Textarea with enhanced features
            this.textarea = document.createElement("textarea");
            this.textarea.placeholder = "Write a comment...";
            this.textarea.className = "uicm-comment-textarea";
            this.textarea.rows = 3;
            // File upload section
            const fileUploadSection = document.createElement("div");
            fileUploadSection.className = "uicm-file-upload-section";
            const fileInput = document.createElement("input");
            fileInput.type = "file";
            fileInput.className = "uicm-file-input";
            fileInput.style.display = "none";
            fileInput.accept = "image/*,application/pdf,.doc,.docx,.txt,.zip,.rar";
            fileInput.multiple = true;
            const fileUploadButton = document.createElement("button");
            fileUploadButton.className = "uicm-file-upload-button";
            fileUploadButton.type = "button";
            fileUploadButton.innerHTML = "📎";
            fileUploadButton.onclick = () => fileInput.click();
            const filePreviewContainer = document.createElement("div");
            filePreviewContainer.className = "uicm-file-preview-container";
            // Handle file selection
            fileInput.addEventListener("change", async (e) => {
                const files = e.target.files;
                if (files) {
                    for (const file of Array.from(files)) {
                        try {
                            // Upload file using Base64UploadManager
                            const attachment = await base64UploadManager.uploadFile(file);
                            this.selectedAttachments.push(attachment);
                            this.addFilePreview(attachment, filePreviewContainer, () => {
                                this.selectedAttachments = this.selectedAttachments.filter((a) => a.id !== attachment.id);
                                this.updateSubmitButton();
                            });
                        }
                        catch (error) {
                            console.error("Failed to upload file:", error);
                            const errorMessage = error instanceof Error ? error.message : "Unknown error";
                            alert(`Failed to upload ${file.name}: ${errorMessage}`);
                        }
                    }
                    this.updateSubmitButton();
                }
            });
            fileUploadSection.appendChild(fileInput);
            fileUploadSection.appendChild(fileUploadButton);
            fileUploadSection.appendChild(filePreviewContainer);
            // Character counter
            this.charCounter = document.createElement("div");
            this.charCounter.className = "uicm-char-counter";
            this.charCounter.textContent = "0 / 1000";
            // Action buttons
            const actions = document.createElement("div");
            actions.className = "uicm-form-actions";
            // Secondary actions
            const secondaryActions = document.createElement("div");
            secondaryActions.className = "uicm-secondary-actions";
            const emojiButton = document.createElement("button");
            emojiButton.className = "uicm-emoji-button";
            emojiButton.innerHTML = "😊";
            emojiButton.setAttribute("aria-label", "Add emoji");
            emojiButton.type = "button";
            const mentionButton = document.createElement("button");
            mentionButton.className = "uicm-mention-button";
            mentionButton.innerHTML = "@";
            mentionButton.setAttribute("aria-label", "Mention someone");
            mentionButton.type = "button";
            secondaryActions.appendChild(emojiButton);
            secondaryActions.appendChild(mentionButton);
            // Primary actions
            const primaryActions = document.createElement("div");
            primaryActions.className = "uicm-primary-actions";
            this.submitButton = document.createElement("button");
            this.submitButton.className = "uicm-submit-button";
            this.submitButton.type = "button";
            this.updateSubmitButton();
            primaryActions.appendChild(this.submitButton);
            actions.appendChild(secondaryActions);
            actions.appendChild(primaryActions);
            // Create input container for textarea and file upload button (like reply form)
            const inputContainer = document.createElement("div");
            inputContainer.className = "uicm-form-input-container";
            // Add textarea and file upload button to input container
            inputContainer.appendChild(this.textarea);
            inputContainer.appendChild(fileUploadButton);
            inputContainer.appendChild(this.charCounter);
            // Restructure: file previews at top, input container in middle, actions at bottom
            content.appendChild(filePreviewContainer); // File previews at top
            content.appendChild(userInfo); // User info
            content.appendChild(inputContainer); // Input container (textarea + file upload button)
            content.appendChild(actions); // Actions at bottom
            form.appendChild(header);
            form.appendChild(content);
            return form;
        }
        setupEventListeners() {
            // Prevent form from closing when clicking inside form
            this.element.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log("🔒 Form internal click - prevented propagation");
            });
            // Prevent form from closing when interacting with form elements
            this.element.addEventListener("mousedown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("mouseup", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keydown", (e) => {
                e.stopPropagation();
            });
            this.element.addEventListener("keyup", (e) => {
                e.stopPropagation();
            });
            // Auto-resize textarea
            this.textarea.addEventListener("input", () => {
                this.textarea.style.height = "auto";
                this.textarea.style.height =
                    Math.min(this.textarea.scrollHeight, 200) + "px";
                this.updateCharCounter();
                this.updateSubmitButton();
            });
            // Handle paste events for images
            this.textarea.addEventListener("paste", async (e) => {
                const items = e.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        if (item.type.indexOf("image") !== -1) {
                            e.preventDefault();
                            const file = item.getAsFile();
                            if (file) {
                                // Show loading state
                                const originalPlaceholder = this.textarea.placeholder;
                                this.textarea.placeholder = "🔄 Processing image...";
                                this.textarea.disabled = true;
                                // Show loading indicator
                                const loadingIndicator = document.createElement("div");
                                loadingIndicator.className = "uicm-paste-loading";
                                loadingIndicator.innerHTML = `
                <div class="uicm-loading-spinner"></div>
                <span>Processing image: ${file.name}</span>
              `;
                                loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                color: #1e293b;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                z-index: 1000;
              `;
                                const spinner = loadingIndicator.querySelector(".uicm-loading-spinner");
                                spinner.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: uicm-spin 1s linear infinite;
              `;
                                this.element.appendChild(loadingIndicator);
                                try {
                                    const attachment = await base64UploadManager.uploadFile(file);
                                    this.selectedAttachments.push(attachment);
                                    // Find file preview container
                                    const filePreviewContainer = this.element.querySelector(".uicm-file-preview-container");
                                    if (filePreviewContainer) {
                                        this.addFilePreview(attachment, filePreviewContainer, () => {
                                            this.selectedAttachments =
                                                this.selectedAttachments.filter((a) => a.id !== attachment.id);
                                            this.updateSubmitButton();
                                        });
                                    }
                                    this.updateSubmitButton();
                                    console.log("📸 Image pasted and uploaded:", attachment.filename);
                                    // Show success message briefly
                                    loadingIndicator.innerHTML = `
                  <span style="color: #10b981;">✅</span>
                  <span>Image uploaded successfully!</span>
                `;
                                    setTimeout(() => {
                                        if (loadingIndicator.parentNode) {
                                            loadingIndicator.parentNode.removeChild(loadingIndicator);
                                        }
                                    }, 1000);
                                }
                                catch (error) {
                                    console.error("Failed to paste image:", error);
                                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                                    // Show error message
                                    loadingIndicator.innerHTML = `
                  <span style="color: #ef4444;">❌</span>
                  <span>Failed to upload: ${errorMessage}</span>
                `;
                                    setTimeout(() => {
                                        if (loadingIndicator.parentNode) {
                                            loadingIndicator.parentNode.removeChild(loadingIndicator);
                                        }
                                    }, 3000);
                                }
                                finally {
                                    // Restore input state
                                    this.textarea.placeholder = originalPlaceholder;
                                    this.textarea.disabled = false;
                                    this.textarea.focus();
                                }
                            }
                        }
                    }
                }
            });
            // Update avatar when name changes
            this.nameInput.addEventListener("input", () => {
                if (this.avatar && this.nameInput.value.trim()) {
                    this.avatar.textContent = this.nameInput.value
                        .trim()
                        .charAt(0)
                        .toUpperCase();
                }
                this.updateSubmitButton();
            });
            // Submit on Ctrl/Cmd + Enter
            this.textarea.addEventListener("keydown", (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    this.handleSubmit();
                }
            });
            // Focus textarea on mount - use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                this.textarea.focus();
            });
            // Submit button click
            this.submitButton.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleSubmit();
            };
        }
        updateCharCounter() {
            const length = this.textarea.value.length;
            const maxLength = 1000;
            this.charCounter.textContent = `${length} / ${maxLength}`;
            if (length > maxLength * 0.8) {
                this.charCounter.classList.add("uicm-warning");
            }
            else {
                this.charCounter.classList.remove("uicm-warning");
            }
            if (length > maxLength) {
                this.charCounter.classList.add("uicm-error");
            }
            else {
                this.charCounter.classList.remove("uicm-error");
            }
        }
        updateSubmitButton() {
            const content = this.textarea.value.trim();
            const userName = this.nameInput.value.trim();
            const hasContent = content.length > 0;
            const hasAttachments = this.selectedAttachments.length > 0;
            const isValid = (hasContent || hasAttachments) &&
                userName.length > 0 &&
                content.length <= 1000;
            this.submitButton.disabled = !isValid || this.isSubmitting;
            if (this.isSubmitting) {
                this.submitButton.innerHTML = `
        <div class="uicm-spinner"></div>
        <span>Posting...</span>
      `;
            }
            else {
                const shortcut = navigator.platform.includes("Mac") ? "⌘" : "Ctrl";
                this.submitButton.innerHTML = `
        <span>Submit</span>
        <kbd>${shortcut} + Enter</kbd>
      `;
            }
        }
        async handleSubmit() {
            const content = this.textarea.value.trim();
            const userName = this.nameInput.value.trim();
            const hasContent = content.length > 0;
            const hasAttachments = this.selectedAttachments.length > 0;
            if ((!hasContent && !hasAttachments) || !userName || content.length > 1000)
                return;
            this.isSubmitting = true;
            this.updateSubmitButton();
            try {
                await this.props.onSubmit(content, userName, this.selectedAttachments.length > 0
                    ? this.selectedAttachments
                    : undefined);
                // Clear form after successful submission
                this.textarea.value = "";
                this.selectedAttachments = [];
                // Clear file preview container
                const filePreviewContainer = this.element.querySelector(".uicm-file-preview-container");
                if (filePreviewContainer) {
                    filePreviewContainer.innerHTML = "";
                }
                // Clear file input
                const fileInput = this.element.querySelector(".uicm-file-input");
                if (fileInput) {
                    fileInput.value = "";
                }
                this.updateCharCounter();
                this.updateSubmitButton();
            }
            catch (error) {
                console.error("Failed to submit comment:", error);
                this.showError("Failed to post comment. Please try again.");
            }
            finally {
                this.isSubmitting = false;
                this.updateSubmitButton();
            }
        }
        showError(message) {
            // Remove existing error
            const existingError = this.element.querySelector(".uicm-error-message");
            if (existingError) {
                existingError.remove();
            }
            // Create new error message
            const errorDiv = document.createElement("div");
            errorDiv.className = "uicm-error-message";
            errorDiv.textContent = message;
            // Insert before actions
            const actions = this.element.querySelector(".uicm-form-actions");
            if (actions) {
                actions.parentNode?.insertBefore(errorDiv, actions);
            }
            // Auto-remove after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
        getElement() {
            return this.element;
        }
        reposition() {
            // Use center position instead of click position
            const centerPosition = getCenterPosition(this.element, { padding: 20 });
            // Apply center position
            this.element.style.position = "fixed";
            this.element.style.left = `${centerPosition.x}px`;
            this.element.style.top = `${centerPosition.y}px`;
            this.element.style.transform = "none";
        }
        destroy() {
            if (this.imageModal) {
                this.imageModal.destroy();
                this.imageModal = null;
            }
            this.element.remove();
        }
    }

    /**
     * Mobile utilities for touch interactions and responsive design
     */
    /**
     * Detects if the device supports touch
     */
    function isTouchDevice() {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    }
    /**
     * Detects if the device is mobile based on screen size and user agent
     */
    function isMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ["android", "iphone", "ipad", "mobile", "tablet"];
        const hasKeyword = mobileKeywords.some((keyword) => userAgent.includes(keyword));
        const hasSmallScreen = window.innerWidth <= 768;
        return hasKeyword || hasSmallScreen;
    }
    /**
     * Touch gesture recognizer
     */
    class TouchGestureRecognizer {
        constructor(element, options = {}) {
            this.isTracking = false;
            this.startTouch = null;
            this.lastTouch = null;
            this.SWIPE_THRESHOLD = 50; // minimum distance for swipe
            this.SWIPE_TIMEOUT = 500; // maximum time for swipe
            this.TAP_TIMEOUT = 300; // maximum time for tap
            this.LONG_PRESS_TIMEOUT = 500; // minimum time for long press
            this.longPressTimer = null;
            this.tapTimer = null;
            this.handleTouchStart = (e) => {
                if (e.touches.length === 1) {
                    // Single touch
                    const touch = e.touches[0];
                    this.startTouch = this.createTouchEventData(touch, e.target);
                    this.lastTouch = this.startTouch;
                    this.isTracking = true;
                    // Start long press timer
                    this.longPressTimer = window.setTimeout(() => {
                        if (this.isTracking && this.startTouch && this.onLongPress) {
                            this.onLongPress(this.startTouch);
                        }
                    }, this.LONG_PRESS_TIMEOUT);
                }
                else if (e.touches.length === 2 && this.onPinch) {
                    // Multi-touch for pinch
                    this.handlePinchStart(e);
                }
            };
            this.handleTouchMove = (e) => {
                if (!this.isTracking)
                    return;
                if (e.touches.length === 1) {
                    const touch = e.touches[0];
                    this.lastTouch = this.createTouchEventData(touch, e.target);
                    // Cancel long press on move
                    if (this.longPressTimer) {
                        clearTimeout(this.longPressTimer);
                        this.longPressTimer = null;
                    }
                    // Prevent default to avoid scrolling during gesture
                    e.preventDefault();
                }
                else if (e.touches.length === 2 && this.onPinch) {
                    this.handlePinchMove(e);
                }
            };
            this.handleTouchEnd = (e) => {
                if (!this.isTracking || !this.startTouch || !this.lastTouch)
                    return;
                this.isTracking = false;
                // Clear timers
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                const duration = this.lastTouch.timestamp - this.startTouch.timestamp;
                const distance = this.getDistance(this.startTouch, this.lastTouch);
                if (distance < this.SWIPE_THRESHOLD && duration < this.TAP_TIMEOUT) {
                    // Tap gesture
                    if (this.onTap) {
                        this.onTap(this.startTouch);
                    }
                }
                else if (distance >= this.SWIPE_THRESHOLD &&
                    duration < this.SWIPE_TIMEOUT) {
                    // Swipe gesture
                    if (this.onSwipe) {
                        const direction = this.getSwipeDirection(this.startTouch, this.lastTouch);
                        const gesture = {
                            direction,
                            distance,
                            duration,
                            startPoint: this.startTouch,
                            endPoint: this.lastTouch,
                        };
                        this.onSwipe(gesture);
                    }
                }
                this.startTouch = null;
                this.lastTouch = null;
            };
            this.handleTouchCancel = () => {
                this.isTracking = false;
                this.startTouch = null;
                this.lastTouch = null;
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            };
            this.element = element;
            this.onSwipe = options.onSwipe;
            this.onTap = options.onTap;
            this.onLongPress = options.onLongPress;
            this.onPinch = options.onPinch;
            this.attachEventListeners();
        }
        attachEventListeners() {
            this.element.addEventListener("touchstart", this.handleTouchStart, {
                passive: false,
            });
            this.element.addEventListener("touchmove", this.handleTouchMove, {
                passive: false,
            });
            this.element.addEventListener("touchend", this.handleTouchEnd, {
                passive: false,
            });
            this.element.addEventListener("touchcancel", this.handleTouchCancel, {
                passive: false,
            });
        }
        handlePinchStart(e) {
            // Implement pinch gesture logic if needed
            // For now, just prevent default
            e.preventDefault();
        }
        handlePinchMove(e) {
            // Implement pinch gesture logic if needed
            e.preventDefault();
        }
        createTouchEventData(touch, target) {
            return {
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now(),
                target,
            };
        }
        getDistance(start, end) {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        getSwipeDirection(start, end) {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? "right" : "left";
            }
            else {
                return dy > 0 ? "down" : "up";
            }
        }
        destroy() {
            this.element.removeEventListener("touchstart", this.handleTouchStart);
            this.element.removeEventListener("touchmove", this.handleTouchMove);
            this.element.removeEventListener("touchend", this.handleTouchEnd);
            this.element.removeEventListener("touchcancel", this.handleTouchCancel);
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
            }
            if (this.tapTimer) {
                clearTimeout(this.tapTimer);
            }
        }
    }
    /**
     * Mobile-specific CSS utilities
     */
    function addMobileCSS() {
        if (document.getElementById("uicm-mobile-styles"))
            return;
        const style = document.createElement("style");
        style.id = "uicm-mobile-styles";
        style.textContent = `
    @media (max-width: 768px) {
      .uicm-comment-form {
        width: calc(100vw - 32px) !important;
        max-width: none !important;
        min-width: 280px !important;
      }
      
      .uicm-comment-bubble {
        min-width: 40px !important;
        min-height: 40px !important;
        font-size: 14px !important;
      }
      
      .uicm-comment-popup {
        width: calc(100vw - 32px) !important;
        max-width: none !important;
        max-height: calc(100vh - 64px) !important;
        overflow-y: auto !important;
      }
      
      .uicm-textarea {
        font-size: 16px !important; /* Prevents zoom on iOS */
        min-height: 80px !important;
      }
      
      .uicm-btn {
        min-height: 44px !important; /* iOS touch target size */
        padding: 12px 20px !important;
        font-size: 16px !important;
      }
      
      .uicm-form-actions {
        gap: 12px !important;
      }
      
      .uicm-form-help {
        font-size: 14px !important;
        padding: 8px !important;
      }
    }
    
    @media (max-width: 480px) {
      .uicm-comment-form {
        width: calc(100vw - 16px) !important;
      }
      
      .uicm-comment-popup {
        width: calc(100vw - 16px) !important;
        max-height: calc(100vh - 32px) !important;
      }
      
      .uicm-form-actions {
        flex-direction: column !important;
      }
      
      .uicm-btn {
        width: 100% !important;
      }
    }
    
    /* Touch-friendly improvements */
    .uicm-comment-bubble {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
    }
    
    .uicm-btn {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
    }
    
    .uicm-textarea {
      -webkit-tap-highlight-color: transparent !important;
      touch-action: manipulation !important;
    }
    
    /* Prevent zooming on inputs */
    .uicm-textarea,
    .uicm-input {
      font-size: 16px !important;
    }
  `;
        document.head.appendChild(style);
    }
    /**
     * Removes mobile-specific CSS
     */
    function removeMobileCSS() {
        const style = document.getElementById("uicm-mobile-styles");
        if (style) {
            style.remove();
        }
    }

    /**
     * Throttle function - limits function execution to once per specified interval
     */
    function throttle(func, delay) {
        let lastCall = 0;
        let timeout = null;
        return ((...args) => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                func(...args);
            }
            else if (!timeout) {
                timeout = window.setTimeout(() => {
                    lastCall = Date.now();
                    timeout = null;
                    func(...args);
                }, delay - (now - lastCall));
            }
        });
    }
    /**
     * Request animation frame throttle for smooth animations
     */
    function rafThrottle(func) {
        let rafId = null;
        return ((...args) => {
            if (rafId) {
                return;
            }
            rafId = requestAnimationFrame(() => {
                rafId = null;
                func(...args);
            });
        });
    }
    /**
     * Intersection Observer utility for efficient element visibility tracking
     */
    class VisibilityObserver {
        constructor(options = {}) {
            this.callbacks = new Map();
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const callback = this.callbacks.get(entry.target);
                    if (callback) {
                        callback(entry.isIntersecting);
                    }
                });
            }, options);
        }
        observe(element, callback) {
            this.callbacks.set(element, callback);
            this.observer.observe(element);
        }
        unobserve(element) {
            this.callbacks.delete(element);
            this.observer.unobserve(element);
        }
        disconnect() {
            this.callbacks.clear();
            this.observer.disconnect();
        }
    }
    /**
     * Efficient event batching for high-frequency events
     */
    class EventBatcher {
        constructor() {
            this.queue = [];
            this.isProcessing = false;
        }
        add(callback) {
            this.queue.push(callback);
            if (!this.isProcessing) {
                this.process();
            }
        }
        process() {
            if (this.queue.length === 0) {
                this.isProcessing = false;
                return;
            }
            this.isProcessing = true;
            requestAnimationFrame(() => {
                const callbacks = this.queue.splice(0);
                callbacks.forEach((callback) => callback());
                this.process();
            });
        }
    }
    /**
     * Memory-efficient cache with LRU eviction
     */
    class LRUCache {
        constructor(maxSize = 100) {
            this.cache = new Map();
            this.maxSize = maxSize;
        }
        get(key) {
            const value = this.cache.get(key);
            if (value !== undefined) {
                // Move to end (most recently used)
                this.cache.delete(key);
                this.cache.set(key, value);
            }
            return value;
        }
        set(key, value) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
            }
            else if (this.cache.size >= this.maxSize) {
                // Remove least recently used (first item)
                const firstKey = this.cache.keys().next().value;
                if (firstKey !== undefined) {
                    this.cache.delete(firstKey);
                }
            }
            this.cache.set(key, value);
        }
        clear() {
            this.cache.clear();
        }
    }

    /**
     * Generate a stable XPath for a DOM element
     */
    function getElementXPath(element) {
        if (element.id !== "") {
            return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
            return "/html/body";
        }
        let ix = 0;
        const siblings = element.parentNode?.childNodes || [];
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                const tagName = element.tagName.toLowerCase();
                const parent = element.parentElement;
                if (parent) {
                    const parentXPath = getElementXPath(parent);
                    return `${parentXPath}/${tagName}[${ix + 1}]`;
                }
                return `/${tagName}[${ix + 1}]`;
            }
            if (sibling.nodeType === 1 &&
                sibling.tagName === element.tagName) {
                ix++;
            }
        }
        throw new Error("Unable to generate XPath for element");
    }
    /**
     * Get element by XPath
     */
    function getElementByXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        }
        catch (error) {
            console.warn("Failed to resolve XPath:", xpath, error);
            return null;
        }
    }
    /**
     * Validate if an element still exists and is visible
     */
    function isElementValid(element) {
        const htmlElement = element;
        return (element.isConnected &&
            htmlElement.offsetParent !== null &&
            getComputedStyle(element).display !== "none" &&
            getComputedStyle(element).visibility !== "hidden");
    }

    function normalizeUrl$1(url) {
        try {
            const u = new URL(url);
            u.hash = "";
            let norm = u.origin + u.pathname;
            if (norm.endsWith("/"))
                norm = norm.slice(0, -1);
            return norm;
        }
        catch {
            return url;
        }
    }
    class CommentManager {
        constructor(config, root) {
            this.comments = [];
            this.commentBubbles = new Map();
            this.activeForm = null;
            this.activeModal = null; // For comment modals
            this.activeOverlay = null; // For event blocking
            this.mode = "normal";
            this.mutationTimeout = undefined;
            this.escKeyHandler = null;
            this.throttledUpdatePositions = throttle(() => {
                this.updateBubblePositions();
            }, 100);
            this.rafUpdatePositions = rafThrottle(() => {
                this.updateBubblePositions();
            });
            this.touchGestureRecognizer = null;
            this.debouncedUpdatePositions = debounce(() => {
                this.updateBubblePositions();
            }, 100);
            this.handleElementClick = (e) => {
                if (this.mode !== "comment") {
                    return;
                }
                // Check if we're navigating from sidebar (prevent form opening)
                if (window.uicmIsNavigatingFromSidebar) {
                    return;
                }
                const mouseEvent = e;
                const clickTarget = e.target;
                // Check if click is on a comment bubble - let bubble handle it
                if (clickTarget.classList.contains("uicm-comment-bubble") ||
                    clickTarget.closest(".uicm-comment-bubble")) {
                    return;
                }
                // Check if click is inside form layer or any SDK element
                const formLayer = document.querySelector(".uicm-comment-form");
                if (formLayer && formLayer.contains(clickTarget)) {
                    return;
                }
                // Temporarily hide all SDK elements
                const sdkElements = document.querySelectorAll("[data-uicm-element]");
                const originalDisplay = [];
                sdkElements.forEach((el, index) => {
                    const htmlEl = el;
                    originalDisplay[index] = htmlEl.style.display;
                    htmlEl.style.display = "none";
                });
                // Get the actual element under the click point
                const target = document.elementFromPoint(mouseEvent.clientX, mouseEvent.clientY);
                // Restore SDK elements
                sdkElements.forEach((el, index) => {
                    const htmlEl = el;
                    htmlEl.style.display = originalDisplay[index];
                });
                // Ignore if no target found or if it's an SDK element
                if (!target || target.closest("[data-uicm-element]")) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                const { position, relativePosition } = getCommentPositionFromClick(target, {
                    clientX: mouseEvent.clientX,
                    clientY: mouseEvent.clientY,
                });
                this.showCommentForm(target, position, relativePosition);
            };
            this.handleElementMouseEnter = (e) => {
                // Only process highlights in comment mode
                if (this.mode !== "comment") {
                    return;
                }
                const target = e.target;
                if (!(target instanceof HTMLElement))
                    return;
                if (target.hasAttribute("data-uicm-element"))
                    return;
                const highlightLayer = document.getElementById("uicm-highlight-layer");
                if (!highlightLayer)
                    return;
                const rect = target.getBoundingClientRect();
                const highlight = document.createElement("div");
                highlight.className = "uicm-highlight";
                highlight.style.position = "absolute";
                highlight.style.top = `${rect.top}px`;
                highlight.style.left = `${rect.left}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
                // highlight.style.border = "2px solid rgba(255, 0, 0, 0.5)";
                // highlight.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
                highlight.style.pointerEvents = "none";
                highlightLayer.appendChild(highlight);
                // Store the highlight element for removal
                target.dataset.uicmHighlight = highlight.id = generateId();
            };
            this.handleElementMouseLeave = (e) => {
                // Only process highlights in comment mode
                if (this.mode !== "comment") {
                    return;
                }
                const target = e.target;
                if (!(target instanceof HTMLElement))
                    return;
                if (target.hasAttribute("data-uicm-element"))
                    return;
                const highlightId = target.dataset.uicmHighlight;
                if (highlightId) {
                    const highlight = document.getElementById(highlightId);
                    if (highlight) {
                        highlight.remove();
                    }
                    delete target.dataset.uicmHighlight;
                }
            };
            this.handleCommentSubmit = async (content, element, position, userName) => {
                if (!element || !content.trim())
                    return;
                const xpath = getXPath(element);
                if (!xpath)
                    return;
                // Create user object with updated name if provided
                const user = userName
                    ? { ...this.config.currentUser, name: userName }
                    : this.config.currentUser;
                // Create new comment
                const comment = {
                    id: generateId(),
                    content: content.trim(),
                    xpath,
                    url: this.getCurrentUrl(),
                    position,
                    relativePosition: { x: 0, y: 0 }, // Calculate relative position if needed
                    createdAt: new Date().toISOString(),
                    createdBy: user,
                    role: user.role || "other", // Add role from user
                    replies: [],
                    status: exports.CommentStatus.BUG, // Replies start as BUG
                };
                // Add comment to list
                this.comments.push(comment);
                // Create bubble for the comment
                this.createCommentBubble(comment);
                // Close the form
                this.closeActiveComponents();
                // Save to backend if configured
                if (this.config.onSaveComment) {
                    try {
                        const savedComment = await this.config.onSaveComment(comment);
                        // Update local comment with saved data
                        Object.assign(comment, savedComment);
                    }
                    catch (error) {
                        console.error("Failed to save comment:", error);
                    }
                }
            };
            this.config = config;
            this.root = root;
            // Initialize performance optimizations
            this.visibilityObserver = new VisibilityObserver({
                threshold: 0.1,
                rootMargin: "50px",
            });
            this.eventBatcher = new EventBatcher();
            this.positionCache = new LRUCache(50);
            // Initialize mobile support
            this.isMobile = isMobileDevice();
            if (this.isMobile) {
                addMobileCSS();
            }
            this.attachEventListeners();
        }
        attachEventListeners() {
            // Keyboard shortcuts handler
            this.escKeyHandler = (e) => {
                // Ctrl+E to toggle comment mode
                if ((e.ctrlKey || e.metaKey) && e.key === "e") {
                    e.preventDefault();
                    e.stopPropagation();
                    // Use the silent toggle callback if available
                    if (this.config.onToggleModeSilent) {
                        this.config.onToggleModeSilent();
                    }
                    else {
                        // Fallback to regular toggle
                        const newMode = this.mode === "normal" ? "comment" : "normal";
                        this.setMode(newMode);
                    }
                    return;
                }
                // ESC key handler to exit comment mode and close components
                if (e.key === "Escape") {
                    // If modal or form is active, close them first
                    if (this.activeModal || this.activeForm) {
                        this.closeActiveComponents();
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    // If in comment mode with no active components, exit comment mode
                    else if (this.mode === "comment") {
                        this.setMode("normal");
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            };
            document.addEventListener("keydown", this.escKeyHandler);
            // Throttle scroll for better performance - only when in comment mode
            const handleScroll = throttle(() => {
                // Only update if we have bubbles and are in comment mode
                if (this.commentBubbles.size > 0 && this.mode === "comment") {
                    this.updateBubblePositions();
                }
            }, 16); // ~60fps
            const handleResize = debounce(() => {
                // Only update if we have bubbles and are in comment mode
                if (this.commentBubbles.size > 0 && this.mode === "comment") {
                    // Clear cache on resize
                    this.positionCache.clear();
                    this.updateBubblePositions();
                }
            }, 100);
            window.addEventListener("scroll", handleScroll, {
                passive: true,
            });
            window.addEventListener("resize", handleResize);
            // Also listen for orientation change on mobile
            window.addEventListener("orientationchange", () => {
                // Only update if we have bubbles and are in comment mode
                if (this.commentBubbles.size > 0 && this.mode === "comment") {
                    // Clear cache on orientation change
                    this.positionCache.clear();
                    // Add delay for orientation change to complete
                    setTimeout(() => {
                        this.updateBubblePositions();
                    }, 100);
                }
            });
            // Listen for DOM changes that might affect element positions
            if (typeof MutationObserver !== "undefined") {
                const observer = new MutationObserver((mutations) => {
                    // Skip if no bubbles to update or not in comment mode
                    if (this.commentBubbles.size === 0 || this.mode !== "comment") {
                        return;
                    }
                    let shouldUpdate = false;
                    // Filter out SDK-related mutations to avoid infinite loops
                    for (const mutation of mutations) {
                        const target = mutation.target;
                        // Skip if mutation is on SDK elements
                        if (target.closest("[data-uicm-element]") ||
                            target.classList?.contains("uicm-highlight") ||
                            target.id?.startsWith("uicm-")) {
                            continue;
                        }
                        // Only update for meaningful changes
                        if (mutation.type === "childList" ||
                            (mutation.type === "attributes" &&
                                ["style", "class"].indexOf(mutation.attributeName) !== -1)) {
                            shouldUpdate = true;
                            break;
                        }
                    }
                    if (shouldUpdate) {
                        // Debounce DOM mutation updates
                        clearTimeout(this.mutationTimeout);
                        this.mutationTimeout = setTimeout(() => {
                            this.updateBubblePositions();
                        }, 100); // Increased debounce time
                    }
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ["style", "class"],
                });
            }
            // Add event listeners
            document.addEventListener("click", this.handleElementClick);
            document.addEventListener("mouseenter", this.handleElementMouseEnter, true);
            document.addEventListener("mouseleave", this.handleElementMouseLeave, true);
            // Add touch gesture support for mobile
            if (this.isMobile && isTouchDevice()) {
                this.touchGestureRecognizer = new TouchGestureRecognizer(document.body, {
                    onTap: (event) => {
                        if (this.mode === "comment") {
                            // Convert touch event to mouse event-like object
                            const mouseEvent = new MouseEvent("click", {
                                clientX: event.x,
                                clientY: event.y,
                                bubbles: true,
                                cancelable: true,
                            });
                            Object.defineProperty(mouseEvent, "target", {
                                value: event.target,
                                writable: false,
                            });
                            this.handleElementClick(mouseEvent);
                        }
                    },
                    onLongPress: (event) => {
                        if (this.mode === "normal") {
                            // Enable comment mode on long press
                            this.setMode("comment");
                        }
                    },
                });
            }
            // Initial position update only if needed
            setTimeout(() => {
                if (this.commentBubbles.size > 0) {
                    this.forceUpdateBubblePositions();
                }
            }, 100);
        }
        closeActiveComponents() {
            // Close active form
            if (this.activeForm) {
                const formElement = this.activeForm.getElement();
                if (formElement && formElement.parentNode) {
                    formElement.parentNode.removeChild(formElement);
                }
                this.activeForm = null;
            }
            // Close active modal
            if (this.activeModal) {
                this.activeModal.destroy();
                this.activeModal = null;
            }
            // Remove overlay
            this.removeOverlay();
        }
        createOverlay() {
            // Remove existing overlay first
            this.removeOverlay();
            const overlay = document.createElement("div");
            overlay.className = "uicm-overlay";
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100vw";
            overlay.style.height = "100vh";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
            overlay.style.zIndex = "999997"; // Below interaction layer but above page content
            overlay.style.cursor = "pointer";
            // Close on overlay click (only if click target is overlay itself)
            overlay.addEventListener("click", (e) => {
                // Only close if the click target is the overlay itself (not modal/form inside)
                if (e.target === overlay) {
                    e.stopPropagation();
                    this.closeActiveComponents();
                }
            });
            // Add global document click listener for outside clicks
            const globalClickHandler = (e) => {
                // Check if click is outside modal/form
                const target = e.target;
                const isInsideModal = target &&
                    this.activeModal &&
                    this.activeModal.getElement &&
                    this.activeModal.getElement().contains(target);
                const isInsideForm = target &&
                    this.activeForm &&
                    this.activeForm.getElement().contains(target);
                // If not inside modal or form, close components
                if (!isInsideModal && !isInsideForm) {
                    this.closeActiveComponents();
                    document.removeEventListener("click", globalClickHandler);
                }
            };
            // Add global click listener with slight delay to avoid immediate closure
            setTimeout(() => {
                document.addEventListener("click", globalClickHandler);
            }, 100);
            // Add to root
            const interactionLayer = document.getElementById("uicm-interaction-layer");
            if (interactionLayer) {
                interactionLayer.appendChild(overlay);
            }
            this.activeOverlay = overlay;
            return overlay;
        }
        removeOverlay() {
            if (this.activeOverlay) {
                if (this.activeOverlay.parentNode) {
                    this.activeOverlay.parentNode.removeChild(this.activeOverlay);
                }
                this.activeOverlay = null;
            }
        }
        showModal(modal) {
            // Close any existing components
            this.closeActiveComponents();
            // Create overlay for event blocking
            this.createOverlay();
            // Set active modal
            this.activeModal = modal;
        }
        showCommentForm(element, position, relativePosition) {
            // Close any existing components first
            this.closeActiveComponents();
            // Create overlay for event blocking
            this.createOverlay();
            // Use requestAnimationFrame to avoid blocking the UI
            requestAnimationFrame(() => {
                const form = new CommentForm({
                    onSubmit: async (content, userName, attachments) => {
                        // Calculate more accurate relative position
                        const rect = element.getBoundingClientRect();
                        // Calculate relative position based on click position within element
                        // Note: position parameter is already in viewport coordinates
                        const relativeX = Math.max(0, Math.min(1, (position.x - rect.left) / rect.width));
                        const relativeY = Math.max(0, Math.min(1, (position.y - rect.top) / rect.height));
                        // Create user object with updated name if provided
                        const user = userName
                            ? { ...this.config.currentUser, name: userName }
                            : this.config.currentUser;
                        const commentData = {
                            content,
                            xpath: getXPath(element) || "",
                            url: this.getCurrentUrl(),
                            position: {
                                x: rect.left + rect.width * relativeX,
                                y: rect.top + rect.height * relativeY,
                            },
                            relativePosition: { x: relativeX, y: relativeY },
                            createdBy: user,
                            role: user.role || "other", // Add role from user
                            status: exports.CommentStatus.BUG, // New comments start as BUG
                            replies: [],
                            attachments: attachments || [], // Add attachments to new comment
                        };
                        const newComment = await this.config.onSaveComment(commentData);
                        this.comments.push(newComment);
                        this.createCommentBubble(newComment);
                        this.closeActiveComponents();
                    },
                    onCancel: () => this.closeActiveComponents(),
                    position,
                    element,
                    currentUser: this.config.currentUser,
                });
                const interactionLayer = document.getElementById("uicm-interaction-layer");
                if (interactionLayer) {
                    interactionLayer.appendChild(form.getElement());
                    // Reposition form to ensure it stays within viewport
                    form.reposition();
                }
                this.activeForm = form;
            });
        }
        hideCommentForm() {
            if (this.activeForm) {
                this.activeForm.destroy();
                this.activeForm = null;
            }
        }
        addBubbleToLayer(bubble) {
            const interactionLayer = document.getElementById("uicm-interaction-layer");
            if (!interactionLayer) {
                console.error("❌ Interaction layer not found");
                return;
            }
            interactionLayer.appendChild(bubble.getElement());
        }
        async createComment(element, content, position, relativePosition) {
            const xpath = getXPath(element);
            if (!xpath)
                return;
            const commentData = {
                content: content.trim(),
                xpath,
                url: this.getCurrentUrl(),
                position,
                relativePosition,
                createdBy: this.config.currentUser,
                role: this.config.currentUser.role || "other", // Add role from current user
                status: exports.CommentStatus.BUG, // New comments start as BUG
                replies: [],
            };
            try {
                const newComment = await this.config.onSaveComment(commentData);
                this.comments.push(newComment);
                this.createCommentBubble(newComment);
            }
            catch (error) {
                console.error("Failed to create comment:", error);
            }
        }
        createCommentBubble(comment) {
            const element = getElementByXPath(comment.xpath);
            if (!element || !isElementValid(element)) {
                console.warn("Element not found for comment:", comment.xpath);
                return;
            }
            // Calculate current viewport position from element and relative position
            const rect = element.getBoundingClientRect();
            const absoluteX = rect.left + rect.width * comment.relativePosition.x;
            const absoluteY = rect.top + rect.height * comment.relativePosition.y;
            const bubble = new CommentBubble({
                comment,
                position: { x: absoluteX, y: absoluteY },
                currentUser: this.config.currentUser,
                onReply: (commentId, content, user, attachments) => this.addReply(commentId, content, user, attachments),
                onResolve: (commentId) => this.resolveComment(commentId),
                onDelete: (commentId) => this.deleteComment(commentId),
                onShowModal: (modal) => this.showModal(modal), // Pass callback for centralized modal management
                onStatusChange: (commentId, status) => this.changeCommentStatus(commentId, status),
            });
            this.addBubbleToLayer(bubble);
            this.commentBubbles.set(comment.id, bubble);
            // Add to visibility observer for performance
            this.visibilityObserver.observe(bubble.getElement(), (isVisible) => {
                // Bubble visibility changed
            });
            // Cache the position
            this.positionCache.set(comment.id, { x: absoluteX, y: absoluteY });
        }
        async addReply(commentId, content, user, attachments) {
            const comment = this.comments.find((c) => c.id === commentId);
            if (!comment)
                return;
            // Use provided user or fallback to current user
            const replyUser = user || this.config.currentUser;
            const reply = {
                id: generateId(),
                content,
                xpath: comment.xpath,
                url: comment.url,
                position: comment.position,
                relativePosition: comment.relativePosition,
                createdAt: new Date().toISOString(),
                createdBy: replyUser,
                role: replyUser.role || "other", // Add role from reply user
                replies: [],
                status: exports.CommentStatus.BUG, // Replies start as BUG
                attachments: attachments || [], // Add attachments to reply
            };
            comment.replies.push(reply);
            // Update comment via API if configured
            if (this.config.onUpdateComment) {
                await this.config.onUpdateComment(comment);
            }
            // Update bubble
            const bubble = this.commentBubbles.get(commentId);
            if (bubble) {
                bubble.updateComment(comment);
            }
        }
        async resolveComment(commentId) {
            const comment = this.comments.find((c) => c.id === commentId);
            if (!comment)
                return;
            comment.status = exports.CommentStatus.DONE;
            comment.resolvedAt = new Date().toISOString();
            // Update comment via API if configured
            if (this.config.onUpdateComment) {
                await this.config.onUpdateComment(comment);
            }
            // Update bubble
            const bubble = this.commentBubbles.get(commentId);
            if (bubble) {
                bubble.updateComment(comment);
            }
        }
        async changeCommentStatus(commentId, status) {
            const comment = this.comments.find((c) => c.id === commentId);
            if (!comment)
                return;
            const previousStatus = comment.status;
            comment.status = status;
            // Update timestamps based on status
            if (status === exports.CommentStatus.DONE &&
                previousStatus !== exports.CommentStatus.DONE) {
                comment.resolvedAt = new Date().toISOString();
            }
            else if (status === exports.CommentStatus.ARCHIVED &&
                previousStatus !== exports.CommentStatus.ARCHIVED) {
                comment.archivedAt = new Date().toISOString();
            }
            // Update comment via API if configured
            if (this.config.onUpdateComment) {
                await this.config.onUpdateComment(comment);
            }
            // Update bubble
            const bubble = this.commentBubbles.get(commentId);
            if (bubble) {
                bubble.updateComment(comment);
            }
            // Emit status change event
            // this.emit("comment-updated", { comment });
        }
        async deleteComment(commentId) {
            const comment = this.comments.find((c) => c.id === commentId);
            if (!comment)
                return;
            // Update resolved status
            comment.status = exports.CommentStatus.ARCHIVED;
            if (this.config.onDeleteComment) {
                try {
                    await this.config.onDeleteComment(commentId);
                }
                catch (error) {
                    console.error("Failed to delete comment:", error);
                    return;
                }
            }
            // Remove from local array
            this.comments = this.comments.filter((c) => c.id !== commentId);
            // Remove bubble
            const bubble = this.commentBubbles.get(commentId);
            if (bubble) {
                bubble.destroy();
                this.commentBubbles.delete(commentId);
            }
        }
        updateBubblePositions() {
            // Only update if we have bubbles AND are in comment mode
            if (this.commentBubbles.size === 0) {
                return;
            }
            // In normal mode, bubbles should be static - no need to update positions
            if (this.mode === "normal") {
                return;
            }
            this.commentBubbles.forEach((bubble, commentId) => {
                const comment = this.comments.find((c) => c.id === commentId);
                if (!comment) {
                    console.warn("❌ Comment not found for bubble:", commentId);
                    return;
                }
                // Hide archived bubbles
                if (comment.status === exports.CommentStatus.ARCHIVED) {
                    bubble.getElement().style.display = "none";
                    return;
                }
                const element = getElementByXPath(comment.xpath);
                if (!element || !isElementValid(element)) {
                    // Element not found, hide bubble
                    bubble.getElement().style.display = "none";
                    return;
                }
                // Show bubble if it was hidden (and not archived)
                bubble.getElement().style.display = "flex";
                // Get current element position
                const rect = element.getBoundingClientRect();
                // Calculate viewport position from relative position
                // Note: Root container uses position:fixed, so we need viewport coordinates, not document coordinates
                const absoluteX = rect.left + rect.width * comment.relativePosition.x;
                const absoluteY = rect.top + rect.height * comment.relativePosition.y;
                // Update bubble position
                bubble.updatePosition({ x: absoluteX, y: absoluteY });
                // Update cache
                this.positionCache.set(commentId, { x: absoluteX, y: absoluteY });
            });
        }
        forceUpdateBubblePositions() {
            // Force update positions regardless of mode - used for initial load and new comments
            if (this.commentBubbles.size === 0) {
                return;
            }
            this.commentBubbles.forEach((bubble, commentId) => {
                const comment = this.comments.find((c) => c.id === commentId);
                if (!comment) {
                    console.warn("❌ Comment not found for bubble:", commentId);
                    return;
                }
                const element = getElementByXPath(comment.xpath);
                if (!element || !isElementValid(element)) {
                    // Element not found, hide bubble
                    bubble.getElement().style.display = "none";
                    return;
                }
                // Show bubble if it was hidden
                bubble.getElement().style.display = "flex";
                // Get current element position
                const rect = element.getBoundingClientRect();
                // Calculate viewport position from relative position
                const absoluteX = rect.left + rect.width * comment.relativePosition.x;
                const absoluteY = rect.top + rect.height * comment.relativePosition.y;
                // Update bubble position
                bubble.updatePosition({ x: absoluteX, y: absoluteY });
                // Update cache
                this.positionCache.set(commentId, { x: absoluteX, y: absoluteY });
            });
        }
        getCurrentUrl() {
            return window.location.href;
        }
        async loadComments() {
            try {
                // Try to load from API first
                const data = await this.config.onFetchJsonFile?.();
                const allComments = data?.comments || [];
                const currentUrl = normalizeUrl$1(this.getCurrentUrl());
                // Filter comments to only show those from the current URL
                this.comments = allComments.filter((comment) => normalizeUrl$1(comment.url) === currentUrl);
                // Luôn cập nhật lại localStorage với toàn bộ comment mới nhất từ API
                this.saveCommentsToLocalStorage(allComments);
                // Clear existing bubbles before creating new ones
                this.clearAllBubbles();
                // Create bubbles for all comments
                this.comments.forEach((comment) => {
                    this.createCommentBubble(comment);
                });
                // Sync comments back to SDK if it has onLoadComments configured
                if (this.config.onLoadComments) {
                    try {
                        // This will update the SDK's comments array
                        await this.config.onLoadComments();
                    }
                    catch (error) {
                        console.warn("Failed to sync comments to SDK:", error);
                    }
                }
                // Force update positions after loading comments
                if (this.comments.length > 0) {
                    setTimeout(() => {
                        this.forceUpdateBubblePositions();
                    }, 100);
                }
            }
            catch (error) {
                console.error("Failed to load comments from API, trying localStorage:", error);
                // Fallback to localStorage when API fails
                try {
                    const localComments = this.loadCommentsFromLocalStorage();
                    const currentUrl = normalizeUrl$1(this.getCurrentUrl());
                    // Filter comments to only show those from the current URL
                    this.comments = localComments.filter((comment) => normalizeUrl$1(comment.url) === currentUrl);
                    // Clear existing bubbles before creating new ones
                    this.clearAllBubbles();
                    // Create bubbles for all comments
                    this.comments.forEach((comment) => {
                        this.createCommentBubble(comment);
                    });
                    // Force update positions after loading comments
                    if (this.comments.length > 0) {
                        setTimeout(() => {
                            this.forceUpdateBubblePositions();
                        }, 100);
                    }
                }
                catch (localStorageError) {
                    console.error("Failed to load comments from localStorage:", localStorageError);
                }
            }
        }
        saveCommentsToLocalStorage(comments) {
            try {
                const data = {
                    comments,
                    lastUpdated: new Date().toISOString(),
                    source: "comment-manager-backup",
                };
                localStorage.setItem("uicm-comments-backup", JSON.stringify(data));
            }
            catch (error) {
                console.error("Failed to save comments to localStorage:", error);
            }
        }
        loadCommentsFromLocalStorage() {
            try {
                const stored = localStorage.getItem("uicm-comments-backup");
                if (stored) {
                    const data = JSON.parse(stored);
                    return data.comments || [];
                }
            }
            catch (error) {
                console.error("Failed to load from localStorage:", error);
            }
            return [];
        }
        updateLayerVisibility() {
            const interactionLayer = document.getElementById("uicm-interaction-layer");
            const highlightLayer = document.getElementById("uicm-highlight-layer");
            if (this.mode === "comment") {
                // Show layers
                if (interactionLayer) {
                    interactionLayer.style.display = "block";
                    // Update visibility of individual bubbles based on status
                    this.commentBubbles.forEach((bubble, commentId) => {
                        const comment = this.comments.find((c) => c.id === commentId);
                        if (comment && comment.status === exports.CommentStatus.ARCHIVED) {
                            bubble.getElement().style.display = "none";
                        }
                        else {
                            bubble.getElement().style.display = "flex";
                        }
                    });
                }
                if (highlightLayer) {
                    highlightLayer.style.display = "block";
                }
                // Force position update with slight delay
                setTimeout(() => {
                    this.forceUpdateBubblePositions();
                }, 50);
            }
            else {
                // Hide layers completely in normal mode
                if (interactionLayer) {
                    interactionLayer.style.display = "none";
                }
                if (highlightLayer) {
                    highlightLayer.style.display = "none";
                }
            }
        }
        async setMode(mode) {
            this.mode = mode;
            this.updateLayerVisibility();
            // Only create bubbles when switching to comment mode
            if (mode === "comment") {
                // Get comments from SDK instead of loading from API
                if (this.config.onLoadComments) {
                    try {
                        const sdkComments = await this.config.onLoadComments();
                        // Update CommentManager's comments array
                        this.comments = [...sdkComments];
                        // Clear existing bubbles before creating new ones
                        this.clearAllBubbles();
                        // Create bubbles for all comments
                        this.comments.forEach((comment) => {
                            this.createCommentBubble(comment);
                        });
                        // Force update bubble positions
                        if (this.commentBubbles.size > 0) {
                            this.forceUpdateBubblePositions();
                            // Also update after a short delay to ensure proper positioning
                            setTimeout(() => {
                                this.forceUpdateBubblePositions();
                            }, 100);
                        }
                    }
                    catch (error) {
                        console.error("Failed to get comments from SDK:", error);
                    }
                }
            }
        }
        getMode() {
            return this.mode;
        }
        getComments() {
            return [...this.comments];
        }
        getCommentsForElement(element) {
            const xpath = getElementXPath(element);
            return this.comments.filter((comment) => comment.xpath === xpath);
        }
        getCommentBubble(commentId) {
            return this.commentBubbles.get(commentId) || null;
        }
        updateCurrentUser(user) {
            this.config.currentUser = user;
            // Refresh all comment bubbles to show updated user names
            this.refreshAllCommentBubbles();
        }
        refreshAllCommentBubbles() {
            // Update all existing bubbles to reflect user name changes
            this.commentBubbles.forEach((bubble, commentId) => {
                const comment = this.comments.find((c) => c.id === commentId);
                if (comment) {
                    bubble.updateComment(comment);
                    bubble.updateUser(this.config.currentUser);
                }
            });
        }
        highlightElement(element) {
            // Remove existing highlights
            const existingHighlights = this.root.querySelectorAll(".uicm-element-highlight");
            existingHighlights.forEach((highlight) => highlight.remove());
            // Create new highlight
            const highlight = document.createElement("div");
            highlight.className = "uicm-element-highlight";
            highlight.setAttribute("data-uicm-element", "true");
            const rect = element.getBoundingClientRect();
            highlight.style.left = `${rect.left}px`;
            highlight.style.top = `${rect.top}px`;
            highlight.style.width = `${rect.width}px`;
            highlight.style.height = `${rect.height}px`;
            this.root.appendChild(highlight);
            // Auto-remove highlight after 3 seconds
            setTimeout(() => {
                if (highlight.parentNode) {
                    highlight.remove();
                }
            }, 3000);
        }
        testBubbleClicks() {
            document.getElementById("uicm-interaction-layer");
            this.commentBubbles.forEach((bubble, commentId) => {
                bubble.testClickability();
            });
        }
        clearAllBubbles() {
            // Clean up all bubbles
            this.commentBubbles.forEach((bubble) => bubble.destroy());
            this.commentBubbles.clear();
            // Clear position cache
            this.positionCache.clear();
        }
        destroy() {
            // Clean up active components and overlay
            this.closeActiveComponents();
            // Remove event listeners
            window.removeEventListener("scroll", this.rafUpdatePositions);
            window.removeEventListener("resize", this.throttledUpdatePositions);
            document.removeEventListener("click", this.handleElementClick);
            document.removeEventListener("mouseenter", this.handleElementMouseEnter, true);
            document.removeEventListener("mouseleave", this.handleElementMouseLeave, true);
            if (this.escKeyHandler) {
                document.removeEventListener("keydown", this.escKeyHandler);
            }
            // Clean up performance optimizations
            this.visibilityObserver.disconnect();
            this.positionCache.clear();
            // Clean up mobile support
            if (this.touchGestureRecognizer) {
                this.touchGestureRecognizer.destroy();
            }
            if (this.isMobile) {
                removeMobileCSS();
            }
            // Clean up all bubbles
            this.clearAllBubbles();
        }
    }

    function normalizeUrl(url) {
        try {
            const u = new URL(url);
            u.hash = "";
            let norm = u.origin + u.pathname;
            if (norm.endsWith("/"))
                norm = norm.slice(0, -1);
            return norm;
        }
        catch {
            return url;
        }
    }
    class CommentSDK {
        constructor(config) {
            this.sidebar = null;
            this.commentModal = null; // Add modal reference
            this.commentsTable = null;
            this.isInitialized = false;
            this.comments = [];
            this.config = {
                theme: "light",
                ...config,
            };
            // Load or create default user
            const savedUser = userProfileStorage.loadUserProfile();
            this.currentUser = savedUser || {
                id: "default-user",
                name: "Anonymous User",
                role: "other",
            };
            if (!savedUser) {
                userProfileStorage.saveUserProfile(this.currentUser);
            }
            this.validateConfig();
        }
        createCustomCursor() {
            // SVG chỉ có icon 💬, không background
            const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <text x="20" y="28" font-size="24" text-anchor="middle" fill="#00bcd4" font-family="Arial" font-weight="bold">💬</text>
      </svg>
    `;
            // Encode SVG cho data URL
            const encodedSvg = encodeURIComponent(svg);
            const dataUrl = `data:image/svg+xml,${encodedSvg}`;
            return `url('${dataUrl}') 20 20, auto`;
        }
        setCustomCursor(enable) {
            const cursor = enable ? this.createCustomCursor() : "";
            document.body.style.cursor = cursor;
            // Apply to all SDK layers that may override cursor
            const layers = [
                ".uicm-overlay",
                ".uicm-comment-modal",
                ".uicm-comment-form",
                ".uicm-comment-bubble",
                "#uicm-root",
                "#uicm-highlight-layer",
                "#uicm-interaction-layer",
            ];
            layers.forEach((sel) => {
                document.querySelectorAll(sel).forEach((el) => {
                    if (el instanceof HTMLElement) {
                        el.style.cursor = cursor;
                    }
                });
            });
        }
        validateConfig() {
            if (!this.config.projectId) {
                throw new Error("CommentSDK: projectId is required");
            }
            if (!this.config.onFetchJsonFile) {
                throw new Error("CommentSDK: onFetchJsonFile function is required");
            }
            if (!this.config.onUpdate) {
                throw new Error("CommentSDK: onUpdate callback is required");
            }
        }
        async init() {
            if (this.isInitialized) {
                return;
            }
            try {
                // Setup DOM
                this.setupDOM();
                // Create comment manager config
                const managerConfig = {
                    projectId: this.config.projectId,
                    currentUser: this.currentUser,
                    theme: this.config.theme,
                    onLoadComments: async () => {
                        // Return SDK comments and sync to CommentManager
                        return this.comments;
                    },
                    onSaveComment: async (commentData) => {
                        // Luôn fetch lại comment mới nhất từ API
                        const data = await this.config.onFetchJsonFile();
                        const allComments = data?.comments || [];
                        // Không filter theo URL nữa
                        const newComment = {
                            ...commentData,
                            id: this.generateId(),
                            createdAt: new Date().toISOString(),
                        };
                        const updatedComments = [...allComments, newComment];
                        this.comments = updatedComments;
                        await this.config.onUpdate(updatedComments);
                        return newComment;
                    },
                    onUpdateComment: async (updatedComment) => {
                        const data = await this.config.onFetchJsonFile();
                        const allComments = data?.comments || [];
                        // Không filter theo URL nữa
                        const updatedComments = allComments.map((c) => c.id === updatedComment.id ? updatedComment : c);
                        this.comments = updatedComments;
                        await this.config.onUpdate(updatedComments);
                        return updatedComment;
                    },
                    onDeleteComment: async (commentId) => {
                        const data = await this.config.onFetchJsonFile();
                        const allComments = data?.comments || [];
                        // Không filter theo URL nữa
                        const updatedComments = allComments.filter((c) => c.id !== commentId);
                        this.comments = updatedComments;
                        await this.config.onUpdate(updatedComments);
                    },
                    onFetchJsonFile: this.config.onFetchJsonFile,
                    onToggleModeSilent: async () => {
                        await this.toggleModeSilent();
                    },
                };
                // Initialize comment manager
                this.commentManager = new CommentManager(managerConfig, this.root);
                // Initialize UI components
                this.initializeUI();
                // Load comments from API directly into SDK
                await this.loadCommentsFromAPI();
                // Check if we're navigating from sidebar and need to open a comment
                this.handleSidebarNavigation();
                this.isInitialized = true;
            }
            catch (error) {
                throw error;
            }
        }
        // Method to sync comments from CommentManager
        syncCommentsFromManager() {
            if (this.commentManager) {
                const managerComments = this.commentManager.getComments();
                this.comments = [...managerComments];
            }
        }
        // Load comments from API directly into SDK
        async loadCommentsFromAPI() {
            try {
                const data = await this.config.onFetchJsonFile();
                const allComments = data?.comments || [];
                this.comments = allComments; // Lưu tất cả comments
                // Update comments count in table button
                if (this.commentsTableButton) {
                    this.commentsTableButton.updateCommentsCount(this.comments.length);
                }
            }
            catch (error) {
                // console.error("Failed to load comments from API into SDK:", error);
            }
        }
        setupDOM() {
            this.root = ensureSDKRoot();
            this.root.className = `uicm-theme-${this.config.theme}`;
        }
        initializeUI() {
            // Debug icon
            this.debugIcon = new DebugIcon({
                isActive: false,
                onClick: () => this.toggleMode(),
                theme: this.config.theme,
            });
            // Settings button
            this.settingsButton = new SettingsButton({
                currentUser: this.currentUser,
                onUserUpdate: async (updatedUser) => {
                    this.currentUser = updatedUser;
                    this.commentManager.updateCurrentUser(updatedUser);
                    userProfileStorage.saveUserProfile(updatedUser);
                    // Update sidebar button with new user info
                    this.sidebarButton.updateUser(updatedUser);
                    // Refresh sidebar if it's open
                    if (this.sidebar) {
                        this.sidebar.updateComments(this.comments);
                    }
                },
                isVisible: false,
            });
            // Sidebar button
            this.sidebarButton = new SidebarButton({
                currentUser: this.currentUser,
                onClick: () => this.openSidebar(),
                isVisible: false,
            });
            // Comments table button
            this.commentsTableButton = new CommentsTableButton({
                onClick: () => this.toggleCommentsTable(),
                theme: this.config.theme,
                commentsCount: this.comments.length,
                isVisible: false,
            });
            // Add to DOM
            document.body.appendChild(this.debugIcon.getElement());
            document.body.appendChild(this.settingsButton.getElement());
            document.body.appendChild(this.sidebarButton.getElement());
            document.body.appendChild(this.commentsTableButton.getElement());
        }
        async toggleMode() {
            const currentMode = this.commentManager.getMode();
            const newMode = currentMode === "normal" ? "comment" : "normal";
            await this.setMode(newMode);
        }
        // New method for keyboard shortcut - toggle mode without showing sidebar/settings icons
        async toggleModeSilent() {
            const currentMode = this.commentManager.getMode();
            const newMode = currentMode === "normal" ? "comment" : "normal";
            if (!this.isInitialized) {
                throw new Error("CommentSDK: Not initialized. Call init() first.");
            }
            await this.commentManager.setMode(newMode);
            this.debugIcon.updateState(newMode === "comment");
            this.settingsButton.setVisible(newMode === "comment");
            this.sidebarButton.setVisible(newMode === "comment");
            this.commentsTableButton.setVisible(newMode === "comment");
            // Apply custom cursor
            this.setCustomCursor(newMode === "comment");
        }
        async setMode(mode) {
            if (!this.isInitialized) {
                throw new Error("CommentSDK: Not initialized. Call init() first.");
            }
            await this.commentManager.setMode(mode);
            this.debugIcon.updateState(mode === "comment");
            this.settingsButton.setVisible(mode === "comment");
            this.sidebarButton.setVisible(mode === "comment");
            this.commentsTableButton.setVisible(mode === "comment");
            // Apply custom cursor
            this.setCustomCursor(mode === "comment");
        }
        openSidebar() {
            if (this.sidebar) {
                this.sidebar.destroy();
                this.sidebar = null;
                return;
            }
            this.sidebar = new CommentSidebar({
                comments: this.comments,
                currentUser: this.currentUser,
                onNavigateToComment: (comment) => this.navigateToComment(comment),
                onClose: () => {
                    if (this.sidebar) {
                        this.sidebar.destroy();
                        this.sidebar = null;
                    }
                },
                onStatusChange: async (commentId, status) => {
                    const comment = this.comments.find((c) => c.id === commentId);
                    if (comment) {
                        comment.status = status;
                        await this.config.onUpdate(this.comments);
                    }
                },
            });
            document.body.appendChild(this.sidebar.getElement());
            this.sidebar.show();
        }
        navigateToComment(comment) {
            // Check if comment is from a different URL
            if (normalizeUrl(comment.url) !== normalizeUrl(window.location.href)) {
                // Set a flag to indicate we're navigating from sidebar
                window.uicmIsNavigatingFromSidebar = true;
                // Navigate to the comment's URL with hash for comment ID
                const targetUrl = comment.url.includes("#")
                    ? `${comment.url}#comment-${comment.id}`
                    : `${comment.url}#comment-${comment.id}`;
                window.location.href = targetUrl;
                return;
            }
            // Comment is from current page, find element and open modal
            const element = this.findElementByXPath(comment.xpath);
            if (element) {
                // Scroll to element
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                // Highlight element temporarily
                element.style.outline = "2px solid #3b82f6";
                element.style.outlineOffset = "2px";
                setTimeout(() => {
                    element.style.outline = "";
                    element.style.outlineOffset = "";
                }, 3000);
                // Open comment modal
                this.openCommentModal(comment, element);
            }
            else {
                // Still try to open modal even if element not found
                this.openCommentModal(comment, null);
            }
        }
        openCommentModal(comment, element) {
            // Close sidebar first
            if (this.sidebar) {
                this.sidebar.destroy();
                this.sidebar = null;
            }
            // Create and show comment modal
            this.commentModal = new CommentModal({
                comments: [comment],
                currentUser: this.currentUser,
                position: element ? this.getElementPosition(element) : { x: 0, y: 0 },
                onClose: () => {
                    if (this.commentModal) {
                        this.commentModal.destroy();
                        this.commentModal = null;
                    }
                },
                onAddReply: async (commentId, content, user, attachments) => {
                    // Add reply to comment
                    const targetComment = this.comments.find((c) => c.id === commentId);
                    if (targetComment) {
                        const newReply = {
                            id: this.generateId(),
                            content,
                            xpath: targetComment.xpath,
                            url: targetComment.url,
                            position: targetComment.position,
                            relativePosition: targetComment.relativePosition,
                            createdAt: new Date().toISOString(),
                            createdBy: user || this.currentUser,
                            role: user?.role || this.currentUser.role || "other",
                            replies: [],
                            status: exports.CommentStatus.BUG,
                            attachments,
                        };
                        targetComment.replies.push(newReply);
                        await this.config.onUpdate(this.comments);
                    }
                },
                onStatusChange: async (commentId, status) => {
                    const targetComment = this.comments.find((c) => c.id === commentId);
                    if (targetComment) {
                        targetComment.status = status;
                        await this.config.onUpdate(this.comments);
                    }
                },
            });
            document.body.appendChild(this.commentModal.getElement());
        }
        getElementPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }
        findElementByXPath(xpath) {
            try {
                const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return result.singleNodeValue;
            }
            catch {
                return null;
            }
        }
        generateId() {
            return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        toggleCommentsTable() {
            // If modal is already open, close it
            if (this.commentsTable) {
                this.commentsTable.destroy();
                this.commentsTable = null;
                // Restore SDK cursor if in comment mode
                if (this.commentManager.getMode() === "comment") {
                    this.setCustomCursor(true);
                }
                return;
            }
            // Otherwise open the modal
            this.openCommentsTable();
        }
        openCommentsTable() {
            // Close sidebar and comment modal if open
            if (this.sidebar) {
                this.sidebar.destroy();
                this.sidebar = null;
            }
            if (this.commentModal) {
                this.commentModal.destroy();
                this.commentModal = null;
            }
            // Create and show comments table
            this.commentsTable = new CommentsTable({
                comments: this.comments,
                currentUser: this.currentUser,
                onClose: () => {
                    // Always remove modal from DOM if exists
                    if (this.commentsTable) {
                        const modalEl = this.commentsTable.getElement();
                        if (modalEl.parentNode) {
                            modalEl.parentNode.removeChild(modalEl);
                        }
                    }
                    // Restore SDK cursor if in comment mode
                    if (this.commentManager.getMode() === "comment") {
                        this.setCustomCursor(true);
                    }
                    // Always set commentsTable = null
                    this.commentsTable = null;
                },
                onDeleteComments: async (commentIds) => {
                    // Remove comments from array
                    this.comments = this.comments.filter((comment) => !commentIds.includes(comment.id));
                    // Update via API
                    await this.config.onUpdate(this.comments);
                    // Update comments count in button
                    this.commentsTableButton.updateCommentsCount(this.comments.length);
                    // Update comment manager
                    if (this.commentManager) {
                        await this.commentManager.loadComments();
                    }
                },
                onUpdateComment: async (updatedComment) => {
                    // Update local array
                    const index = this.comments.findIndex((c) => c.id === updatedComment.id);
                    if (index !== -1) {
                        this.comments[index] = updatedComment;
                        await this.config.onUpdate(this.comments);
                        // Update comment manager
                        if (this.commentManager) {
                            await this.commentManager.loadComments();
                        }
                    }
                },
            });
            document.body.appendChild(this.commentsTable.getElement());
            // Set cursor: auto for modal and all children
            const modal = this.commentsTable.getElement();
            modal.style.cursor = "auto";
            modal.querySelectorAll("*").forEach((el) => {
                el.style.cursor = "auto";
            });
            // Also set body cursor to auto while modal is open
            document.body.style.cursor = "auto";
        }
        destroy() {
            if (this.sidebar) {
                this.sidebar.destroy();
            }
            if (this.commentManager) {
                this.commentManager.destroy();
            }
            if (this.commentModal) {
                this.commentModal.destroy();
                this.commentModal = null;
            }
            if (this.commentsTable) {
                this.commentsTable.destroy();
                this.commentsTable = null;
            }
            this.isInitialized = false;
        }
        getComments() {
            return this.comments;
        }
        getCurrentUser() {
            return this.currentUser;
        }
        handleSidebarNavigation() {
            // Check if we have a comment ID in URL hash from sidebar navigation
            const hash = window.location.hash;
            if (hash && hash.startsWith("#comment-")) {
                const commentId = hash.substring(9); // Remove '#comment-' prefix
                // Find the comment
                const comment = this.comments.find((c) => c.id === commentId);
                if (comment) {
                    // Clear the hash
                    window.location.hash = "";
                    // Open comment modal after a short delay to ensure page is loaded
                    setTimeout(() => {
                        this.openCommentModal(comment, null);
                    }, 500);
                }
            }
        }
    }
    function initCommentSDK(config) {
        return new CommentSDK(config);
    }

    var css_248z$9 = "/* SDK Layers */\n#uicm-root {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n  z-index: 999998;\n}\n\n/* Base layer for background element highlights */\n#uicm-highlight-layer {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n  z-index: 1;\n}\n\n/* Unified interaction layer for bubbles and forms */\n#uicm-interaction-layer {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  pointer-events: none;\n  z-index: 2;\n}\n\n/* Overlay for blocking events when modal/form is active */\n.uicm-overlay {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background-color: rgba(0, 0, 0, 0.1);\n  z-index: 999997;\n  pointer-events: auto;\n  cursor: pointer;\n}\n\n/* Modal and form should appear above overlay */\n.uicm-comment-modal,\n.uicm-comment-form {\n  z-index: 999999 !important; /* Higher than overlay */\n  pointer-events: auto !important;\n  position: relative; /* Ensure z-index takes effect */\n}\n\n/* Bubbles should be clickable in interaction layer */\n.uicm-comment-bubble {\n  pointer-events: auto !important;\n  position: relative;\n  z-index: 100 !important;\n}\n\nbutton {\n  cursor: pointer !important;\n}\n";
    styleInject(css_248z$9);

    var css_248z$8 = "/* Image Modal Styles */\n.uicm-image-modal {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  background: rgba(0, 0, 0, 0.9);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 999999;\n  opacity: 0;\n  visibility: hidden;\n  transition: opacity 0.3s ease, visibility 0.3s ease;\n  pointer-events: auto;\n}\n\n.uicm-image-modal.show {\n  opacity: 1;\n  visibility: visible;\n}\n\n.uicm-image-container {\n  position: relative;\n  max-width: 80vw;\n  max-height: 80vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.uicm-image-container img {\n  max-width: 100%;\n  max-height: 100%;\n  object-fit: contain;\n  border-radius: 8px;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);\n  transition: transform 0.3s ease;\n  cursor: zoom-in;\n  user-select: none;\n}\n\n.uicm-image-close {\n  position: absolute;\n  top: -40px;\n  right: 0;\n  background: none;\n  border: none;\n  color: white;\n  font-size: 32px;\n  cursor: pointer;\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: background-color 0.2s ease;\n}\n\n.uicm-image-close:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n\n.uicm-image-download {\n  position: absolute;\n  top: -40px;\n  right: 50px;\n  background: none;\n  border: none;\n  color: white;\n  font-size: 20px;\n  cursor: pointer;\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  transition: background-color 0.2s ease;\n}\n\n.uicm-image-download:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n\n.uicm-image-zoom-in:hover,\n.uicm-image-zoom-out:hover,\n.uicm-image-reset:hover {\n  background-color: rgba(255, 255, 255, 0.1);\n}\n\n/* Mobile responsive */\n@media (max-width: 768px) {\n  .uicm-image-container {\n    max-width: 95vw;\n    max-height: 90vh;\n  }\n\n  .uicm-image-close {\n    top: -50px;\n    right: 10px;\n    width: 36px;\n    height: 36px;\n    font-size: 28px;\n  }\n\n  .uicm-image-download {\n    top: -50px;\n    right: 50px;\n    width: 36px;\n    height: 36px;\n    font-size: 18px;\n  }\n\n  .uicm-image-zoom-in,\n  .uicm-image-zoom-out,\n  .uicm-image-reset {\n    top: -50px;\n    width: 36px;\n    height: 36px;\n    font-size: 14px;\n  }\n\n  .uicm-image-zoom-in {\n    right: 90px;\n  }\n\n  .uicm-image-zoom-out {\n    right: 130px;\n  }\n\n  .uicm-image-reset {\n    right: 170px;\n  }\n}\n";
    styleInject(css_248z$8);

    var css_248z$7 = "/* Modern Comment Modal - Optimized */\n.uicm-comment-modal {\n  background: linear-gradient(145deg, #ffffff, #f8fafc);\n  border-radius: 16px;\n  border: 1px solid #e5e7eb;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);\n  width: 380px;\n  position: relative;\n  overflow: hidden;\n  font-family: \"Inter\", sans-serif;\n  animation: uicm-modal-slide-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}\n\n.uicm-comment-modal:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15), 0 20px 40px rgba(30, 0, 0, 0.1),\n    0 0 0 1px rgba(255, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.9);\n}\n\n/* Header */\n.uicm-modal-header-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 4px;\n  background: linear-gradient(\n    135deg,\n    var(--uicm-accent, #3b82f6) 0%,\n    #8b5cf6 25%,\n    #06b6d4 50%,\n    #10b981 75%,\n    #f59e0b 100%\n  );\n  border-radius: 20px 20px 0 0;\n}\n\n.uicm-modal-header {\n  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);\n  border-bottom: 1px solid #e5e7eb;\n  border-radius: 16px 16px 0 0;\n  position: relative;\n  padding: 0;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);\n}\n\n.uicm-modal-header::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 3px;\n  background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);\n  border-radius: 12px 12px 0 0;\n}\n\n.uicm-modal-header-content {\n  display: flex;\n  flex-direction: column;\n  padding: 0;\n}\n\n/* Top Section */\n.uicm-modal-top-section {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  padding: 24px 28px 16px;\n  gap: 20px;\n}\n\n.uicm-modal-title-section {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  flex: 1;\n  min-width: 0;\n}\n\n.uicm-modal-title {\n  margin: 0;\n  font-size: 24px;\n  font-weight: 700;\n  color: #1f2937;\n  letter-spacing: -0.025em;\n  line-height: 1.2;\n}\n\n.uicm-modal-description {\n  margin: 0;\n  font-size: 14px;\n  color: #6b7280;\n  font-weight: 500;\n  line-height: 1.4;\n}\n\n/* Close Button */\n.uicm-close-button {\n  background: linear-gradient(\n    145deg,\n    rgba(239, 68, 68, 0.1),\n    rgba(220, 38, 38, 0.08)\n  );\n  border: 1px solid rgba(239, 68, 68, 0.2);\n  color: #dc2626;\n  font-size: 18px;\n  font-weight: bold;\n  cursor: pointer;\n  width: 36px;\n  height: 36px;\n  padding: 8px;\n  border-radius: 10px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n  flex-shrink: 0;\n}\n\n.uicm-close-button:hover {\n  background: linear-gradient(\n    145deg,\n    rgba(239, 68, 68, 0.15),\n    rgba(220, 38, 38, 0.12)\n  );\n  border-color: rgba(239, 68, 68, 0.3);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);\n}\n\n/* Bottom Section */\n.uicm-modal-bottom-section {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 0 28px 24px;\n  gap: 12px;\n}\n\n/* Status Select */\n.uicm-status-select {\n  background: linear-gradient(\n    145deg,\n    rgba(255, 255, 255, 0.9),\n    rgba(248, 250, 252, 0.8)\n  );\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.4);\n  color: #374151;\n  font-size: 14px;\n  font-weight: 600;\n  padding: 10px 16px;\n  border-radius: 12px;\n  cursor: pointer;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n  width: 85%;\n}\n\n.uicm-status-select:hover {\n  background: linear-gradient(\n    145deg,\n    rgba(255, 255, 255, 1),\n    rgba(248, 250, 252, 0.9)\n  );\n  border-color: rgba(59, 130, 246, 0.3);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);\n}\n\n.uicm-status-select:focus {\n  outline: none;\n  border-color: rgba(59, 130, 246, 0.5);\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n/* Status colors */\n.uicm-status-select[data-status=\"bug\"] {\n  color: #dc3545;\n  font-weight: 700;\n}\n.uicm-status-select[data-status=\"feature_request\"] {\n  color: #ffc107;\n  font-weight: 700;\n}\n.uicm-status-select[data-status=\"dev_completed\"] {\n  color: #3b82f6;\n  font-weight: 700;\n}\n.uicm-status-select[data-status=\"done\"] {\n  color: #28a745;\n  font-weight: 700;\n}\n.uicm-status-select[data-status=\"archived\"] {\n  color: #6c757d;\n  font-weight: 700;\n}\n\n.uicm-status-select option[value=\"bug\"] {\n  color: #dc3545;\n}\n.uicm-status-select option[value=\"feature_request\"] {\n  color: #ffc107;\n}\n.uicm-status-select option[value=\"dev_completed\"] {\n  color: #3b82f6;\n}\n.uicm-status-select option[value=\"done\"] {\n  color: #28a745;\n}\n.uicm-status-select option[value=\"archived\"] {\n  color: #6c757d;\n}\n\n/* Delete Button */\n.uicm-delete-button {\n  background: linear-gradient(\n    145deg,\n    rgba(239, 68, 68, 0.1),\n    rgba(220, 38, 38, 0.08)\n  );\n  border: 1px solid rgba(239, 68, 68, 0.2);\n  color: #dc2626;\n  font-size: 16px;\n  font-weight: 600;\n  cursor: pointer;\n  width: 36px;\n  height: 36px;\n  padding: 8px;\n  border-radius: 10px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n  flex-shrink: 0;\n}\n\n.uicm-delete-button:hover {\n  background: linear-gradient(\n    145deg,\n    rgba(239, 68, 68, 0.15),\n    rgba(220, 38, 38, 0.12)\n  );\n  border-color: rgba(239, 68, 68, 0.3);\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);\n}\n\n.uicm-delete-button:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  transform: none;\n}\n\n/* Comments List */\n.uicm-comments-list {\n  padding: 5px;\n  max-height: 300px;\n  overflow-y: auto;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f1f5f9;\n}\n\n.uicm-comment-item {\n  margin-bottom: 6px;\n  padding: 16px;\n  background: rgba(255, 255, 255, 0.8);\n  border-radius: 12px;\n  border: 1px solid rgba(229, 231, 235, 0.5);\n  display: flex;\n  gap: 12px;\n  align-items: flex-start;\n}\n\n.uicm-comment-item:last-child {\n  margin-bottom: 0;\n}\n\n/* Comment Avatar */\n.uicm-comment-avatar {\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: white;\n  font-weight: 600;\n  font-size: 14px;\n  flex-shrink: 0;\n}\n\n/* Comment Content */\n.uicm-comment-content {\n  flex: 1;\n  min-width: 0;\n}\n\n.uicm-comment-header {\n  display: flex;\n  align-items: center;\n  margin-bottom: 8px;\n  gap: 8px;\n}\n\n.uicm-author-name {\n  font-weight: 600;\n  color: #1f2937;\n  font-size: 14px;\n}\n\n.uicm-role-badge {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.1),\n    rgba(139, 92, 246, 0.1)\n  );\n  color: #3b82f6;\n  font-size: 11px;\n  font-weight: 600;\n  padding: 2px 8px;\n  border-radius: 8px;\n  border: 1px solid rgba(59, 130, 246, 0.2);\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n\n.uicm-comment-time {\n  font-size: 12px;\n  color: #6b7280;\n  margin-left: auto;\n}\n\n.uicm-comment-text {\n  color: #374151;\n  line-height: 1.5;\n  font-size: 14px;\n  margin: 0;\n  word-wrap: break-word;\n}\n\n/* Reply Form */\n.uicm-reply-form {\n  margin-top: 4px;\n  padding: 16px;\n  border-top: 1px solid #e5e7eb;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n/* Hide reply header (avatar and name) */\n.uicm-reply-header {\n  display: none;\n}\n\n/* File previews at top */\n.uicm-reply-form .uicm-file-preview-container {\n  order: 1;\n  margin-bottom: 8px;\n  overflow-x: auto;\n}\n\n.uicm-reply-input-container {\n  position: relative;\n  order: 2;\n  flex: 1;\n  display: flex;\n  gap: 8px;\n  align-items: flex-start;\n}\n\n.uicm-reply-input {\n  flex: 1;\n  background: rgba(255, 255, 255, 0.9);\n  border: 1px solid #d1d5db;\n  border-radius: 10px;\n  padding: 12px 16px;\n  font-size: 14px;\n  color: #374151;\n  resize: vertical;\n  min-height: 60px;\n  transition: all 0.2s ease;\n  box-sizing: border-box;\n}\n\n.uicm-reply-input:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n.uicm-reply-input::placeholder {\n  color: #9ca3af;\n}\n\n/* Character Counter */\n.uicm-reply-char-counter {\n  position: absolute;\n  display: none;\n  bottom: 8px;\n  right: 12px;\n  font-size: 11px;\n  color: #6b7280;\n  background: rgba(255, 255, 255, 0.9);\n  padding: 2px 6px;\n  border-radius: 4px;\n  z-index: 1;\n}\n\n.uicm-reply-char-counter.uicm-warning {\n  color: #f59e0b;\n}\n\n.uicm-reply-char-counter.uicm-error {\n  color: #dc2626;\n}\n\n/* Reply Actions - at the very bottom */\n.uicm-reply-actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  order: 3;\n  margin-top: 8px;\n  padding-top: 12px;\n  border-top: 1px solid #e5e7eb;\n}\n\n.uicm-reply-send {\n  background: linear-gradient(135deg, #3b82f6, #8b5cf6);\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n\n.uicm-reply-send:hover:not(:disabled) {\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);\n}\n\n.uicm-reply-send:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n  transform: none;\n}\n\n/* Status Badge */\n.uicm-status-badge {\n  display: inline-flex;\n  align-items: center;\n  padding: 4px 8px;\n  border-radius: 6px;\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n}\n\n.uicm-status-badge.status-bug {\n  background: rgba(220, 53, 69, 0.1);\n  color: #dc3545;\n}\n.uicm-status-badge.status-feature_request {\n  background: rgba(255, 193, 7, 0.1);\n  color: #ffc107;\n}\n.uicm-status-badge.status-dev_completed {\n  background: rgba(59, 130, 246, 0.1);\n  color: #3b82f6;\n}\n.uicm-status-badge.status-done {\n  background: rgba(40, 167, 69, 0.1);\n  color: #28a745;\n}\n.uicm-status-badge.status-archived {\n  background: rgba(108, 117, 125, 0.1);\n  color: #6c757d;\n}\n\n/* File Upload */\n.uicm-file-upload-section {\n  margin-top: 16px;\n}\n\n.uicm-file-upload-button {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.1),\n    rgba(139, 92, 246, 0.1)\n  );\n  border: 1px solid rgba(59, 130, 246, 0.2);\n  color: #3b82f6;\n  padding: 8px 16px;\n  border-radius: 8px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n\n.uicm-file-upload-button:hover {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.15),\n    rgba(139, 92, 246, 0.15)\n  );\n  transform: translateY(-1px);\n}\n\n/* Reply File Upload Button (small) */\n.uicm-reply-file-upload-button {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.1),\n    rgba(139, 92, 246, 0.1)\n  );\n  border: 1px solid rgba(59, 130, 246, 0.2);\n  color: #3b82f6;\n  padding: 8px;\n  border-radius: 8px;\n  font-size: 16px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n  width: 36px;\n  height: 36px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n\n.uicm-reply-file-upload-button:hover {\n  background: linear-gradient(\n    135deg,\n    rgba(59, 130, 246, 0.15),\n    rgba(139, 92, 246, 0.15)\n  );\n  transform: translateY(-1px);\n  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);\n}\n\n/* File upload button next to textarea */\n.uicm-reply-form .uicm-file-upload-button {\n  width: 36px;\n  height: 36px;\n  padding: 8px;\n  font-size: 16px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n\n.uicm-file-preview-container {\n  display: flex;\n  flex-wrap: nowrap;\n  gap: 8px;\n  margin-top: 12px;\n  overflow-x: auto;\n  overflow-y: hidden;\n  padding-bottom: 4px;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f1f5f9;\n}\n\n.uicm-file-preview-container::-webkit-scrollbar {\n  height: 4px;\n}\n\n.uicm-file-preview-container::-webkit-scrollbar-track {\n  background: #f1f5f9;\n  border-radius: 2px;\n}\n\n.uicm-file-preview-container::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 2px;\n}\n\n.uicm-file-preview-container::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n\n.uicm-file-preview-item {\n  position: relative;\n  background: rgba(255, 255, 255, 0.9);\n  border: 1px solid #e5e7eb;\n  border-radius: 8px;\n  padding: 6px;\n  max-width: 80px;\n  min-width: 80px;\n}\n\n/* Reply File Preview Container (small) */\n.uicm-reply-file-preview-container {\n  display: flex;\n  flex-wrap: nowrap;\n  gap: 4px;\n  margin-bottom: 8px;\n  max-width: 100%;\n  overflow-x: auto;\n  overflow-y: hidden;\n  padding-bottom: 4px;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f1f5f9;\n}\n\n.uicm-reply-file-preview-container::-webkit-scrollbar {\n  height: 4px;\n}\n\n.uicm-reply-file-preview-container::-webkit-scrollbar-track {\n  background: #f1f5f9;\n  border-radius: 2px;\n}\n\n.uicm-reply-file-preview-container::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 2px;\n}\n\n.uicm-reply-file-preview-container::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n\n.uicm-reply-file-preview-item {\n  position: relative;\n  background: rgba(255, 255, 255, 0.9);\n  border: 1px solid #e5e7eb;\n  border-radius: 6px;\n  padding: 4px;\n  max-width: 50px;\n  min-width: 50px;\n}\n\n.uicm-file-preview-remove {\n  position: absolute;\n  top: -16px;\n  right: -16px;\n  background: linear-gradient(135deg, #ef4444, #dc2626);\n  color: white;\n  border: 2px solid #ffffff;\n  border-radius: 100%;\n  width: 20px;\n  height: 20px;\n  font-size: 15px;\n  font-weight: bold;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n  transition: all 0.2s ease;\n}\n\nbutton.uicm-file-preview-remove {\n  padding: 0 !important;\n}\n\n.uicm-file-preview-remove:hover {\n  background: linear-gradient(135deg, #dc2626, #b91c1c);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);\n}\n\n.uicm-file-preview-info {\n  text-align: center;\n  margin-top: 4px;\n}\n\n.uicm-file-preview-size {\n  font-size: 10px;\n  color: #6b7280;\n  margin-top: 2px;\n}\n\n.uicm-file-preview-image {\n  width: 100%;\n  height: 60px;\n  object-fit: cover;\n  border-radius: 4px;\n  margin-bottom: 4px;\n}\n\n.uicm-file-preview-icon {\n  width: 30px;\n  height: 30px;\n  margin: 0 auto 4px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #f3f4f6;\n  border-radius: 4px;\n  color: #6b7280;\n  font-size: 12px;\n}\n\n/* Reply File Preview (small) */\n.uicm-reply-file-preview-image {\n  width: 100%;\n  height: 30px;\n  object-fit: cover;\n  border-radius: 3px;\n  margin-bottom: 2px;\n}\n\n.uicm-reply-file-preview-icon {\n  width: 16px;\n  height: 16px;\n  margin: 0 auto 2px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #f3f4f6;\n  border-radius: 3px;\n  color: #6b7280;\n  font-size: 8px;\n}\n\n/* Comment Attachments */\n.uicm-comment-attachments {\n  margin-top: 12px;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.uicm-attachment-item {\n  background: rgba(255, 255, 255, 0.9);\n  border: 1px solid #e5e7eb;\n  border-radius: 8px;\n  padding: 8px;\n  max-width: 120px;\n  cursor: pointer;\n  transition: all 0.2s ease;\n}\n\n.uicm-attachment-item:hover {\n  transform: translateY(-1px);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n}\n\n.uicm-attachment-image {\n  width: 100%;\n  height: 80px;\n  object-fit: cover;\n  border-radius: 4px;\n  margin-bottom: 4px;\n}\n\n.uicm-attachment-image:hover {\n  opacity: 0.8;\n}\n\n.uicm-attachment-icon {\n  width: 40px;\n  height: 40px;\n  margin: 0 auto 4px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #f3f4f6;\n  border-radius: 4px;\n  color: #6b7280;\n}\n\n.uicm-attachment-info {\n  text-align: center;\n}\n\n.uicm-attachment-name {\n  font-size: 11px;\n  color: #374151;\n  font-weight: 500;\n  word-break: break-word;\n  line-height: 1.3;\n}\n\n.uicm-attachment-size {\n  font-size: 10px;\n  color: #6b7280;\n  margin-top: 2px;\n}\n\n/* Animations */\n@keyframes uicm-modal-slide-in {\n  0% {\n    opacity: 0;\n    transform: scale(0.9) translateY(-20px);\n  }\n  100% {\n    opacity: 1;\n    transform: scale(1) translateY(0);\n  }\n}\n\n/* Scrollbar */\n.uicm-comments-list::-webkit-scrollbar {\n  width: 6px;\n}\n\n.uicm-comments-list::-webkit-scrollbar-track {\n  background: #f1f5f9;\n  border-radius: 3px;\n}\n\n.uicm-comments-list::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 3px;\n}\n\n.uicm-comments-list::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n\n/* Mobile Responsive */\n@media (max-width: 480px) {\n  .uicm-comment-modal {\n    min-width: 320px;\n    max-width: 95vw;\n    margin: 20px;\n  }\n\n  .uicm-modal-top-section {\n    padding: 20px 20px 12px;\n  }\n\n  .uicm-modal-title {\n    font-size: 20px;\n  }\n\n  .uicm-modal-description {\n    font-size: 13px;\n  }\n\n  .uicm-modal-bottom-section {\n    padding: 0 20px 20px;\n  }\n\n  .uicm-status-select {\n    width: 80%;\n  }\n\n  .uicm-delete-button {\n    width: 32px;\n    height: 32px;\n  }\n\n  .uicm-close-button {\n    width: 32px;\n    height: 32px;\n    font-size: 16px;\n  }\n\n  .uicm-comments-list,\n  .uicm-reply-form {\n    padding: 16px 20px;\n  }\n\n  .uicm-reply-actions {\n    flex-direction: column;\n  }\n\n  .uicm-reply-cancel,\n  .uicm-reply-send {\n    width: 100%;\n  }\n\n  .uicm-comment-item {\n    padding: 12px;\n  }\n\n  .uicm-comment-avatar {\n    width: 28px;\n    height: 28px;\n    font-size: 12px;\n  }\n\n  .uicm-reply-avatar {\n    width: 24px;\n    height: 24px;\n    font-size: 11px;\n  }\n}\n";
    styleInject(css_248z$7);

    var css_248z$6 = "/* Comment Bubble Styles */\n.uicm-comment-bubble {\n  position: absolute;\n  width: 32px;\n  height: 32px;\n  border-radius: 50%;\n  background-color: #007bff;\n  border: 2px solid white;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 16px;\n  font-weight: bold;\n  color: white;\n  z-index: 9999;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\n  transition: all 0.2s ease;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n}\n\n.uicm-comment-bubble:hover {\n  transform: scale(1.1);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n}\n\n.uicm-comment-bubble:active {\n  transform: scale(0.95);\n}\n\n/* Comment Count Badge */\n.uicm-comment-count-badge {\n  position: absolute;\n  top: -6px;\n  right: -6px;\n  border-radius: 50%;\n  width: 18px;\n  height: 18px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 10px;\n  font-weight: bold;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n  z-index: 101;\n  transition: all 0.2s ease;\n  border: 2px solid;\n}\n\n.uicm-comment-count-badge:hover {\n  transform: scale(1.1);\n}\n";
    styleInject(css_248z$6);

    var css_248z$5 = "/* Modern Comment Form with New UI */\n.uicm-comment-form {\n  background: linear-gradient(145deg, #ffffff, #f8fafc);\n  border-radius: 16px;\n  border: 1px solid #e5e7eb;\n  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);\n  width: 380px;\n  position: relative;\n  overflow: hidden;\n  font-family: \"Inter\", sans-serif;\n  animation: uicm-form-slide-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\n  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);\n  will-change: transform, opacity;\n}\n\n.uicm-comment-form:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15), 0 20px 40px rgba(0, 0, 0, 0.1),\n    0 0 0 1px rgba(255, 255, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.9);\n}\n\n/* Gradient Header Bar */\n.uicm-comment-form::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 4px;\n  background: linear-gradient(\n    135deg,\n    var(--uicm-accent, #3b82f6) 0%,\n    #8b5cf6 25%,\n    #06b6d4 50%,\n    #10b981 75%,\n    #f59e0b 100%\n  );\n  border-radius: var(--uicm-border-radius, 20px) var(--uicm-border-radius, 20px)\n    0 0;\n}\n\n/* Header Section with improved layout */\n.uicm-form-header {\n  background: #ffffff;\n  border-bottom: 1px solid #e5e7eb;\n  border-radius: 16px 16px 0 0;\n  padding: 0;\n}\n\n.uicm-form-header-content {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  padding: 24px 24px 20px;\n  gap: 16px;\n}\n\n.uicm-form-title-section {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  flex: 1;\n}\n\n.uicm-form-title {\n  font-size: 22px;\n  font-weight: 700;\n  color: #1f2937;\n  margin: 0;\n  letter-spacing: -0.02em;\n  line-height: 1.2;\n}\n\n.uicm-form-subtitle {\n  font-size: 14px;\n  color: #6b7280;\n  margin: 0;\n  font-weight: 500;\n  line-height: 1.4;\n}\n\n.uicm-form-action-section {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-shrink: 0;\n}\n\n.uicm-user-info {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  order: 2;\n  margin-bottom: 8px;\n}\n\n.uicm-user-avatar {\n  width: 40px;\n  height: 40px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #3b82f6, #06b6d4);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 16px;\n  font-weight: 600;\n  color: white;\n  transition: transform 0.2s;\n}\n\n.uicm-user-avatar:hover {\n  transform: scale(1.1);\n}\n\n.uicm-user-details {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.uicm-user-name-input {\n  background: transparent;\n  border: none;\n  font-size: 14px;\n  font-weight: 600;\n  color: #1f2937;\n  line-height: 1.2;\n  outline: none;\n  transition: all 0.2s ease;\n  max-width: 180px;\n  padding: 4px 8px;\n  border-radius: 6px;\n}\n\n.uicm-user-name-input:hover {\n  background: rgba(59, 130, 246, 0.05);\n}\n\n.uicm-user-name-input:focus {\n  background: rgba(59, 130, 246, 0.1);\n  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);\n}\n\n.uicm-user-name-input::placeholder {\n  color: var(--uicm-text-secondary, #64748b);\n  opacity: 0.7;\n}\n\n.uicm-user-name {\n  font-size: 16px;\n  font-weight: 700;\n  color: var(--uicm-text-primary, #0f172a);\n  line-height: 1.2;\n  letter-spacing: -0.01em;\n}\n\n.uicm-close-button {\n  background: linear-gradient(\n    145deg,\n    rgba(255, 255, 255, 0.8),\n    rgba(247, 243, 233, 0.6)\n  );\n  border: 1px solid rgba(224, 122, 95, 0.2);\n  color: #6b5b47;\n  font-size: 20px;\n  font-weight: 600;\n  cursor: pointer;\n  padding: 10px;\n  border-radius: 20px;\n  width: 40px;\n  height: 40px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 4px 12px rgba(224, 122, 95, 0.1);\n  line-height: 1;\n}\n\n/* Content Section */\n.uicm-form-content {\n  padding: 16px 20px;\n  background: #ffffff;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n.uicm-comment-textarea {\n  flex: 1;\n  min-height: 80px;\n  max-height: 200px;\n  padding: 12px 16px;\n  border: 1px solid #d1d5db;\n  border-radius: 8px;\n  font-size: 14px;\n  line-height: 1.5;\n  color: #374151;\n  resize: none;\n  transition: all 0.2s ease;\n  background: #ffffff;\n  font-family: inherit;\n  outline: none;\n  box-sizing: border-box;\n}\n\n.uicm-comment-textarea:focus {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n.uicm-comment-textarea::placeholder {\n  color: #9ca3af;\n  font-style: normal;\n  opacity: 0.7;\n}\n\n/* Character Counter - Hidden like in reply form */\n.uicm-char-counter {\n  display: none;\n}\n\n/* File previews at top - with higher specificity */\n.uicm-comment-form .uicm-file-preview-container {\n  order: 1;\n  margin-bottom: 8px;\n  display: flex !important;\n  flex-wrap: nowrap !important;\n  gap: 8px;\n  overflow-x: auto !important;\n  overflow-y: hidden !important;\n  padding-bottom: 4px;\n  scrollbar-width: thin;\n  scrollbar-color: #cbd5e1 #f1f5f9;\n}\n\n.uicm-comment-form .uicm-file-preview-container::-webkit-scrollbar {\n  height: 4px;\n}\n\n.uicm-comment-form .uicm-file-preview-container::-webkit-scrollbar-track {\n  background: #f1f5f9;\n  border-radius: 2px;\n}\n\n.uicm-comment-form .uicm-file-preview-container::-webkit-scrollbar-thumb {\n  background: #cbd5e1;\n  border-radius: 2px;\n}\n\n.uicm-comment-form .uicm-file-preview-container::-webkit-scrollbar-thumb:hover {\n  background: #94a3b8;\n}\n\n/* Form input container (textarea + file upload button) */\n.uicm-form-input-container {\n  position: relative;\n  order: 2;\n  flex: 1;\n  display: flex;\n  gap: 8px;\n  align-items: flex-start;\n}\n\n/* File upload button in form input container (small like reply form) */\n.uicm-form-input-container .uicm-file-upload-button {\n  width: 36px;\n  height: 36px;\n  padding: 8px;\n  font-size: 16px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n\n/* Actions Section */\n.uicm-form-actions {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 20px;\n  order: 3;\n  margin-top: 8px;\n  padding-top: 12px;\n  border-top: 1px solid #e5e7eb;\n}\n\n.uicm-secondary-actions {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n.uicm-emoji-button,\n.uicm-mention-button {\n  background: rgba(255, 255, 255, 0.6);\n  backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.3);\n  border-radius: 12px;\n  padding: 10px 14px;\n  font-size: 16px;\n  cursor: pointer;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  color: var(--uicm-text-secondary, #64748b);\n  font-weight: 500;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.uicm-emoji-button:hover,\n.uicm-mention-button:hover {\n  background: rgba(255, 255, 255, 0.8);\n  border-color: var(--uicm-accent, #3b82f6);\n  color: var(--uicm-accent, #3b82f6);\n  transform: translateY(-2px) scale(1.05);\n  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);\n}\n\n/* Primary actions - single button layout */\n.uicm-primary-actions {\n  display: flex;\n  justify-content: flex-end;\n  align-items: center;\n}\n\n.uicm-submit-button {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  padding: 8px 20px;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: background-color 0.2s ease;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.uicm-submit-button:hover:not(:disabled) {\n  background: #2563eb;\n}\n\n.uicm-submit-button:disabled {\n  background: #9ca3af;\n  cursor: not-allowed;\n  transform: none;\n  box-shadow: none;\n}\n\n.uicm-submit-button kbd {\n  background: rgba(255, 255, 255, 0.2);\n  border-radius: 4px;\n  padding: 2px 6px;\n  font-size: 11px;\n  font-weight: normal;\n}\n\n/* Loading Spinner */\n.uicm-spinner {\n  width: 16px;\n  height: 16px;\n  border: 2px solid rgba(255, 255, 255, 0.3);\n  border-top: 2px solid white;\n  border-radius: 50%;\n  animation: uicm-spin 1s linear infinite;\n}\n\n/* Error Message */\n.uicm-error-message {\n  background: linear-gradient(\n    135deg,\n    rgba(239, 68, 68, 0.1),\n    rgba(220, 38, 38, 0.05)\n  );\n  border: 1px solid rgba(239, 68, 68, 0.3);\n  color: var(--uicm-danger, #ef4444);\n  padding: 12px 16px;\n  border-radius: 12px;\n  font-size: 13px;\n  margin-top: 12px;\n  font-weight: 500;\n  animation: uicm-shake 0.5s ease-in-out;\n  backdrop-filter: blur(8px);\n}\n\n/* Animations */\n@keyframes uicm-form-slide-in {\n  0% {\n    opacity: 0;\n    transform: translateY(20px) scale(0.95);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0) scale(1);\n  }\n}\n\n@keyframes uicm-spin {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes uicm-shake {\n  0%,\n  100% {\n    transform: translateX(0);\n  }\n  25% {\n    transform: translateX(-4px);\n  }\n  75% {\n    transform: translateX(4px);\n  }\n}\n\n@keyframes uicm-pulse {\n  0%,\n  100% {\n    opacity: 1;\n    transform: scale(1);\n  }\n  50% {\n    opacity: 0.8;\n    transform: scale(1.1);\n  }\n}\n\n/* Paste Loading Styles */\n.uicm-paste-loading {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(10px);\n  border: 1px solid rgba(59, 130, 246, 0.2);\n  border-radius: 12px;\n  padding: 16px 24px;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  font-size: 14px;\n  color: #1e293b;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);\n  z-index: 1000;\n}\n\n.uicm-loading-spinner {\n  width: 20px;\n  height: 20px;\n  border: 2px solid #e2e8f0;\n  border-top: 2px solid #3b82f6;\n  border-radius: 50%;\n  animation: uicm-spin 1s linear infinite;\n}\n\n@keyframes uicm-glow-warning {\n  0%,\n  100% {\n    text-shadow: 0 0 4px rgba(245, 158, 11, 0.5);\n  }\n  50% {\n    text-shadow: 0 0 8px rgba(245, 158, 11, 0.8);\n  }\n}\n\n@keyframes uicm-glow-error {\n  0%,\n  100% {\n    text-shadow: 0 0 4px rgba(239, 68, 68, 0.5);\n  }\n  50% {\n    text-shadow: 0 0 8px rgba(239, 68, 68, 0.8);\n  }\n}\n\n/* Mobile Responsive */\n@media (max-width: 480px) {\n  .uicm-comment-form {\n    min-width: 320px;\n    max-width: 95vw;\n    margin: 10px;\n  }\n\n  .uicm-form-header-content {\n    padding: 20px 20px 16px;\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 12px;\n  }\n\n  .uicm-form-title-section {\n    width: 100%;\n  }\n\n  .uicm-form-action-section {\n    align-self: flex-end;\n  }\n\n  .uicm-form-content {\n    padding: 20px;\n  }\n\n  .uicm-form-actions {\n    flex-direction: column;\n    gap: 16px;\n  }\n\n  .uicm-primary-actions {\n    width: 100%;\n    justify-content: space-between;\n  }\n\n  .uicm-cancel-button,\n  .uicm-submit-button {\n    flex: 1;\n    text-align: center;\n  }\n\n  .uicm-secondary-actions {\n    justify-content: center;\n    width: 100%;\n  }\n\n  .uicm-user-avatar {\n    width: 40px;\n    height: 40px;\n    font-size: 16px;\n  }\n\n  .uicm-user-avatar::after {\n    width: 12px;\n    height: 12px;\n  }\n}\n\n/* Form elements should have proper event handling */\n.uicm-comment-form input,\n.uicm-comment-form textarea,\n.uicm-comment-form button,\n.uicm-comment-form select {\n  pointer-events: auto !important;\n  position: relative;\n  z-index: 1 !important;\n}\n\n/* Form should prevent event bubbling */\n.uicm-comment-form {\n  pointer-events: auto !important;\n  position: relative;\n  z-index: 999999 !important;\n}\n\n/* Header bar styling */\n.uicm-form-header-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 4px;\n  background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);\n  border-radius: 8px 8px 0 0;\n  z-index: 1;\n}\n";
    styleInject(css_248z$5);

    var css_248z$4 = "/* Profile Settings Modal */\n.uicm-profile-modal {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  z-index: 10000000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto,\n    \"Helvetica Neue\", Arial, sans-serif;\n}\n\n.uicm-profile-modal-overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(0, 0, 0, 0.5);\n  backdrop-filter: blur(4px);\n}\n\n.uicm-profile-modal-content {\n  position: relative;\n  background: white;\n  border-radius: 12px;\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),\n    0 10px 10px -5px rgba(0, 0, 0, 0.04);\n  width: 90%;\n  max-width: 480px;\n  max-height: 90vh;\n  overflow: hidden;\n  animation: uicm-modal-slide-in 0.3s ease-out;\n}\n\n@keyframes uicm-modal-slide-in {\n  from {\n    opacity: 0;\n    transform: scale(0.95) translateY(-10px);\n  }\n  to {\n    opacity: 1;\n    transform: scale(1) translateY(0);\n  }\n}\n\n.uicm-profile-modal-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 24px 24px 0 24px;\n  border-bottom: 1px solid #e5e7eb;\n  padding-bottom: 20px;\n}\n\n.uicm-profile-modal-title {\n  margin: 0;\n  font-size: 20px;\n  font-weight: 600;\n  color: #111827;\n}\n\n.uicm-profile-modal-close {\n  background: none;\n  border: none;\n  cursor: pointer;\n  padding: 8px;\n  border-radius: 6px;\n  color: #6b7280;\n  transition: all 0.2s;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.uicm-profile-modal-close:hover {\n  background-color: #f3f4f6;\n  color: #374151;\n}\n\n.uicm-profile-modal-body {\n  padding: 24px;\n  max-height: 60vh;\n  overflow-y: auto;\n}\n\n.uicm-profile-avatar-section {\n  display: flex;\n  align-items: center;\n  gap: 16px;\n  margin-bottom: 32px;\n  padding: 20px;\n  background: #f9fafb;\n  border-radius: 12px;\n  border: 1px solid #e5e7eb;\n}\n\n.uicm-profile-avatar {\n  width: 64px;\n  height: 64px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n}\n\n.uicm-profile-avatar-text {\n  font-size: 24px;\n  font-weight: 600;\n  color: white;\n  text-transform: uppercase;\n}\n\n.uicm-profile-avatar-info {\n  flex: 1;\n}\n\n.uicm-profile-avatar-label {\n  margin: 0 0 4px 0;\n  font-size: 14px;\n  font-weight: 500;\n  color: #374151;\n}\n\n.uicm-profile-avatar-subtitle {\n  margin: 0;\n  font-size: 13px;\n  color: #6b7280;\n}\n\n.uicm-profile-form {\n  display: flex;\n  flex-direction: column;\n  gap: 24px;\n}\n\n.uicm-form-group {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.uicm-form-label {\n  font-size: 14px;\n  font-weight: 500;\n  color: #374151;\n  margin: 0;\n}\n\n.uicm-form-input,\n.uicm-form-select {\n  padding: 12px 16px;\n  border: 1px solid #d1d5db;\n  border-radius: 8px;\n  font-size: 14px;\n  color: #111827;\n  background: white;\n  transition: all 0.2s;\n  font-family: inherit;\n}\n\n.uicm-form-input:focus,\n.uicm-form-select:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n.uicm-form-input-error {\n  border-color: #ef4444;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);\n}\n\n.uicm-form-input-error:focus {\n  border-color: #ef4444;\n  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);\n}\n\n.uicm-form-help {\n  font-size: 12px;\n  color: #6b7280;\n  margin: 0;\n}\n\n.uicm-profile-modal-footer {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 12px;\n  padding: 20px 24px;\n  border-top: 1px solid #e5e7eb;\n  background: #f9fafb;\n}\n\n.uicm-btn {\n  padding: 10px 20px;\n  border: none;\n  border-radius: 8px;\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  transition: all 0.2s;\n  font-family: inherit;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 80px;\n}\n\n.uicm-btn:disabled {\n  opacity: 0.6;\n  cursor: not-allowed;\n}\n\n.uicm-btn-secondary {\n  background: white;\n  color: #374151;\n  border: 1px solid #d1d5db;\n}\n\n.uicm-btn-secondary:hover:not(:disabled) {\n  background: #f9fafb;\n  border-color: #9ca3af;\n}\n\n.uicm-btn-primary {\n  background: #3b82f6;\n  color: white;\n}\n\n.uicm-btn-primary:hover:not(:disabled) {\n  background: #2563eb;\n}\n\n/* Dark theme support */\n@media (prefers-color-scheme: dark) {\n  .uicm-profile-modal-content {\n    background: #1f2937;\n    color: #f9fafb;\n  }\n\n  .uicm-profile-modal-title {\n    color: #f9fafb;\n  }\n\n  .uicm-profile-modal-close {\n    color: #9ca3af;\n  }\n\n  .uicm-profile-modal-close:hover {\n    background-color: #374151;\n    color: #d1d5db;\n  }\n\n  .uicm-profile-avatar-section {\n    background: #374151;\n    border-color: #4b5563;\n  }\n\n  .uicm-form-label {\n    color: #d1d5db;\n  }\n\n  .uicm-form-input,\n  .uicm-form-select {\n    background: #374151;\n    border-color: #4b5563;\n    color: #f9fafb;\n  }\n\n  .uicm-form-input:focus,\n  .uicm-form-select:focus {\n    border-color: #60a5fa;\n    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);\n  }\n\n  .uicm-form-help {\n    color: #9ca3af;\n  }\n\n  .uicm-profile-modal-footer {\n    background: #374151;\n    border-color: #4b5563;\n  }\n\n  .uicm-btn-secondary {\n    background: #4b5563;\n    color: #f9fafb;\n    border-color: #6b7280;\n  }\n\n  .uicm-btn-secondary:hover:not(:disabled) {\n    background: #6b7280;\n    border-color: #9ca3af;\n  }\n}\n\n/* Mobile responsiveness */\n@media (max-width: 640px) {\n  .uicm-profile-modal-content {\n    width: 95%;\n    margin: 20px;\n  }\n\n  .uicm-profile-modal-header,\n  .uicm-profile-modal-body,\n  .uicm-profile-modal-footer {\n    padding: 16px;\n  }\n\n  .uicm-profile-avatar-section {\n    flex-direction: column;\n    text-align: center;\n    gap: 12px;\n  }\n\n  .uicm-profile-modal-footer {\n    flex-direction: column-reverse;\n    gap: 8px;\n  }\n\n  .uicm-btn {\n    width: 100%;\n  }\n}\n";
    styleInject(css_248z$4);

    var css_248z$3 = "/* Settings Button */\n.uicm-settings-button {\n  position: fixed;\n  bottom: 20px;\n  right: 20px;\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: white;\n  border: 2px solid #e5e7eb;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #6b7280;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),\n    0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  z-index: 9999999999;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto,\n    \"Helvetica Neue\", Arial, sans-serif;\n  opacity: 1;\n  transform: scale(1) translateY(0);\n}\n\n.uicm-settings-button[style*=\"display: none\"] {\n  opacity: 0;\n  transform: scale(0.8) translateY(20px);\n  pointer-events: none;\n}\n\n.uicm-settings-button:hover {\n  background: #f9fafb;\n  border-color: #d1d5db;\n  color: #374151;\n  transform: scale(1.05);\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),\n    0 4px 6px -2px rgba(0, 0, 0, 0.05);\n}\n\n.uicm-settings-button:active {\n  transform: scale(0.95);\n}\n\n.uicm-settings-button:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n/* Settings Icon */\n.uicm-settings-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n}\n\n.uicm-gear-icon {\n  font-size: 30px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  color: inherit;\n  transition: transform 0.3s ease;\n}\n\n/* Dark theme support */\n@media (prefers-color-scheme: dark) {\n  .uicm-settings-button {\n    background: #374151;\n    border-color: #4b5563;\n    color: #d1d5db;\n  }\n\n  .uicm-settings-button:hover {\n    background: #4b5563;\n    border-color: #6b7280;\n    color: #f9fafb;\n  }\n\n  .uicm-settings-button:focus {\n    border-color: #60a5fa;\n    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);\n  }\n}\n\n/* Mobile responsiveness */\n@media (max-width: 640px) {\n  .uicm-settings-button {\n    bottom: 16px;\n    right: 16px;\n    width: 44px;\n    height: 44px;\n  }\n\n  .uicm-gear-icon {\n    font-size: 18px;\n    width: 18px;\n    height: 18px;\n  }\n}\n";
    styleInject(css_248z$3);

    var css_248z$2 = "/* Sidebar Button */\n.uicm-sidebar-button {\n  position: fixed;\n  bottom: 80px;\n  right: 20px;\n  width: 48px;\n  height: 48px;\n  border-radius: 50%;\n  background: white;\n  border: 2px solid #e5e7eb;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #6b7280;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),\n    0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  z-index: 9999999999999;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto,\n    \"Helvetica Neue\", Arial, sans-serif;\n  opacity: 1;\n  transform: scale(1) translateY(0);\n}\n\n.uicm-sidebar-button[style*=\"display: none\"] {\n  opacity: 0;\n  transform: scale(0.8) translateY(20px);\n  pointer-events: none;\n}\n\n.uicm-sidebar-button:hover {\n  background: #f9fafb;\n  border-color: #d1d5db;\n  color: #374151;\n  transform: scale(1.05);\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),\n    0 4px 6px -2px rgba(0, 0, 0, 0.05);\n}\n\n.uicm-sidebar-button:active {\n  transform: scale(0.95);\n}\n\n.uicm-sidebar-button:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n/* Sidebar Icon */\n.uicm-sidebar-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n}\n\n.uicm-list-icon {\n  font-size: 20px;\n  line-height: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 20px;\n  height: 20px;\n  color: inherit;\n  transition: transform 0.3s ease;\n}\n\n.uicm-sidebar-button:hover .uicm-list-icon {\n  transform: scale(1.1);\n}\n\n/* Dark theme support */\n@media (prefers-color-scheme: dark) {\n  .uicm-sidebar-button {\n    background: #374151;\n    border-color: #4b5563;\n    color: #d1d5db;\n  }\n\n  .uicm-sidebar-button:hover {\n    background: #4b5563;\n    border-color: #6b7280;\n    color: #f9fafb;\n  }\n\n  .uicm-sidebar-button:focus {\n    border-color: #60a5fa;\n    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);\n  }\n}\n\n/* Mobile responsiveness */\n@media (max-width: 640px) {\n  .uicm-sidebar-button {\n    bottom: 76px;\n    right: 16px;\n    width: 44px;\n    height: 44px;\n  }\n\n  .uicm-list-icon {\n    font-size: 18px;\n    width: 18px;\n    height: 18px;\n  }\n}\n";
    styleInject(css_248z$2);

    var css_248z$1 = "/* Comments Table Modal */\n.uicm-comments-table-modal {\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100vw;\n  height: 100vh;\n  z-index: 10000000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  color: #222;\n}\n\n.uicm-comments-table-overlay {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(0, 0, 0, 0.5);\n  backdrop-filter: blur(4px);\n}\n\n.uicm-comments-table-container {\n  position: relative;\n  width: 95vw;\n  max-width: 1400px;\n  height: 90vh;\n  background: #fff;\n  border-radius: 12px;\n  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),\n    0 10px 10px -5px rgba(0, 0, 0, 0.04);\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}\n\n/* Header */\n.uicm-comments-table-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 20px 24px;\n  border-bottom: 1px solid #e5e7eb;\n  background: #f9fafb;\n}\n\n.uicm-comments-table-header h2 {\n  margin: 0;\n  font-size: 1.5rem;\n  font-weight: 600;\n  color: #111827;\n}\n\n.uicm-comments-table-close {\n  background: none;\n  border: none;\n  font-size: 24px;\n  cursor: pointer;\n  padding: 8px;\n  border-radius: 6px;\n  color: #6b7280;\n  transition: all 0.2s;\n}\n\n.uicm-comments-table-close:hover {\n  background-color: #f3f4f6;\n  color: #374151;\n}\n\n/* Toolbar */\n.uicm-comments-table-toolbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 24px;\n  border-bottom: 1px solid #e5e7eb;\n  background: white;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n\n.uicm-comments-table-filters {\n  display: flex;\n  align-items: center;\n  gap: 18px;\n  flex-wrap: wrap;\n  padding: 4px 0;\n}\n\n.uicm-comments-table-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n\n/* Filter Controls */\n.uicm-search-input,\n.uicm-status-filter,\n.uicm-date-start,\n.uicm-date-end {\n  height: 40px;\n  min-width: 140px;\n  padding: 0 14px;\n  border: 1.5px solid #d1d5db;\n  border-radius: 999px;\n  font-size: 15px;\n  background: #f9fafb;\n  color: #374151;\n  transition: border-color 0.2s, box-shadow 0.2s;\n  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.03);\n  outline: none;\n  appearance: none;\n  margin: 0;\n  box-sizing: border-box;\n}\n\n.uicm-search-input {\n  min-width: 220px;\n  padding-left: 38px;\n  background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%239ca3af\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"M21 21l-4.35-4.35\"/></svg>');\n  background-repeat: no-repeat;\n  background-position: 12px center;\n  background-size: 18px 18px;\n}\n\n.uicm-status-filter {\n  min-width: 140px;\n  padding-right: 32px;\n  background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%239ca3af\" stroke-width=\"2\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M19 9l-7 7-7-7\"/></svg>');\n  background-repeat: no-repeat;\n  background-position: right 12px center;\n  background-size: 18px 18px;\n}\n\n.uicm-search-input:focus,\n.uicm-status-filter:focus,\n.uicm-date-start:focus,\n.uicm-date-end:focus {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n  background: #fff;\n}\n\n.uicm-search-input:hover,\n.uicm-status-filter:hover,\n.uicm-date-start:hover,\n.uicm-date-end:hover {\n  border-color: #a5b4fc;\n}\n\n.uicm-date-start,\n.uicm-date-end {\n  min-width: 120px;\n}\n\n/* Remove default arrow for select (for Chrome) */\n.uicm-status-filter::-ms-expand {\n  display: none;\n}\n.uicm-status-filter {\n  -webkit-appearance: none;\n  -moz-appearance: none;\n  appearance: none;\n}\n\n.uicm-clear-filters,\n.uicm-delete-selected,\n.uicm-export-excel,\n.uicm-edit-comment,\n.uicm-delete-comment {\n  font-weight: 600;\n  border-radius: 8px;\n  min-width: 90px;\n  height: 38px;\n  letter-spacing: 0.01em;\n  padding: 0 18px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  box-sizing: border-box;\n  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);\n  outline: none;\n  border-width: 1.5px;\n}\n\n.uicm-clear-filters {\n  background: #f3f4f6;\n  color: #374151;\n  border: 1.5px solid #d1d5db;\n}\n.uicm-clear-filters:hover {\n  background: #e5e7eb;\n  color: #111827;\n  border-color: #9ca3af;\n  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.07);\n}\n.uicm-clear-filters:active {\n  background: #d1d5db;\n  color: #111827;\n}\n\n.uicm-delete-selected {\n  background: #ef4444;\n  color: #fff;\n  border: 1.5px solid #ef4444;\n  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);\n}\n.uicm-delete-selected:hover:not(:disabled) {\n  background: #dc2626;\n  border-color: #dc2626;\n  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.13);\n}\n.uicm-delete-selected:active {\n  background: #b91c1c;\n  border-color: #b91c1c;\n}\n.uicm-delete-selected:disabled {\n  opacity: 0.7;\n  cursor: not-allowed;\n  box-shadow: none;\n}\n\n.uicm-export-excel {\n  background: #10b981;\n  color: #fff;\n  border: 1.5px solid #10b981;\n  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);\n}\n.uicm-export-excel:hover {\n  background: #059669;\n  border-color: #059669;\n  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.13);\n}\n.uicm-export-excel:active {\n  background: #047857;\n  border-color: #047857;\n}\n\n.uicm-edit-comment {\n  background: #f3f4f6;\n  color: #2563eb;\n  border: 1.5px solid #d1d5db;\n  margin-right: 6px;\n}\n.uicm-edit-comment:hover {\n  background: #dbeafe;\n  color: #1d4ed8;\n  border-color: #60a5fa;\n  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.07);\n}\n.uicm-edit-comment:active {\n  background: #bfdbfe;\n  color: #1e40af;\n}\n\n.uicm-delete-comment {\n  background: #fee2e2;\n  color: #dc2626;\n  border: 1.5px solid #fecaca;\n}\n.uicm-delete-comment:hover {\n  background: #fecaca;\n  color: #b91c1c;\n  border-color: #f87171;\n  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.07);\n}\n.uicm-delete-comment:active {\n  background: #fca5a5;\n  color: #991b1b;\n}\n\n/* Table Container */\n.uicm-comments-table-wrapper {\n  flex: 1;\n  overflow: auto;\n  padding: 0 24px;\n}\n\n/* Table */\n.uicm-comments-table {\n  width: 100%;\n  border-collapse: collapse;\n  margin: 0;\n}\n\n.uicm-comments-table th,\n.uicm-comments-table td {\n  padding: 14px 8px;\n  text-align: center;\n  border-bottom: 1px solid #e5e7eb;\n  vertical-align: middle;\n}\n\n.uicm-comments-table th {\n  background-color: #f9fafb;\n  font-weight: 600;\n  color: #222;\n  position: sticky;\n  top: 0;\n  z-index: 10;\n}\n\n.uicm-comments-table th.sortable {\n  cursor: pointer;\n  user-select: none;\n  transition: background-color 0.2s;\n}\n\n.uicm-comments-table th.sortable:hover {\n  background-color: #f3f4f6;\n}\n\n.sort-indicator {\n  margin-left: 4px;\n  color: #3b82f6;\n  font-weight: bold;\n}\n\n/* Table Rows */\n.uicm-comment-row {\n  transition: background-color 0.2s;\n}\n\n.uicm-comment-row:hover {\n  background-color: #f9fafb;\n}\n\n/* Table Cells */\n.date-cell {\n  min-width: 140px;\n  font-size: 13px;\n  color: #6b7280;\n}\n\n.author-cell {\n  min-width: 120px;\n}\n\n.author-name {\n  display: block;\n  font-weight: 500;\n  font-size: 14px;\n}\n\n.author-role {\n  display: block;\n  font-size: 12px;\n  color: #6b7280;\n  margin-top: 2px;\n}\n\n.status-cell {\n  min-width: 120px;\n}\n\n.status-badge {\n  display: inline-block;\n  padding: 4px 8px;\n  border-radius: 12px;\n  font-size: 12px;\n  font-weight: 500;\n  color: white;\n  text-transform: capitalize;\n}\n\n.content-cell {\n  max-width: 300px;\n  min-width: 200px;\n}\n\n.comment-content {\n  font-size: 14px;\n  line-height: 1.4;\n  margin-bottom: 4px;\n  word-break: break-word;\n}\n\n.attachment-count {\n  font-size: 12px;\n  color: #6b7280;\n  background: #f3f4f6;\n  padding: 2px 6px;\n  border-radius: 4px;\n  display: inline-block;\n}\n\n.url-cell {\n  max-width: 200px;\n  min-width: 150px;\n}\n\n.url-text {\n  font-size: 13px;\n  color: #6b7280;\n  word-break: break-all;\n}\n\n.replies-cell {\n  text-align: center;\n  width: 60px;\n}\n\n.replies-count {\n  display: inline-block;\n  background: #e5e7eb;\n  color: #374151;\n  padding: 2px 6px;\n  border-radius: 12px;\n  font-size: 12px;\n  font-weight: 500;\n  min-width: 20px;\n}\n\n.actions-cell {\n  min-width: 120px;\n  white-space: nowrap;\n}\n\n/* Checkboxes */\n.uicm-select-all,\n.uicm-comment-select {\n  width: 16px;\n  height: 16px;\n  cursor: pointer;\n}\n\n/* Footer */\n.uicm-comments-table-footer {\n  padding: 16px 24px;\n  border-top: 1px solid #e5e7eb;\n  background: #f9fafb;\n}\n\n.uicm-comments-count {\n  font-size: 14px;\n  color: #6b7280;\n}\n\n.total-count,\n.selected-count {\n  font-weight: 600;\n  color: #374151;\n}\n\n.uicm-status-badge {\n  display: inline-block;\n  min-width: 70px;\n  padding: 4px 12px;\n  border-radius: 999px;\n  font-size: 13px;\n  font-weight: 700;\n  color: #fff !important;\n  text-align: center;\n  background: #6b7280;\n}\n.uicm-status-badge[data-status=\"bug\"] {\n  background: #ef4444;\n}\n.uicm-status-badge[data-status=\"feature_request\"] {\n  background: #f59e0b;\n}\n.uicm-status-badge[data-status=\"dev_completed\"] {\n  background: #3b82f6;\n}\n.uicm-status-badge[data-status=\"done\"] {\n  background: #10b981;\n}\n.uicm-status-badge[data-status=\"archived\"] {\n  background: #6b7280;\n}\n\n/* Responsive */\n@media (max-width: 1200px) {\n  .uicm-comments-table-container {\n    width: 98vw;\n    height: 95vh;\n  }\n\n  .uicm-comments-table-toolbar {\n    flex-direction: column;\n    align-items: stretch;\n  }\n\n  .uicm-comments-table-filters,\n  .uicm-comments-table-actions {\n    justify-content: center;\n  }\n}\n\n@media (max-width: 768px) {\n  .uicm-comments-table-header {\n    padding: 16px;\n  }\n\n  .uicm-comments-table-toolbar {\n    padding: 12px 16px;\n  }\n\n  .uicm-comments-table-wrapper {\n    padding: 0 16px;\n  }\n\n  .uicm-comments-table th,\n  .uicm-comments-table td {\n    padding: 8px 4px;\n    font-size: 13px;\n  }\n\n  .content-cell {\n    max-width: 200px;\n    min-width: 150px;\n  }\n\n  .url-cell {\n    max-width: 120px;\n    min-width: 100px;\n  }\n\n  /* Responsive: stack filters on mobile */\n  .uicm-comments-table-filters {\n    flex-direction: column;\n    align-items: stretch;\n    gap: 10px;\n    padding: 0;\n  }\n  .uicm-search-input,\n  .uicm-status-filter,\n  .uicm-date-start,\n  .uicm-date-end {\n    min-width: 0;\n    width: 100%;\n    font-size: 15px;\n  }\n}\n\n/* Responsive button spacing */\n@media (max-width: 600px) {\n  .uicm-clear-filters,\n  .uicm-delete-selected,\n  .uicm-export-excel,\n  .uicm-edit-comment,\n  .uicm-delete-comment {\n    min-width: 70px;\n    font-size: 13px;\n    padding: 0 10px;\n    height: 34px;\n  }\n}\n";
    styleInject(css_248z$1);

    var css_248z = "/* Comments Table Button - Floating Icon Only */\n.uicm-comments-table-btn {\n  position: fixed;\n  bottom: 140px;\n  right: 20px;\n  width: 48px;\n  height: 48px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border-radius: 50%;\n  background: white;\n  border: 2px solid #e5e7eb;\n  cursor: pointer;\n  color: #6b7280;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),\n    0 2px 4px -1px rgba(0, 0, 0, 0.06);\n  z-index: 9999999999;\n  font-family: inherit;\n  opacity: 1;\n  transform: scale(1) translateY(0);\n  outline: none;\n  user-select: none;\n}\n\n.uicm-comments-table-btn[style*=\"display: none\"] {\n  opacity: 0;\n  transform: scale(0.8) translateY(20px);\n  pointer-events: none;\n}\n\n.uicm-comments-table-btn:hover {\n  background: #f9fafb;\n  border-color: #d1d5db;\n  color: #374151;\n  transform: scale(1.05);\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),\n    0 4px 6px -2px rgba(0, 0, 0, 0.05);\n}\n\n.uicm-comments-table-btn:active {\n  transform: scale(0.95);\n}\n\n.uicm-comments-table-btn:focus {\n  outline: none;\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n}\n\n.uicm-comments-table-btn svg {\n  width: 26px;\n  height: 26px;\n  display: block;\n  pointer-events: none;\n}\n\n.uicm-comments-table-btn-text {\n  display: none !important;\n}\n\n@media (prefers-color-scheme: dark) {\n  .uicm-comments-table-btn {\n    background: #374151;\n    border-color: #4b5563;\n    color: #d1d5db;\n  }\n  .uicm-comments-table-btn:hover {\n    background: #4b5563;\n    border-color: #6b7280;\n    color: #f9fafb;\n  }\n  .uicm-comments-table-btn:focus {\n    border-color: #60a5fa;\n    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);\n  }\n}\n\n@media (max-width: 768px) {\n  .uicm-comments-table-btn {\n    bottom: 24px;\n    right: 12px;\n    width: 44px;\n    height: 44px;\n  }\n  .uicm-comments-table-btn svg {\n    width: 22px;\n    height: 22px;\n  }\n}\n";
    styleInject(css_248z);

    class CommentStorage {
        // Load comments from localStorage
        static loadComments() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    return data.comments || [];
                }
            }
            catch (error) {
                console.error("Failed to load comments from storage:", error);
            }
            return [];
        }
        // Save comments to localStorage
        static saveComments(comments) {
            try {
                const data = {
                    comments,
                    lastUpdated: new Date().toISOString(),
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            }
            catch (error) {
                console.error("Failed to save comments to storage:", error);
            }
        }
        // Add a new comment
        static addComment(comment) {
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
        static updateComment(updatedComment) {
            const comments = this.loadComments();
            const index = comments.findIndex((c) => c.id === updatedComment.id);
            if (index !== -1) {
                comments[index] = updatedComment;
                this.saveComments(comments);
            }
            return updatedComment;
        }
        // Delete a comment
        static deleteComment(commentId) {
            const comments = this.loadComments();
            const filteredComments = comments.filter((c) => c.id !== commentId);
            this.saveComments(filteredComments);
        }
        // Get comments for specific URL
        static getCommentsForUrl(url) {
            const allComments = this.loadComments();
            return allComments.filter((comment) => comment.url === url);
        }
        // Get comments for specific element XPath
        static getCommentsForXPath(xpath, url) {
            const allComments = this.loadComments();
            return allComments.filter((comment) => comment.xpath === xpath && comment.url === url);
        }
        // Clear all comments (for development/testing)
        static clearAllComments() {
            localStorage.removeItem(this.STORAGE_KEY);
        }
        // Export comments to JSON file (for backup)
        static exportComments() {
            const comments = this.loadComments();
            return JSON.stringify({
                comments,
                exportedAt: new Date().toISOString(),
                version: "1.0.0",
            }, null, 2);
        }
        // Import comments from JSON string
        static importComments(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                if (data.comments && Array.isArray(data.comments)) {
                    this.saveComments(data.comments);
                }
            }
            catch (error) {
                console.error("Failed to import comments:", error);
            }
        }
        // Generate unique ID
        static generateId() {
            return ("comment_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
        }
        // Get storage info
        static getStorageInfo() {
            const comments = this.loadComments();
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const storageSize = stored ? new Blob([stored]).size : 0;
            let lastUpdated = null;
            try {
                const data = JSON.parse(stored || "{}");
                lastUpdated = data.lastUpdated || null;
            }
            catch (error) {
                // Ignore parse errors
            }
            return {
                totalComments: comments.length,
                storageSize,
                lastUpdated,
            };
        }
    }
    CommentStorage.STORAGE_KEY = "uicm-comments";

    /**
     * Creates a hybrid storage config for demo/development purposes
     * Saves comments to localStorage + exports to JSON file
     */
    function createHybridStorageConfig(projectId = "demo-project") {
        return {
            projectId,
            currentUser: {
                id: "user_demo",
                name: "Demo User",
                avatar: undefined,
            },
            theme: "light",
            onLoadComments: async () => {
                return await HybridCommentStorage.loadComments();
            },
            onSaveComment: async (comment) => {
                return await HybridCommentStorage.addComment(comment);
            },
            onDeleteComment: async (commentId) => {
                await HybridCommentStorage.deleteComment(commentId);
            },
            onUpdateComment: async (updatedComment) => {
                return await HybridCommentStorage.updateComment(updatedComment);
            },
        };
    }
    /**
     * Hybrid storage utilities for demo/development
     */
    const hybridStorageUtils = {
        /**
         * Load all comments from storage and show alert
         */
        loadAll: () => {
            HybridCommentStorage.loadComments().then((comments) => {
                alert(`Loaded ${comments.length} comments from storage`);
            });
        },
        /**
         * Export comments to JSON file
         */
        syncToFile: () => {
            HybridCommentStorage.syncToFile();
        },
        /**
         * Clear all comments from storage
         */
        clearAll: () => {
            HybridCommentStorage.clearAllComments().then(() => {
                alert("All comments cleared!");
                location.reload();
            });
        },
        /**
         * Show instructions in console
         */
        showInstructions: () => {
            console.log("🔧 Hybrid Storage Instructions:");
            console.log("- Comments are saved to localStorage + exported to JSON file");
            console.log("- Use loadAll() to load comments from storage");
            console.log("- Use syncToFile() to download comments as JSON");
            console.log("- Use clearAll() to clear all comments");
        },
    };

    class LocalStorageManager {
        constructor() {
            this.commentsKey = "uicm-comments";
            this.userProfileKey = "uicm-user-profile";
            this.projectKey = "uicm-demo-project";
        }
        getCommentsData() {
            try {
                const data = localStorage.getItem(this.commentsKey);
                if (!data) {
                    return null;
                }
                const parsedData = JSON.parse(data);
                return parsedData;
            }
            catch (error) {
                return null;
            }
        }
        getAllUICMData() {
            const allData = {};
            try {
                // Get all localStorage keys that start with 'uicm-'
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("uicm-")) {
                        try {
                            const value = localStorage.getItem(key);
                            if (value) {
                                allData[key] = JSON.parse(value);
                            }
                        }
                        catch (error) {
                            allData[key] = localStorage.getItem(key); // Store as string if JSON parse fails
                        }
                    }
                }
                return allData;
            }
            catch (error) {
                return {};
            }
        }
        clearCommentsData() {
            try {
                localStorage.removeItem(this.commentsKey);
            }
            catch (error) { }
        }
        exportCommentsData() {
            try {
                const data = this.getCommentsData();
                if (!data) {
                    return "";
                }
                const exportData = {
                    timestamp: new Date().toISOString(),
                    data: data,
                    version: "1.0.0",
                };
                const jsonString = JSON.stringify(exportData, null, 2);
                return jsonString;
            }
            catch (error) {
                return "";
            }
        }
        importCommentsData(data) {
            try {
                const parsedData = JSON.parse(data);
                // Handle both direct data and wrapped export format
                const commentsData = parsedData.data || parsedData;
                localStorage.setItem(this.commentsKey, JSON.stringify(commentsData));
                return true;
            }
            catch (error) {
                return false;
            }
        }
        getProjectData(projectId) {
            try {
                const key = `uicm-${projectId}`;
                const data = localStorage.getItem(key);
                if (!data) {
                    return null;
                }
                const parsedData = JSON.parse(data);
                return parsedData;
            }
            catch (error) {
                return null;
            }
        }
        getUserProfileData() {
            try {
                const data = localStorage.getItem(this.userProfileKey);
                if (!data) {
                    return null;
                }
                const parsedData = JSON.parse(data);
                return parsedData;
            }
            catch (error) {
                return null;
            }
        }
        displayAllData() {
            const allData = this.getAllUICMData();
            console.group("🔍 UICM LocalStorage Data");
            console.log("Total UICM keys found:", Object.keys(allData).length);
            Object.keys(allData).forEach((key) => {
                const value = allData[key];
                console.group(`📁 ${key}`);
                console.log("Type:", typeof value);
                console.log("Size:", JSON.stringify(value).length, "characters");
                console.log("Data:", value);
                console.groupEnd();
            });
            console.groupEnd();
        }
    }
    // Default instance
    const localStorageUtils = new LocalStorageManager();

    class GitHubGistStorage {
        constructor(config) {
            this.baseUrl = "https://api.github.com";
            this.config = config;
        }
        /**
         * Load comments from GitHub Gist
         */
        async loadComments() {
            try {
                const response = await fetch(`${this.baseUrl}/gists/${this.config.gistId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load gist: ${response.statusText}`);
                }
                const gist = await response.json();
                const file = gist.files[this.config.filename];
                if (!file) {
                    throw new Error(`File ${this.config.filename} not found in gist`);
                }
                const content = file.content;
                const data = JSON.parse(content);
                return data.comments || [];
            }
            catch (error) {
                console.error("Failed to load from GitHub Gist:", error);
                return [];
            }
        }
        /**
         * Save comments to GitHub Gist
         */
        async saveComments(comments) {
            try {
                const content = JSON.stringify({ comments }, null, 2);
                const headers = {
                    "Content-Type": "application/json",
                };
                // Add authorization if token is provided
                if (this.config.githubToken) {
                    headers["Authorization"] = `token ${this.config.githubToken}`;
                }
                const response = await fetch(`${this.baseUrl}/gists/${this.config.gistId}`, {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({
                        files: {
                            [this.config.filename]: {
                                content: content,
                            },
                        },
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Failed to save gist: ${response.statusText}`);
                }
                console.log("✅ Comments saved to GitHub Gist successfully");
            }
            catch (error) {
                console.error("Failed to save to GitHub Gist:", error);
                throw error;
            }
        }
        /**
         * Create a new gist (one-time setup)
         */
        static async createGist(filename, initialContent, githubToken, isPublic = true) {
            try {
                const headers = {
                    "Content-Type": "application/json",
                };
                if (githubToken) {
                    headers["Authorization"] = `token ${githubToken}`;
                }
                const response = await fetch("https://api.github.com/gists", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        description: "UI Comment SDK Data",
                        public: isPublic,
                        files: {
                            [filename]: {
                                content: initialContent,
                            },
                        },
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Failed to create gist: ${response.statusText}`);
                }
                const gist = await response.json();
                return gist.id;
            }
            catch (error) {
                console.error("Failed to create gist:", error);
                throw error;
            }
        }
        /**
         * Get gist URL for viewing
         */
        getGistUrl() {
            return `https://gist.github.com/${this.config.gistId}`;
        }
        /**
         * Get raw content URL
         */
        getRawUrl() {
            return `https://gist.githubusercontent.com/${this.config.gistId}/raw/${this.config.filename}`;
        }
    }

    class StorageOptimizer {
        /**
         * Analyze storage usage and provide statistics
         */
        static analyzeStorage(comments) {
            let totalSize = 0;
            let compressedSize = 0;
            let totalAttachments = 0;
            const processComments = (commentList) => {
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
                            }
                            else {
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
        static getRecommendations(stats) {
            const recommendations = [];
            if (stats.totalSize > 10 * 1024 * 1024) {
                // > 10MB
                recommendations.push("⚠️ Storage size is large (>10MB). Consider enabling image compression.");
            }
            if (stats.savingsPercentage < 20) {
                recommendations.push("💡 Enable image compression to reduce storage by 20-60%");
            }
            if (stats.totalAttachments > 50) {
                recommendations.push("📁 Consider implementing file cleanup for old attachments");
            }
            if (stats.totalSize > 50 * 1024 * 1024) {
                // > 50MB
                recommendations.push("🚨 Storage size is very large (>50MB). Consider external storage solution.");
            }
            return recommendations;
        }
        /**
         * Estimate JSON file size
         */
        static estimateJsonSize(comments) {
            const jsonString = JSON.stringify(comments);
            return new Blob([jsonString]).size;
        }
        /**
         * Clean up old attachments (older than X days)
         */
        static cleanupOldAttachments(comments, daysOld = 30) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cleanComments = (commentList) => {
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
        static formatSize(bytes) {
            if (bytes === 0)
                return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        }
    }

    // Main SDK exports
    // Version information
    const VERSION = "1.0.0";
    // Default export for UMD build
    var index = { initCommentSDK };

    exports.AdvancedImageCompressor = AdvancedImageCompressor;
    exports.CommentSDK = CommentSDK;
    exports.CommentStorage = CommentStorage;
    exports.CommentsTable = CommentsTable;
    exports.CommentsTableButton = CommentsTableButton;
    exports.GitHubGistStorage = GitHubGistStorage;
    exports.HybridCommentStorage = HybridCommentStorage;
    exports.ImageCompressor = ImageCompressor;
    exports.LocalStorageManager = LocalStorageManager;
    exports.LocalUserProfileStorage = LocalUserProfileStorage;
    exports.ProfileSettingsModal = ProfileSettingsModal;
    exports.SettingsButton = SettingsButton;
    exports.StorageOptimizer = StorageOptimizer;
    exports.VERSION = VERSION;
    exports.advancedUploadManager = advancedUploadManager;
    exports.base64UploadManager = base64UploadManager;
    exports.createCustomUploadManager = createCustomUploadManager;
    exports.createHybridStorageConfig = createHybridStorageConfig;
    exports.default = index;
    exports.hybridStorageUtils = hybridStorageUtils;
    exports.initCommentSDK = initCommentSDK;
    exports.localStorageUtils = localStorageUtils;
    exports.minimalUploadManager = minimalUploadManager;
    exports.userProfileStorage = userProfileStorage;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
