/**
 * Accessibility utilities for the Comment SDK
 */

// ARIA roles and properties
export const ARIA_ROLES = {
  COMMENT: "comment",
  DIALOG: "dialog",
  BUTTON: "button",
  TEXTBOX: "textbox",
  REGION: "region",
  STATUS: "status",
  FORM: "form",
  LIST: "list",
  LISTITEM: "listitem",
  NAVIGATION: "navigation",
  COMPLEMENTARY: "complementary",
} as const;

export const ARIA_PROPERTIES = {
  LABEL: "aria-label",
  LABELLEDBY: "aria-labelledby",
  DESCRIBEDBY: "aria-describedby",
  EXPANDED: "aria-expanded",
  HIDDEN: "aria-hidden",
  LIVE: "aria-live",
  ATOMIC: "aria-atomic",
  RELEVANT: "aria-relevant",
  BUSY: "aria-busy",
  INVALID: "aria-invalid",
  REQUIRED: "aria-required",
  READONLY: "aria-readonly",
  DISABLED: "aria-disabled",
  PRESSED: "aria-pressed",
  SELECTED: "aria-selected",
  CONTROLS: "aria-controls",
  OWNS: "aria-owns",
  ACTIVEDESCENDANT: "aria-activedescendant",
  HASPOPUP: "aria-haspopup",
  LEVEL: "aria-level",
  POSINSET: "aria-posinset",
  SETSIZE: "aria-setsize",
} as const;

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

/**
 * Sets ARIA attributes on an element
 */
export function setAriaAttributes(
  element: HTMLElement,
  attributes: Record<string, string | boolean | number | undefined>
): void {
  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      const value = attributes[key];
      if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      } else {
        element.removeAttribute(key);
      }
    }
  }
}

/**
 * Creates an accessible button element
 */
export function createAccessibleButton(options: {
  text: string;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
}): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = options.text;
  button.className = options.className || "";
  button.addEventListener("click", options.onClick);

  setAriaAttributes(button, {
    [ARIA_PROPERTIES.LABEL]: options.ariaLabel || options.text,
    [ARIA_PROPERTIES.DESCRIBEDBY]: options.ariaDescribedBy,
    [ARIA_PROPERTIES.DISABLED]: options.disabled || false,
  });

  if (options.disabled) {
    button.disabled = true;
  }

  return button;
}

/**
 * Creates an accessible input element
 */
export function createAccessibleInput(options: {
  type?: string;
  placeholder?: string;
  value?: string;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}): HTMLInputElement {
  const input = document.createElement("input");
  input.type = options.type || "text";
  input.placeholder = options.placeholder || "";
  input.value = options.value || "";
  input.className = options.className || "";

  if (options.onChange) {
    input.addEventListener("input", (e) => {
      options.onChange!((e.target as HTMLInputElement).value);
    });
  }

  setAriaAttributes(input, {
    [ARIA_PROPERTIES.LABEL]: options.ariaLabel,
    [ARIA_PROPERTIES.DESCRIBEDBY]: options.ariaDescribedBy,
    [ARIA_PROPERTIES.REQUIRED]: options.required || false,
    [ARIA_PROPERTIES.DISABLED]: options.disabled || false,
    [ARIA_PROPERTIES.INVALID]: false,
  });

  if (options.disabled) {
    input.disabled = true;
  }

  if (options.required) {
    input.required = true;
  }

  return input;
}

/**
 * Creates an accessible textarea element
 */
export function createAccessibleTextarea(options: {
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
}): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  textarea.placeholder = options.placeholder || "";
  textarea.value = options.value || "";
  textarea.className = options.className || "";
  textarea.rows = options.rows || 3;
  textarea.cols = options.cols || 40;

  if (options.onChange) {
    textarea.addEventListener("input", (e) => {
      options.onChange!((e.target as HTMLTextAreaElement).value);
    });
  }

  setAriaAttributes(textarea, {
    [ARIA_PROPERTIES.LABEL]: options.ariaLabel,
    [ARIA_PROPERTIES.DESCRIBEDBY]: options.ariaDescribedBy,
    [ARIA_PROPERTIES.REQUIRED]: options.required || false,
    [ARIA_PROPERTIES.DISABLED]: options.disabled || false,
    [ARIA_PROPERTIES.INVALID]: false,
  });

  if (options.disabled) {
    textarea.disabled = true;
  }

  if (options.required) {
    textarea.required = true;
  }

  return textarea;
}

/**
 * Manages focus trap for modal dialogs
 */
