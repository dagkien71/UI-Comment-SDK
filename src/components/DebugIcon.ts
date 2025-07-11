import { DebugIconProps } from "../types";

export class DebugIcon {
  private element: HTMLElement;
  private props: DebugIconProps;

  constructor(props: DebugIconProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const icon = document.createElement("div");
    icon.className = "uicm-debug-icon";
    icon.setAttribute("data-uicm-element", "true");
    icon.style.position = "fixed";
    icon.style.right = "20px";
    icon.style.top = "20px";
    icon.style.width = "40px";
    icon.style.height = "40px";
    icon.style.borderRadius = "50%";
    icon.style.backgroundColor = this.props.isActive
      ? "rgba(255, 0, 0, 0.8)"
      : "rgba(0, 0, 0, 0.5)";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.style.cursor = "pointer";
    icon.style.transition = "all 0.3s ease";
    icon.style.zIndex = "999999";
    icon.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";

    // Add hover effect
    icon.addEventListener("mouseenter", () => {
      icon.style.transform = "scale(1.1)";
      icon.style.backgroundColor = this.props.isActive
        ? "rgba(255, 0, 0, 1)"
        : "rgba(0, 0, 0, 0.8)";
    });

    icon.addEventListener("mouseleave", () => {
      icon.style.transform = "scale(1)";
      icon.style.backgroundColor = this.props.isActive
        ? "rgba(255, 0, 0, 0.8)"
        : "rgba(0, 0, 0, 0.5)";
    });

    icon.innerHTML = this.getIconHTML();

    return icon;
  }

  private getIconHTML(): string {
    if (this.props.isActive) {
      return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      `;
    } else {
      return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
      `;
    }
  }

  private attachEventListeners(): void {
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.props.onClick();
    });

    // Add tooltip functionality
    let tooltip: HTMLElement | null = null;

    this.element.addEventListener("mouseenter", () => {
      tooltip = this.createTooltip();
      document.body.appendChild(tooltip);
    });

    this.element.addEventListener("mouseleave", () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  }

  private createTooltip(): HTMLElement {
    const tooltip = document.createElement("div");
    tooltip.className = "uicm-tooltip";
    tooltip.textContent = this.props.isActive
      ? "Exit Comment Mode"
      : "Enter Comment Mode";
    tooltip.setAttribute("data-uicm-element", "true");

    const iconRect = this.element.getBoundingClientRect();
    tooltip.style.left = `${iconRect.right + 8}px`;
    tooltip.style.top = `${iconRect.top + iconRect.height / 2 - 12}px`;

    return tooltip;
  }

  public updateState(isActive: boolean): void {
    this.props.isActive = isActive;
    this.element.className = `uicm-debug-icon uicm-glass uicm-glass-hover ${
      isActive ? "uicm-active" : ""
    }`;
    this.element.innerHTML = this.getIconHTML();
  }

  public updateTheme(theme: "light" | "dark"): void {
    this.props.theme = theme;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    // Remove any existing tooltips
    const tooltips = document.querySelectorAll(".uicm-tooltip");
    tooltips.forEach((tooltip) => tooltip.remove());

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
