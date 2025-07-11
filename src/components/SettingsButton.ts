import { User } from "../types";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { userProfileStorage } from "../utils/userProfileStorage";

export interface SettingsButtonProps {
  currentUser: User;
  onUserUpdate: (user: User) => Promise<void>;
  isVisible?: boolean;
}

export class SettingsButton {
  private element: HTMLElement;
  private props: SettingsButtonProps;
  private profileModal: ProfileSettingsModal | null = null;

  constructor(props: SettingsButtonProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const button = document.createElement("button");
    button.className = "uicm-settings-button";
    button.type = "button";
    button.title = "Profile Settings";
    button.style.display = this.props.isVisible === true ? "flex" : "none";
    if (this.props.isVisible !== true) {
      button.style.opacity = "0";
      button.style.transform = "scale(0.8) translateY(20px)";
    }

    // Use a simple gear icon with CSS
    button.innerHTML = `
      <div class="uicm-settings-icon">
        <div class="uicm-gear-icon">⚙</div>
      </div>
    `;

    return button;
  }

  private attachEventListeners(): void {
    this.element.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openProfileSettings();
    });
  }

  private openProfileSettings(): void {
    // Close existing modal if any
    if (this.profileModal) {
      this.profileModal.destroy();
      this.profileModal = null;
    }

    // Create and show profile settings modal
    this.profileModal = new ProfileSettingsModal({
      currentUser: this.props.currentUser,
      onSave: async (updatedUser: User) => {
        // Save to localStorage first
        userProfileStorage.saveUserProfile(updatedUser);

        // Then update in SDK
        await this.props.onUserUpdate(updatedUser);

        // Update current user in props
        this.props.currentUser = updatedUser;

        console.log("✅ Profile saved to localStorage and updated in SDK");
      },
      onClose: () => {
        if (this.profileModal) {
          this.profileModal.destroy();
          this.profileModal = null;
        }
      },
    });

    // Add modal to body
    document.body.appendChild(this.profileModal.getElement());
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

  public destroy(): void {
    if (this.profileModal) {
      this.profileModal.destroy();
      this.profileModal = null;
    }
    this.element.remove();
  }
}
