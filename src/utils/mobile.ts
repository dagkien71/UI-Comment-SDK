/**
 * Mobile utilities for touch interactions and responsive design
 */

export interface TouchEventData {
  x: number;
  y: number;
  timestamp: number;
  target: Element;
}

export interface SwipeGesture {
  direction: "left" | "right" | "up" | "down";
  distance: number;
  duration: number;
  startPoint: TouchEventData;
  endPoint: TouchEventData;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  startDistance: number;
  currentDistance: number;
}

/**
 * Detects if the device supports touch
 */
export function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Detects if the device is mobile based on screen size and user agent
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = ["android", "iphone", "ipad", "mobile", "tablet"];
  const hasKeyword = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );
  const hasSmallScreen = window.innerWidth <= 768;

  return hasKeyword || hasSmallScreen;
}

/**
 * Gets the current viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Checks if the device is in landscape mode
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

/**
 * Touch gesture recognizer
 */
export class TouchGestureRecognizer {
  private element: HTMLElement;
  private isTracking: boolean = false;
  private startTouch: TouchEventData | null = null;
  private lastTouch: TouchEventData | null = null;
  private onSwipe?: (gesture: SwipeGesture) => void;
  private onTap?: (event: TouchEventData) => void;
  private onLongPress?: (event: TouchEventData) => void;
  private onPinch?: (gesture: PinchGesture) => void;

  private readonly SWIPE_THRESHOLD = 50; // minimum distance for swipe
  private readonly SWIPE_TIMEOUT = 500; // maximum time for swipe
  private readonly TAP_TIMEOUT = 300; // maximum time for tap
  private readonly LONG_PRESS_TIMEOUT = 500; // minimum time for long press

  private longPressTimer: number | null = null;
  private tapTimer: number | null = null;

  constructor(
    element: HTMLElement,
    options: {
      onSwipe?: (gesture: SwipeGesture) => void;
      onTap?: (event: TouchEventData) => void;
      onLongPress?: (event: TouchEventData) => void;
      onPinch?: (gesture: PinchGesture) => void;
    } = {}
  ) {
    this.element = element;
    this.onSwipe = options.onSwipe;
    this.onTap = options.onTap;
    this.onLongPress = options.onLongPress;
    this.onPinch = options.onPinch;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
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

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      // Single touch
      const touch = e.touches[0];
      this.startTouch = this.createTouchEventData(touch, e.target as Element);
      this.lastTouch = this.startTouch;
      this.isTracking = true;

      // Start long press timer
      this.longPressTimer = window.setTimeout(() => {
        if (this.isTracking && this.startTouch && this.onLongPress) {
          this.onLongPress(this.startTouch);
        }
      }, this.LONG_PRESS_TIMEOUT);
    } else if (e.touches.length === 2 && this.onPinch) {
      // Multi-touch for pinch
      this.handlePinchStart(e);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isTracking) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.lastTouch = this.createTouchEventData(touch, e.target as Element);

