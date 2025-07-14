/**
 * Calculate center position for modals and forms
 */
export function getCenterPosition(
  element: HTMLElement,
  options: { padding?: number } = {}
): { x: number; y: number } {
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
 * Get the position of an element relative to the viewport
 */
export function getElementPosition(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * Ensure a modal/form stays within viewport boundaries
 */
export function constrainToViewport(
  element: HTMLElement,
  position: { x: number; y: number },
  options: {
    padding?: number;
    preferredSide?: "top" | "bottom" | "left" | "right";
  } = {}
): { x: number; y: number } {
  const { padding = 16, preferredSide = "bottom" } = options;

  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Get element dimensions (use getBoundingClientRect for accurate size)
  const rect = element.getBoundingClientRect();
  const elementWidth = rect.width || 400; // fallback width
  const elementHeight = rect.height || 300; // fallback height

  let { x, y } = position;

  // Constrain horizontal position
  if (x + elementWidth > viewportWidth - padding) {
    x = viewportWidth - elementWidth - padding;
  }
  if (x < padding) {
    x = padding;
  }

  // Constrain vertical position
  if (y + elementHeight > viewportHeight - padding) {
    if (preferredSide === "top") {
      // Try to position above the target
      y = position.y - elementHeight - padding;
    } else {
      // Position at bottom of viewport
      y = viewportHeight - elementHeight - padding;
    }
  }
  if (y < padding) {
    y = padding;
  }

  // If still outside viewport after adjustments, center it
  if (x < padding || x + elementWidth > viewportWidth - padding) {
    x = Math.max(padding, (viewportWidth - elementWidth) / 2);
  }
  if (y < padding || y + elementHeight > viewportHeight - padding) {
    y = Math.max(padding, (viewportHeight - elementHeight) / 2);
  }

  return { x, y };
}

/**
 * Reposition an element to ensure it stays within viewport after being added to DOM
 */
export function repositionInViewport(
  element: HTMLElement,
  options: {
    padding?: number;
    preferredSide?: "top" | "bottom" | "left" | "right";
  } = {}
): void {
  const { padding = 16, preferredSide = "bottom" } = options;

  // Get current position
  const currentLeft = parseFloat(element.style.left) || 0;
  const currentTop = parseFloat(element.style.top) || 0;

  // Constrain to viewport
  const constrainedPosition = constrainToViewport(
    element,
    {
      x: currentLeft,
      y: currentTop,
    },
    { padding, preferredSide }
  );

  // Apply new position
  element.style.left = `${constrainedPosition.x}px`;
  element.style.top = `${constrainedPosition.y}px`;
}

/**
 * Get viewport dimensions
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Calculate position from relative coordinates
 */
export function getAbsolutePositionFromRelative(
  element: Element,
  relativePosition: { x: number; y: number }
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width * relativePosition.x,
    y: rect.top + rect.height * relativePosition.y,
  };
}

/**
 * Calculate relative position within an element from absolute coordinates
 */
export function getRelativePositionFromAbsolute(
  element: Element,
  absolutePosition: { x: number; y: number }
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (absolutePosition.x - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (absolutePosition.y - rect.top) / rect.height)),
  };
}

/**
 * Get comment position from click event and target element
 */
export function getCommentPositionFromClick(
  element: Element,
  clickEvent: { clientX: number; clientY: number }
): {
  position: { x: number; y: number };
  relativePosition: { x: number; y: number };
} {
  const absolutePosition = { x: clickEvent.clientX, y: clickEvent.clientY };
  const relativePosition = getRelativePositionFromAbsolute(
    element,
    absolutePosition
  );

  return {
    position: absolutePosition,
    relativePosition,
  };
}

/**
 * Get the bounds of an element
 */
export function getElementBounds(element: Element): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Check if a point is within element bounds
 */
export function isPointInElement(
  x: number,
  y: number,
  element: Element
): boolean {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * Get the topmost element at a given point (excluding SDK elements)
 */
export function getElementAtPoint(x: number, y: number): Element | null {
  // Temporarily hide SDK elements
  const sdkElements = document.querySelectorAll("[data-uicm-element]");
  const originalDisplay: string[] = [];

  sdkElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    originalDisplay[index] = htmlEl.style.display;
    htmlEl.style.display = "none";
  });

  const element = document.elementFromPoint(x, y);

  // Restore SDK elements
  sdkElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.display = originalDisplay[index];
  });

  return element;
}

/**
 * Create a unique ID for elements (used for comment IDs)
 */
export function generateId(): string {
  return `uicm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create SDK root container if it doesn't exist
 */
export function ensureSDKRoot(): HTMLElement {
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
 * Remove SDK root and cleanup
 */
export function removeSDKRoot(): void {
  const root = document.getElementById("uicm-root");
  if (root) {
    root.remove();
  }
}

/**
 * Add global styles to the page
 */
export function injectGlobalStyles(css: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "uicm-styles";
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/**
 * Remove global styles
 */
export function removeGlobalStyles(): void {
  const style = document.getElementById("uicm-styles");
  if (style) {
    style.remove();
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if element is clickable (not covered by other elements)
 */
export function isElementClickable(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const topElement = document.elementFromPoint(centerX, centerY);
  return topElement === element || element.contains(topElement);
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element: Element): void {
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
}

/**
 * Get XPath of an element
 */
export function getXPath(element: Element): string {
  if (!element) return "";
  if (element.id) return `//*[@id="${element.id}"]`;

  const paths: string[] = [];
  let current = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let hasSibling = false;

    // Count previous siblings with same tag name
    let sibling = current.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        (sibling as Element).tagName === current.tagName
      ) {
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
    current = current.parentElement as Element;
  }

  return `/${paths.join("/")}`;
}
