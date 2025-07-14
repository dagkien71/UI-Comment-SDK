/**
 * Throttle function - limits function execution to once per specified interval
 */
export declare function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T;
/**
 * Debounce function - delays function execution until after specified delay
 */
export declare function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T;
/**
 * Request animation frame throttle for smooth animations
 */
export declare function rafThrottle<T extends (...args: any[]) => void>(func: T): T;
/**
 * Intersection Observer utility for efficient element visibility tracking
 */
export declare class VisibilityObserver {
    private observer;
    private callbacks;
    constructor(options?: IntersectionObserverInit);
    observe(element: Element, callback: (isVisible: boolean) => void): void;
    unobserve(element: Element): void;
    disconnect(): void;
}
/**
 * Efficient event batching for high-frequency events
 */
export declare class EventBatcher {
    private queue;
    private isProcessing;
    add(callback: () => void): void;
    private process;
}
/**
 * Memory-efficient cache with LRU eviction
 */
export declare class LRUCache<K, V> {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    clear(): void;
}
