/**
 * Get the position of an element relative to the viewport
 */
export declare function getElementPosition(element: Element): {
    x: number;
    y: number;
};
/**
 * Ensure a modal/form stays within viewport boundaries
 */
export declare function constrainToViewport(element: HTMLElement, position: {
    x: number;
    y: number;
}, options?: {
    padding?: number;
    preferredSide?: "top" | "bottom" | "left" | "right";
}): {
    x: number;
    y: number;
};
/**
 * Reposition an element to ensure it stays within viewport after being added to DOM
 */
export declare function repositionInViewport(element: HTMLElement, options?: {
    padding?: number;
    preferredSide?: "top" | "bottom" | "left" | "right";
}): void;
/**
 * Get viewport dimensions
 */
export declare function getViewportSize(): {
    width: number;
    height: number;
};
/**
 * Calculate position from relative coordinates
 */
export declare function getAbsolutePositionFromRelative(element: Element, relativePosition: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
/**
 * Calculate relative position within an element from absolute coordinates
 */
export declare function getRelativePositionFromAbsolute(element: Element, absolutePosition: {
    x: number;
    y: number;
}): {
    x: number;
    y: number;
};
/**
 * Get comment position from click event and target element
 */
export declare function getCommentPositionFromClick(element: Element, clickEvent: {
    clientX: number;
    clientY: number;
}): {
    position: {
        x: number;
        y: number;
    };
    relativePosition: {
        x: number;
        y: number;
    };
};
/**
 * Get the bounds of an element
 */
export declare function getElementBounds(element: Element): DOMRect;
/**
 * Check if a point is within element bounds
 */
export declare function isPointInElement(x: number, y: number, element: Element): boolean;
/**
 * Get the topmost element at a given point (excluding SDK elements)
 */
export declare function getElementAtPoint(x: number, y: number): Element | null;
/**
 * Create a unique ID for elements (used for comment IDs)
 */
export declare function generateId(): string;
/**
 * Create SDK root container if it doesn't exist
 */
export declare function ensureSDKRoot(): HTMLElement;
/**
 * Remove SDK root and cleanup
 */
export declare function removeSDKRoot(): void;
/**
 * Add global styles to the page
 */
export declare function injectGlobalStyles(css: string): HTMLStyleElement;
/**
 * Remove global styles
 */
export declare function removeGlobalStyles(): void;
/**
 * Debounce function for performance optimization
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Check if element is clickable (not covered by other elements)
 */
export declare function isElementClickable(element: Element): boolean;
/**
 * Scroll element into view smoothly
 */
export declare function scrollIntoView(element: Element): void;
/**
 * Get XPath of an element
 */
export declare function getXPath(element: Element): string;
//# sourceMappingURL=dom.d.ts.map