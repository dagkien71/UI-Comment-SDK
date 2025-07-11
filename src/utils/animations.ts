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
export const EASING = {
  EASE_IN_OUT: "cubic-bezier(0.4, 0, 0.2, 1)",
  EASE_OUT: "cubic-bezier(0, 0, 0.2, 1)",
  EASE_IN: "cubic-bezier(0.4, 0, 1, 1)",
  BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  SPRING: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  SMOOTH: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  SHARP: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

/**
 * Animation durations in milliseconds
 */
export const DURATION = {
  FASTEST: 150,
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  SLOWEST: 800,
} as const;

/**
 * Fade in animation
 */
export function fadeIn(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.NORMAL,
    easing = EASING.EASE_OUT,
    delay = 0,
    fill = "forwards",
  } = options;

  element.style.opacity = "0";
  element.style.display = "block";

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(10px) scale(0.95)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration,
        easing,
        delay,
        fill,
      }
    );

    animation.onfinish = () => {
      element.style.opacity = "1";
      element.style.transform = "none";
      resolve();
    };
  });
}

/**
 * Fade out animation
 */
export function fadeOut(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.NORMAL,
    easing = EASING.EASE_IN,
    delay = 0,
    fill = "forwards",
  } = options;

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { opacity: 1, transform: "translateY(0) scale(1)" },
        { opacity: 0, transform: "translateY(-10px) scale(0.95)" },
      ],
      {
        duration,
        easing,
        delay,
        fill,
      }
    );

    animation.onfinish = () => {
      element.style.display = "none";
      resolve();
    };
  });
}

/**
 * Scale in animation
 */
export function scaleIn(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.FAST,
    easing = EASING.BOUNCE,
    delay = 0,
    fill = "forwards",
  } = options;

  element.style.transform = "scale(0)";
  element.style.display = "block";

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: "scale(0)", opacity: 0 },
        { transform: "scale(1.05)", opacity: 0.8, offset: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ],
      {
        duration,
        easing,
        delay,
        fill,
      }
    );

    animation.onfinish = () => {
      element.style.transform = "scale(1)";
      element.style.opacity = "1";
      resolve();
    };
  });
}

/**
 * Scale out animation
 */
export function scaleOut(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.FAST,
    easing = EASING.EASE_IN,
    delay = 0,
    fill = "forwards",
  } = options;

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.95)", opacity: 0.5, offset: 0.3 },
        { transform: "scale(0)", opacity: 0 },
      ],
      {
        duration,
        easing,
        delay,
        fill,
      }
    );

    animation.onfinish = () => {
      element.style.display = "none";
      resolve();
    };
  });
}

/**
 * Slide in from direction
 */
export function slideIn(
  element: HTMLElement,
  direction: "up" | "down" | "left" | "right" = "up",
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.NORMAL,
    easing = EASING.EASE_OUT,
    delay = 0,
    fill = "forwards",
  } = options;

  const transforms = {
    up: "translateY(20px)",
    down: "translateY(-20px)",
    left: "translateX(20px)",
    right: "translateX(-20px)",
  };

  element.style.transform = transforms[direction];
  element.style.opacity = "0";
  element.style.display = "block";

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: transforms[direction], opacity: 0 },
        { transform: "translate(0, 0)", opacity: 1 },
      ],
      {
        duration,
        easing,
        delay,
        fill,
      }
    );

    animation.onfinish = () => {
      element.style.transform = "none";
      element.style.opacity = "1";
      resolve();
    };
  });
}

/**
 * Pulse animation for attention
 */
export function pulse(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.SLOW,
    easing = EASING.EASE_IN_OUT,
    delay = 0,
  } = options;

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.05)", opacity: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ],
      {
        duration,
        easing,
        delay,
        iterations: 1,
      }
    );

    animation.onfinish = () => resolve();
  });
}

/**
 * Shake animation for errors
 */
export function shake(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.NORMAL,
    easing = EASING.EASE_IN_OUT,
    delay = 0,
  } = options;

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(-10px)" },
        { transform: "translateX(10px)" },
        { transform: "translateX(0)" },
      ],
      {
        duration,
        easing,
        delay,
        iterations: 1,
      }
    );

    animation.onfinish = () => resolve();
  });
}