      // Cancel long press on move
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // Prevent default to avoid scrolling during gesture
      e.preventDefault();
    } else if (e.touches.length === 2 && this.onPinch) {
      this.handlePinchMove(e);
    }
  };

  private handleTouchEnd = (e: TouchEvent): void => {
    if (!this.isTracking || !this.startTouch || !this.lastTouch) return;

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
    } else if (
      distance >= this.SWIPE_THRESHOLD &&
      duration < this.SWIPE_TIMEOUT
    ) {
      // Swipe gesture
      if (this.onSwipe) {
        const direction = this.getSwipeDirection(
          this.startTouch,
          this.lastTouch
        );
        const gesture: SwipeGesture = {
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

  private handleTouchCancel = (): void => {
    this.isTracking = false;
    this.startTouch = null;
    this.lastTouch = null;

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private handlePinchStart(e: TouchEvent): void {
    // Implement pinch gesture logic if needed
    // For now, just prevent default
    e.preventDefault();
  }

  private handlePinchMove(e: TouchEvent): void {
    // Implement pinch gesture logic if needed
    e.preventDefault();
  }

  private createTouchEventData(touch: Touch, target: Element): TouchEventData {
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      target,
    };
  }

  private getDistance(start: TouchEventData, end: TouchEventData): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getSwipeDirection(
    start: TouchEventData,
    end: TouchEventData
  ): SwipeGesture["direction"] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }

  public destroy(): void {
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
 * Responsive breakpoints utility
 */
export class ResponsiveBreakpoints {
  private static readonly BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  };

  static getCurrentBreakpoint(): string {
    const width = window.innerWidth;

    if (width >= this.BREAKPOINTS.xxl) return "xxl";
    if (width >= this.BREAKPOINTS.xl) return "xl";
    if (width >= this.BREAKPOINTS.lg) return "lg";
    if (width >= this.BREAKPOINTS.md) return "md";
    if (width >= this.BREAKPOINTS.sm) return "sm";
    return "xs";
  }

  static isMobile(): boolean {
    return window.innerWidth < this.BREAKPOINTS.md;
  }

  static isTablet(): boolean {
    return (
      window.innerWidth >= this.BREAKPOINTS.md &&
      window.innerWidth < this.BREAKPOINTS.lg
    );
  }

  static isDesktop(): boolean {
    return window.innerWidth >= this.BREAKPOINTS.lg;
  }
}

/**
 * Viewport positioning utility for mobile
 */
export class ViewportPositioning {
  static adjustPositionForMobile(
    element: HTMLElement,
    targetPosition: { x: number; y: number },
    options: {
      padding?: number;
      preferredSide?: "top" | "bottom" | "left" | "right";
      allowOverflow?: boolean;
    } = {}
  ): { x: number; y: number } {
    const {
      padding = 16,
      preferredSide = "bottom",
      allowOverflow = false,
    } = options;
    const viewport = getViewportSize();
    const elementRect = element.getBoundingClientRect();

    let { x, y } = targetPosition;

    // Adjust horizontal position
    if (x + elementRect.width > viewport.width - padding) {
      x = viewport.width - elementRect.width - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position
    if (y + elementRect.height > viewport.height - padding) {
      if (preferredSide === "top") {
        y = targetPosition.y - elementRect.height - padding;
      } else {
        y = viewport.height - elementRect.height - padding;
      }
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }

  static centerInViewport(element: HTMLElement): { x: number; y: number } {
    const viewport = getViewportSize();
    const elementRect = element.getBoundingClientRect();

    return {
      x: (viewport.width - elementRect.width) / 2,
      y: (viewport.height - elementRect.height) / 2,
    };
  }

  static getOptimalPosition(
    element: HTMLElement,
    targetElement: HTMLElement,
    options: {
      placement?: "top" | "bottom" | "left" | "right" | "auto";
      offset?: number;
      padding?: number;
    } = {}
  ): { x: number; y: number; placement: string } {
    const { placement = "auto", offset = 8, padding = 16 } = options;
    const viewport = getViewportSize();
    const targetRect = targetElement.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const positions = {
      top: {
        x: targetRect.left + (targetRect.width - elementRect.width) / 2,
        y: targetRect.top - elementRect.height - offset,
      },
      bottom: {
        x: targetRect.left + (targetRect.width - elementRect.width) / 2,
        y: targetRect.bottom + offset,
      },
      left: {
        x: targetRect.left - elementRect.width - offset,
        y: targetRect.top + (targetRect.height - elementRect.height) / 2,
      },
      right: {
        x: targetRect.right + offset,
        y: targetRect.top + (targetRect.height - elementRect.height) / 2,
      },
    };

    if (placement !== "auto") {
      const pos = positions[placement];
      return { ...pos, placement };
    }

    // Auto placement - find the best position
    const placements = ["bottom", "top", "right", "left"] as const;

    for (const p of placements) {
      const pos = positions[p];
      const fitsHorizontally =
        pos.x >= padding &&
        pos.x + elementRect.width <= viewport.width - padding;
      const fitsVertically =
        pos.y >= padding &&
        pos.y + elementRect.height <= viewport.height - padding;

      if (fitsHorizontally && fitsVertically) {
        return { ...pos, placement: p };
      }
    }

    // If no position fits perfectly, use bottom with adjustments
    const pos = positions.bottom;
    return {
      x: Math.max(
        padding,
        Math.min(pos.x, viewport.width - elementRect.width - padding)
      ),
      y: Math.max(
        padding,
        Math.min(pos.y, viewport.height - elementRect.height - padding)
      ),
      placement: "bottom",
    };
  }
}

/**
 * Mobile-specific CSS utilities
 */
export function addMobileCSS(): void {
  if (document.getElementById("uicm-mobile-styles")) return;

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
export function removeMobileCSS(): void {
  const style = document.getElementById("uicm-mobile-styles");
  if (style) {
    style.remove();
  }
}
