export class ImageModal {
  private element: HTMLElement;
  private imageUrl: string;
  private isVisible = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private imageElement: HTMLImageElement | null = null;
  private currentScale = 1;
  private minScale = 0.5;
  private maxScale = 3;

  constructor(imageUrl: string) {
    this.imageUrl = imageUrl;
    this.element = this.createElement();
    this.setupEventListeners();
  }

  private createElement(): HTMLElement {
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

  private setupEventListeners(): void {
    // Close on background click (outside image)
    this.element.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      if (e.target === this.element) {
        this.hide();
      }
    });

    // Close button click
    const closeButton = this.element.querySelector(
      ".uicm-image-close"
    ) as HTMLElement;
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
        } else {
          this.zoomOut();
        }
      });
    }
  }

  private downloadImage(): void {
    const link = document.createElement("a");
    link.href = this.imageUrl;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private zoomIn(): void {
    if (this.imageElement && this.currentScale < this.maxScale) {
      this.currentScale = Math.min(this.maxScale, this.currentScale + 0.25);
      this.updateImageTransform();
      this.updateCursor();
    }
  }

  private zoomOut(): void {
    if (this.imageElement && this.currentScale > this.minScale) {
      this.currentScale = Math.max(this.minScale, this.currentScale - 0.25);
      this.updateImageTransform();
      this.updateCursor();
    }
  }

  private resetZoom(): void {
    if (this.imageElement) {
      this.currentScale = 1;
      this.updateImageTransform();
      this.updateCursor();
    }
  }

  private toggleZoom(): void {
    if (this.currentScale === 1) {
      this.zoomIn();
    } else {
      this.resetZoom();
    }
  }

  private updateImageTransform(): void {
    if (this.imageElement) {
      this.imageElement.style.transform = `scale(${this.currentScale})`;
    }
  }

  private updateCursor(): void {
    if (this.imageElement) {
      if (this.currentScale === 1) {
        this.imageElement.style.cursor = "zoom-in";
      } else {
        this.imageElement.style.cursor = "zoom-out";
      }
    }
  }

  public show(): void {
    if (!this.isVisible) {
      document.body.appendChild(this.element);
      this.isVisible = true;

      // Add escape key handler only when modal is visible
      this.keydownHandler = (e: KeyboardEvent) => {
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

  public hide(): void {
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

  public destroy(): void {
    this.hide();
    // Ensure keydown handler is removed
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
  }
}