export class FocusTrap {
  private element: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ];

    return Array.from(
      this.element.querySelectorAll(focusableSelectors.join(", "))
    ) as HTMLElement[];
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === KEYBOARD_KEYS.TAB) {
      if (this.focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab - move backwards
        if (document.activeElement === this.firstFocusableElement) {
          e.preventDefault();
          this.lastFocusableElement?.focus();
        }
      } else {
        // Tab - move forwards
        if (document.activeElement === this.lastFocusableElement) {
          e.preventDefault();
          this.firstFocusableElement?.focus();
        }
      }
    }

    if (e.key === KEYBOARD_KEYS.ESCAPE) {
      this.release();
    }
  };

  activate(): void {
    this.focusableElements = this.getFocusableElements();
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement =
      this.focusableElements[this.focusableElements.length - 1] || null;

    document.addEventListener("keydown", this.handleKeyDown);

    // Focus the first focusable element
    if (this.firstFocusableElement) {
      this.firstFocusableElement.focus();
    }
  }

  release(): void {
    document.removeEventListener("keydown", this.handleKeyDown);

    // Restore focus to the previously focused element
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  update(): void {
    this.focusableElements = this.getFocusableElements();
    this.firstFocusableElement = this.focusableElements[0] || null;
    this.lastFocusableElement =
      this.focusableElements[this.focusableElements.length - 1] || null;
  }
}

/**
 * Announces text to screen readers
 */
export class ScreenReaderAnnouncer {
  private container: HTMLElement;

  constructor() {
    this.container = this.createAriaLiveRegion();
    document.body.appendChild(this.container);
  }

  private createAriaLiveRegion(): HTMLElement {
    const region = document.createElement("div");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    return region;
  }

  announce(message: string, priority: "polite" | "assertive" = "polite"): void {
    this.container.setAttribute("aria-live", priority);
    this.container.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.container.textContent = "";
    }, 1000);
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

/**
 * Keyboard navigation helper for lists
 */
export class KeyboardNavigationHelper {
  private items: HTMLElement[] = [];
  private currentIndex = -1;
  private container: HTMLElement;
  private onSelect?: (item: HTMLElement, index: number) => void;

  constructor(
    container: HTMLElement,
    options: {
      onSelect?: (item: HTMLElement, index: number) => void;
    } = {}
  ) {
    this.container = container;
    this.onSelect = options.onSelect;
    this.attachKeyboardListeners();
  }

  setItems(items: HTMLElement[]): void {
    this.items = items;
    this.updateAriaAttributes();
  }

  private updateAriaAttributes(): void {
    this.items.forEach((item, index) => {
      setAriaAttributes(item, {
        [ARIA_PROPERTIES.POSINSET]: index + 1,
        [ARIA_PROPERTIES.SETSIZE]: this.items.length,
        tabindex: index === this.currentIndex ? 0 : -1,
      });
    });
  }

  private attachKeyboardListeners(): void {
    this.container.addEventListener("keydown", (e) => {
      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_DOWN:
          e.preventDefault();
          this.moveNext();
          break;
        case KEYBOARD_KEYS.ARROW_UP:
          e.preventDefault();
          this.movePrevious();
          break;
        case KEYBOARD_KEYS.HOME:
          e.preventDefault();
          this.moveToFirst();
          break;
        case KEYBOARD_KEYS.END:
          e.preventDefault();
          this.moveToLast();
          break;
        case KEYBOARD_KEYS.ENTER:
        case KEYBOARD_KEYS.SPACE:
          e.preventDefault();
          this.selectCurrent();
          break;
      }
    });
  }

  private moveNext(): void {
    this.currentIndex = Math.min(this.currentIndex + 1, this.items.length - 1);
    this.focusCurrent();
  }

  private movePrevious(): void {
    this.currentIndex = Math.max(this.currentIndex - 1, 0);
    this.focusCurrent();
  }

  private moveToFirst(): void {
    this.currentIndex = 0;
    this.focusCurrent();
  }

  private moveToLast(): void {
    this.currentIndex = this.items.length - 1;
    this.focusCurrent();
  }

  private focusCurrent(): void {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      this.items[this.currentIndex].focus();
      this.updateAriaAttributes();
    }
  }

  private selectCurrent(): void {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      const currentItem = this.items[this.currentIndex];
      this.onSelect?.(currentItem, this.currentIndex);
    }
  }
}

/**
 * Checks if an element is visible to screen readers
 */
export function isAccessible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return !(
    style.display === "none" ||
    style.visibility === "hidden" ||
    element.getAttribute("aria-hidden") === "true" ||
    element.hasAttribute("hidden")
  );
}

/**
 * Generates unique IDs for accessibility relationships
 */
export function generateAccessibilityId(prefix: string = "uicm-a11y"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
