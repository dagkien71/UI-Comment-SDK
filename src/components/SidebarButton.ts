import { User } from "../types";

export interface SidebarButtonProps {
  currentUser: User;
  onClick: () => void;
  isVisible?: boolean;
}

export class SidebarButton {
  private element: HTMLElement;
  private props: SidebarButtonProps;

  constructor(props: SidebarButtonProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const button = document.createElement("button");
    button.className = "uicm-sidebar-button";
    button.type = "button";
    button.title = "View All Comments";
    button.style.display = this.props.isVisible === true ? "flex" : "none";
    if (this.props.isVisible !== true) {
      button.style.opacity = "0";
      button.style.transform = "scale(0.8) translateY(20px)";
    }

    // Use a list icon
    button.innerHTML = `
      <div class="uicm-sidebar-icon">
        <div class="uicm-list-icon">📋</div>
      </div>
    `;

    return button;
  }

  private attachEventListeners(): void {
    this.element.addEventListener("click", (e) => {
      console.log("🔧 SidebarButton: Clicked!");
      e.preventDefault();
      e.stopPropagation();
      this.props.onClick();
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.element.style.display = "flex";
      // Trigger animation by removing and re-adding the element
      setTimeout(() => {
        this.element.style.opacity = "1";
        this.element.style.transform = "scale(1) translateY(0)";
      }, 10);
    } else {
      this.element.style.opacity = "0";
      this.element.style.transform = "scale(0.8) translateY(20px)";
      setTimeout(() => {
        this.element.style.display = "none";
      }, 300); // Match transition duration
    }
  }

  public updateUser(user: User): void {
    this.props.currentUser = user;
    // Sidebar button doesn't display user info, so no UI update needed
    console.log("🔄 SidebarButton: User updated:", user.name);
  }

  public destroy(): void {
    this.element.remove();
  }
}
