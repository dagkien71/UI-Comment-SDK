/**
 * Animation utilities for smooth transitions and micro-interactions
 */
export interface AnimationOptions {
    duration?: number;
    easing?: string;
    delay?: number;
    fill?: "none" | "forwards" | "backwards" | "both";
}
export interface TransitionOptions extends AnimationOptions {
    property?: string;
}
/**
 * Predefined easing functions
 */
export declare const EASING: {
    readonly EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)";
    readonly EASE_IN: "cubic-bezier(0.4, 0, 1, 1)";
    readonly BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    readonly SPRING: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    readonly SMOOTH: "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    readonly SHARP: "cubic-bezier(0.4, 0, 0.6, 1)";
};
/**
 * Animation durations in milliseconds
 */
export declare const DURATION: {
    readonly FASTEST: 150;
    readonly FAST: 200;
    readonly NORMAL: 300;
    readonly SLOW: 500;
    readonly SLOWEST: 800;
};
/**
 * Fade in animation
 */
export declare function fadeIn(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Fade out animation
 */
export declare function fadeOut(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Scale in animation
 */
export declare function scaleIn(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Scale out animation
 */
export declare function scaleOut(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Slide in from direction
 */
export declare function slideIn(element: HTMLElement, direction?: "up" | "down" | "left" | "right", options?: AnimationOptions): Promise<void>;
/**
 * Pulse animation for attention
 */
export declare function pulse(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Shake animation for errors
 */
export declare function shake(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Button press animation
 */
export declare function buttonPress(element: HTMLElement, options?: AnimationOptions): Promise<void>;
/**
 * Ripple effect animation
 */
export declare function ripple(element: HTMLElement, event: MouseEvent | TouchEvent, options?: AnimationOptions): Promise<void>;
/**
 * Loading spinner component
 */
export declare class LoadingSpinner {
    private element;
    private animation;
    constructor(options?: {
        size?: number;
        color?: string;
        strokeWidth?: number;
    });
    private createElement;
    start(): void;
    stop(): void;
    getElement(): HTMLElement;
    destroy(): void;
}
/**
 * Progress bar component
 */
export declare class ProgressBar {
    private element;
    private progressBar;
    private currentProgress;
    constructor(options?: {
        height?: number;
        color?: string;
        backgroundColor?: string;
        borderRadius?: number;
    });
    private createElement;
    setProgress(progress: number, animated?: boolean): Promise<void>;
    getProgress(): number;
    getElement(): HTMLElement;
    destroy(): void;
}
/**
 * Add CSS transitions to element
 */
export declare function addTransition(element: HTMLElement, options?: TransitionOptions): void;
/**
 * Remove CSS transitions from element
 */
export declare function removeTransition(element: HTMLElement): void;
/**
 * Smooth scroll to element
 */
export declare function smoothScrollTo(element: HTMLElement, options?: {
    behavior?: "smooth" | "auto";
    block?: "start" | "center" | "end" | "nearest";
    inline?: "start" | "center" | "end" | "nearest";
}): void;
/**
 * Micro-interaction for hover effects
 */
export declare function addHoverEffect(element: HTMLElement, options?: {
    scale?: number;
    translateY?: number;
    brightness?: number;
    duration?: number;
}): void;
/**
 * Sequential animation helper
 */
export declare function sequence(animations: Array<() => Promise<void>>, delay?: number): Promise<void>;
/**
 * Parallel animation helper
 */
export declare function parallel(animations: Array<() => Promise<void>>): Promise<void[]>;
