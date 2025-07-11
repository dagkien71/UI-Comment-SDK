/**
 * Accessibility utilities for the Comment SDK
 */
export declare const ARIA_ROLES: {
    readonly COMMENT: "comment";
    readonly DIALOG: "dialog";
    readonly BUTTON: "button";
    readonly TEXTBOX: "textbox";
    readonly REGION: "region";
    readonly STATUS: "status";
    readonly FORM: "form";
    readonly LIST: "list";
    readonly LISTITEM: "listitem";
    readonly NAVIGATION: "navigation";
    readonly COMPLEMENTARY: "complementary";
};
export declare const ARIA_PROPERTIES: {
    readonly LABEL: "aria-label";
    readonly LABELLEDBY: "aria-labelledby";
    readonly DESCRIBEDBY: "aria-describedby";
    readonly EXPANDED: "aria-expanded";
    readonly HIDDEN: "aria-hidden";
    readonly LIVE: "aria-live";
    readonly ATOMIC: "aria-atomic";
    readonly RELEVANT: "aria-relevant";
    readonly BUSY: "aria-busy";
    readonly INVALID: "aria-invalid";
    readonly REQUIRED: "aria-required";
    readonly READONLY: "aria-readonly";
    readonly DISABLED: "aria-disabled";
    readonly PRESSED: "aria-pressed";
    readonly SELECTED: "aria-selected";
    readonly CONTROLS: "aria-controls";
    readonly OWNS: "aria-owns";
    readonly ACTIVEDESCENDANT: "aria-activedescendant";
    readonly HASPOPUP: "aria-haspopup";
    readonly LEVEL: "aria-level";
    readonly POSINSET: "aria-posinset";
    readonly SETSIZE: "aria-setsize";
};
export declare const KEYBOARD_KEYS: {
    readonly ENTER: "Enter";
    readonly SPACE: " ";
    readonly ESCAPE: "Escape";
    readonly TAB: "Tab";
    readonly ARROW_UP: "ArrowUp";
    readonly ARROW_DOWN: "ArrowDown";
    readonly ARROW_LEFT: "ArrowLeft";
    readonly ARROW_RIGHT: "ArrowRight";
    readonly HOME: "Home";
    readonly END: "End";
    readonly PAGE_UP: "PageUp";
    readonly PAGE_DOWN: "PageDown";
};
/**
 * Sets ARIA attributes on an element
 */
export declare function setAriaAttributes(element: HTMLElement, attributes: Record<string, string | boolean | number | undefined>): void;
/**
 * Creates an accessible button element
 */
export declare function createAccessibleButton(options: {
    text: string;
    onClick: () => void;
    className?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    disabled?: boolean;
}): HTMLButtonElement;
/**
 * Creates an accessible input element
 */
export declare function createAccessibleInput(options: {
    type?: string;
    placeholder?: string;
    value?: string;
    className?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    required?: boolean;
    disabled?: boolean;
    onChange?: (value: string) => void;
}): HTMLInputElement;
/**
 * Creates an accessible textarea element
 */
export declare function createAccessibleTextarea(options: {
    placeholder?: string;
    value?: string;
    className?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    required?: boolean;
    disabled?: boolean;
    rows?: number;
    cols?: number;
    onChange?: (value: string) => void;
}): HTMLTextAreaElement;
/**
 * Manages focus trap for modal dialogs
 */
export declare class FocusTrap {
    private element;
    private focusableElements;
    private firstFocusableElement;
    private lastFocusableElement;
    private previouslyFocusedElement;
    constructor(element: HTMLElement);
    private getFocusableElements;
    private handleKeyDown;
    activate(): void;
    release(): void;
    update(): void;
}
/**
 * Announces text to screen readers
 */
export declare class ScreenReaderAnnouncer {
    private container;
    constructor();
    private createAriaLiveRegion;
    announce(message: string, priority?: "polite" | "assertive"): void;
    destroy(): void;
}
/**
 * Keyboard navigation helper for lists
 */
export declare class KeyboardNavigationHelper {
    private items;
    private currentIndex;
    private container;
    private onSelect?;
    constructor(container: HTMLElement, options?: {
        onSelect?: (item: HTMLElement, index: number) => void;
    });
    setItems(items: HTMLElement[]): void;
    private updateAriaAttributes;
    private attachKeyboardListeners;
    private moveNext;
    private movePrevious;
    private moveToFirst;
    private moveToLast;
    private focusCurrent;
    private selectCurrent;
}
/**
 * Checks if an element is visible to screen readers
 */
export declare function isAccessible(element: HTMLElement): boolean;
/**
 * Generates unique IDs for accessibility relationships
 */
export declare function generateAccessibilityId(prefix?: string): string;
//# sourceMappingURL=accessibility.d.ts.map