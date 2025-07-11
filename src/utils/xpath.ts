/**
 * Generate a stable XPath for a DOM element
 */
export function getElementXPath(element: Element): string {
  if (element.id !== "") {
    return `//*[@id="${element.id}"]`;
  }

  if (element === document.body) {
    return "/html/body";
  }

  let ix = 0;
  const siblings = element.parentNode?.childNodes || [];

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const tagName = element.tagName.toLowerCase();
      const parent = element.parentElement;
      if (parent) {
        const parentXPath = getElementXPath(parent);
        return `${parentXPath}/${tagName}[${ix + 1}]`;
      }
      return `/${tagName}[${ix + 1}]`;
    }
    if (
      sibling.nodeType === 1 &&
      (sibling as Element).tagName === element.tagName
    ) {
      ix++;
    }
  }

  throw new Error("Unable to generate XPath for element");
}

/**
 * Get element by XPath
 */
export function getElementByXPath(xpath: string): Element | null {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue as Element;
  } catch (error) {
    console.warn("Failed to resolve XPath:", xpath, error);
    return null;
  }
}

/**
 * Generate a more robust CSS selector for fallback
 */
export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  let selector = element.tagName.toLowerCase();

  if (element.className) {
    const classes = Array.from(element.classList)
      .filter((cls) => !cls.startsWith("uicm-")) // Exclude our SDK classes
      .slice(0, 3) // Limit to first 3 classes
      .join(".");
    if (classes) {
      selector += `.${classes}`;
    }
  }

  // Add nth-child if needed for uniqueness
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `:nth-of-type(${index})`;
    }
  }

  return selector;
}

/**
 * Validate if an element still exists and is visible
 */
export function isElementValid(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  return (
    element.isConnected &&
    htmlElement.offsetParent !== null &&
    getComputedStyle(element).display !== "none" &&
    getComputedStyle(element).visibility !== "hidden"
  );
}
