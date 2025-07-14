/**
 * Generate a stable XPath for a DOM element
 */
export declare function getElementXPath(element: Element): string;
/**
 * Get element by XPath
 */
export declare function getElementByXPath(xpath: string): Element | null;
/**
 * Generate a more robust CSS selector for fallback
 */
export declare function getElementSelector(element: Element): string;
/**
 * Validate if an element still exists and is visible
 */
export declare function isElementValid(element: Element): boolean;
