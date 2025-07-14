/**
 * Throttle function - limits function execution to once per specified interval
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  let timeout: number | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      func(...args);
    } else if (!timeout) {
      timeout = window.setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func(...args);
      }, delay - (now - lastCall));
    }
  }) as T;
}

/**
 * Debounce function - delays function execution until after specified delay
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeout: number | null = null;

  return ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = window.setTimeout(() => {
      timeout = null;
      func(...args);
    }, delay);
  }) as T;
}

/**
 * Request animation frame throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => void>(func: T): T {
  let rafId: number | null = null;

  return ((...args: Parameters<T>) => {
    if (rafId) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      rafId = null;
      func(...args);
    });
  }) as T;
}

/**
 * Intersection Observer utility for efficient element visibility tracking
 */
export class VisibilityObserver {
  private observer: IntersectionObserver;
  private callbacks: Map<Element, (isVisible: boolean) => void> = new Map();

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callback = this.callbacks.get(entry.target);
        if (callback) {
          callback(entry.isIntersecting);
        }
      });
    }, options);
  }

  observe(element: Element, callback: (isVisible: boolean) => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  disconnect(): void {
    this.callbacks.clear();
    this.observer.disconnect();
  }
}

/**
 * Efficient event batching for high-frequency events
 */
export class EventBatcher {
  private queue: Array<() => void> = [];
  private isProcessing = false;

  add(callback: () => void): void {
    this.queue.push(callback);
    if (!this.isProcessing) {
      this.process();
    }
  }

  private process(): void {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    requestAnimationFrame(() => {
      const callbacks = this.queue.splice(0);
      callbacks.forEach((callback) => callback());
      this.process();
    });
  }
}

/**
 * Memory-efficient cache with LRU eviction
 */
export class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}