/**
 * Button press animation
 */
export function buttonPress(
  element: HTMLElement,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.FASTEST,
    easing = EASING.EASE_OUT,
    delay = 0,
  } = options;

  return new Promise((resolve) => {
    const animation = element.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.95)" },
        { transform: "scale(1)" },
      ],
      {
        duration,
        easing,
        delay,
        iterations: 1,
      }
    );

    animation.onfinish = () => resolve();
  });
}

/**
 * Ripple effect animation
 */
export function ripple(
  element: HTMLElement,
  event: MouseEvent | TouchEvent,
  options: AnimationOptions = {}
): Promise<void> {
  const {
    duration = DURATION.SLOW,
    easing = EASING.EASE_OUT,
    delay = 0,
  } = options;

  const rect = element.getBoundingClientRect();
  let x: number, y: number;

  if (event instanceof MouseEvent) {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  } else {
    const touch = event.touches[0] || event.changedTouches[0];
    x = touch.clientX - rect.left;
    y = touch.clientY - rect.top;
  }

  const rippleElement = document.createElement("div");
  rippleElement.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 1000;
  `;

  element.style.position = element.style.position || "relative";
  element.style.overflow = "hidden";
  element.appendChild(rippleElement);

  const size = Math.max(rect.width, rect.height) * 2;

  return new Promise((resolve) => {
    const animation = rippleElement.animate(
      [
        {
          width: "0px",
          height: "0px",
          opacity: 1,
        },
        {
          width: `${size}px`,
          height: `${size}px`,
          opacity: 0,
        },
      ],
      {
        duration,
        easing,
        delay,
        fill: "forwards",
      }
    );

    animation.onfinish = () => {
      rippleElement.remove();
      resolve();
    };
  });
}

/**
 * Loading spinner component
 */
export class LoadingSpinner {
  private element: HTMLElement;
  private animation: Animation | null = null;

  constructor(
    options: {
      size?: number;
      color?: string;
      strokeWidth?: number;
    } = {}
  ) {
    const { size = 24, color = "currentColor", strokeWidth = 2 } = options;

    this.element = this.createElement(size, color, strokeWidth);
  }

  private createElement(
    size: number,
    color: string,
    strokeWidth: number
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "uicm-spinner";
    container.style.cssText = `
      display: inline-block;
      width: ${size}px;
      height: ${size}px;
      position: relative;
    `;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size.toString());
    svg.setAttribute("height", size.toString());
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
    `;

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    const radius = (size - strokeWidth) / 2;
    circle.setAttribute("cx", (size / 2).toString());
    circle.setAttribute("cy", (size / 2).toString());
    circle.setAttribute("r", radius.toString());
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", color);
    circle.setAttribute("stroke-width", strokeWidth.toString());
    circle.setAttribute("stroke-linecap", "round");
    circle.setAttribute(
      "stroke-dasharray",
      `${radius * Math.PI} ${radius * Math.PI}`
    );
    circle.setAttribute("stroke-dashoffset", (radius * Math.PI).toString());

    svg.appendChild(circle);
    container.appendChild(svg);

    return container;
  }

  start(): void {
    if (this.animation) return;

    const circle = this.element.querySelector("circle");
    if (!circle) return;

    this.animation = circle.animate(
      [
        { "stroke-dashoffset": circle.getAttribute("stroke-dasharray") },
        { "stroke-dashoffset": "0" },
      ],
      {
        duration: 1500,
        easing: EASING.EASE_IN_OUT,
        iterations: Infinity,
      }
    );

    // Add rotation to the container
    const rotationAnimation = this.element.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      {
        duration: 1000,
        easing: "linear",
        iterations: Infinity,
      }
    );
  }

  stop(): void {
    if (this.animation) {
      this.animation.cancel();
      this.animation = null;
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    this.stop();
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Progress bar component
 */
export class ProgressBar {
  private element: HTMLElement;
  private progressBar: HTMLElement;
  private currentProgress: number = 0;

  constructor(
    options: {
      height?: number;
      color?: string;
      backgroundColor?: string;
      borderRadius?: number;
    } = {}
  ) {
    const {
      height = 4,
      color = "#3b82f6",
      backgroundColor = "#e5e7eb",
      borderRadius = 2,
    } = options;

    this.element = this.createElement(
      height,
      color,
      backgroundColor,
      borderRadius
    );
    this.progressBar = this.element.querySelector(
      ".uicm-progress-bar-fill"
    ) as HTMLElement;
  }

  private createElement(
    height: number,
    color: string,
    backgroundColor: string,
    borderRadius: number
  ): HTMLElement {
    const container = document.createElement("div");
    container.className = "uicm-progress-bar";
    container.style.cssText = `
      width: 100%;
      height: ${height}px;
      background-color: ${backgroundColor};
      border-radius: ${borderRadius}px;
      overflow: hidden;
      position: relative;
    `;

    const fill = document.createElement("div");
    fill.className = "uicm-progress-bar-fill";
    fill.style.cssText = `
      height: 100%;
      background-color: ${color};
      width: 0%;
      transition: width 0.3s ${EASING.EASE_OUT};
      border-radius: ${borderRadius}px;
    `;

    container.appendChild(fill);
    return container;
  }

  setProgress(progress: number, animated: boolean = true): Promise<void> {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this.currentProgress = clampedProgress;

    if (!animated) {
      this.progressBar.style.transition = "none";
      this.progressBar.style.width = `${clampedProgress}%`;
      requestAnimationFrame(() => {
        this.progressBar.style.transition = `width 0.3s ${EASING.EASE_OUT}`;
      });
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.progressBar.style.width = `${clampedProgress}%`;

      const transitionEnd = () => {
        this.progressBar.removeEventListener("transitionend", transitionEnd);
        resolve();
      };

      this.progressBar.addEventListener("transitionend", transitionEnd);
    });
  }

  getProgress(): number {
    return this.currentProgress;
  }

  getElement(): HTMLElement {
    return this.element;
  }

  destroy(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Add CSS transitions to element
 */
export function addTransition(
  element: HTMLElement,
  options: TransitionOptions = {}
): void {
  const {
    property = "all",
    duration = DURATION.NORMAL,
    easing = EASING.EASE_IN_OUT,
    delay = 0,
  } = options;

  element.style.transition = `${property} ${duration}ms ${easing} ${delay}ms`;
}

/**
 * Remove CSS transitions from element
 */
export function removeTransition(element: HTMLElement): void {
  element.style.transition = "none";
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(
  element: HTMLElement,
  options: {
    behavior?: "smooth" | "auto";
    block?: "start" | "center" | "end" | "nearest";
    inline?: "start" | "center" | "end" | "nearest";
  } = {}
): void {
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
    ...options,
  });
}

/**
 * Micro-interaction for hover effects
 */
export function addHoverEffect(
  element: HTMLElement,
  options: {
    scale?: number;
    translateY?: number;
    brightness?: number;
    duration?: number;
  } = {}
): void {
  const {
    scale = 1.05,
    translateY = -2,
    brightness = 1.1,
    duration = DURATION.FAST,
  } = options;

  addTransition(element, { duration, property: "transform, filter" });

  element.addEventListener("mouseenter", () => {
    element.style.transform = `translateY(${translateY}px) scale(${scale})`;
    element.style.filter = `brightness(${brightness})`;
  });

  element.addEventListener("mouseleave", () => {
    element.style.transform = "none";
    element.style.filter = "none";
  });
}

/**
 * Sequential animation helper
 */
export async function sequence(
  animations: Array<() => Promise<void>>,
  delay: number = 0
): Promise<void> {
  for (let i = 0; i < animations.length; i++) {
    if (i > 0 && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    await animations[i]();
  }
}

/**
 * Parallel animation helper
 */
export function parallel(
  animations: Array<() => Promise<void>>
): Promise<void[]> {
  return Promise.all(animations.map((animation) => animation()));
}
