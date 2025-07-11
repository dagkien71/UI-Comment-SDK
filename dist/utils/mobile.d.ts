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
    center: {
        x: number;
        y: number;
    };
    startDistance: number;
    currentDistance: number;
}
/**
 * Detects if the device supports touch
 */
export declare function isTouchDevice(): boolean;
/**
 * Detects if the device is mobile based on screen size and user agent
 */
export declare function isMobileDevice(): boolean;
/**
 * Gets the current viewport size
 */
export declare function getViewportSize(): {
    width: number;
    height: number;
};
/**
 * Checks if the device is in landscape mode
 */
export declare function isLandscape(): boolean;
/**
 * Touch gesture recognizer
 */
export declare class TouchGestureRecognizer {
    private element;
    private isTracking;
    private startTouch;
    private lastTouch;
    private onSwipe?;
    private onTap?;
    private onLongPress?;
    private onPinch?;
    private readonly SWIPE_THRESHOLD;
    private readonly SWIPE_TIMEOUT;
    private readonly TAP_TIMEOUT;
    private readonly LONG_PRESS_TIMEOUT;
    private longPressTimer;
    private tapTimer;
    constructor(element: HTMLElement, options?: {
        onSwipe?: (gesture: SwipeGesture) => void;
        onTap?: (event: TouchEventData) => void;
        onLongPress?: (event: TouchEventData) => void;
        onPinch?: (gesture: PinchGesture) => void;
    });
    private attachEventListeners;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private handleTouchCancel;
    private handlePinchStart;
    private handlePinchMove;
    private createTouchEventData;
    private getDistance;
    private getSwipeDirection;
    destroy(): void;
}
/**
 * Responsive breakpoints utility
 */
export declare class ResponsiveBreakpoints {
    private static readonly BREAKPOINTS;
    static getCurrentBreakpoint(): string;
    static isMobile(): boolean;
    static isTablet(): boolean;
    static isDesktop(): boolean;
}
/**
 * Viewport positioning utility for mobile
 */
export declare class ViewportPositioning {
    static adjustPositionForMobile(element: HTMLElement, targetPosition: {
        x: number;
        y: number;
    }, options?: {
        padding?: number;
        preferredSide?: "top" | "bottom" | "left" | "right";
        allowOverflow?: boolean;
    }): {
        x: number;
        y: number;
    };
    static centerInViewport(element: HTMLElement): {
        x: number;
        y: number;
    };
    static getOptimalPosition(element: HTMLElement, targetElement: HTMLElement, options?: {
        placement?: "top" | "bottom" | "left" | "right" | "auto";
        offset?: number;
        padding?: number;
    }): {
        x: number;
        y: number;
        placement: string;
    };
}
/**
 * Mobile-specific CSS utilities
 */
export declare function addMobileCSS(): void;
/**
 * Removes mobile-specific CSS
 */
export declare function removeMobileCSS(): void;
//# sourceMappingURL=mobile.d.ts.map