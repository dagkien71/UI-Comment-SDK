import { User } from "../types";
import { HybridCommentStorage } from "../storage/HybridCommentStorage";

export interface ProfileSettingsModalProps {
  currentUser: User;
  onSave: (user: User) => Promise<void>;
  onClose: () => void;
}

export class ProfileSettingsModal {
  private element: HTMLElement;
  private props: ProfileSettingsModalProps;

  constructor(props: ProfileSettingsModalProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "uicm-profile-modal";
    modal.innerHTML = `
      <div class="uicm-profile-modal-overlay"></div>
      <div class="uicm-profile-modal-content">
        <div class="uicm-profile-modal-header">
          <h3 class="uicm-profile-modal-title">Profile Settings</h3>
          <button class="uicm-profile-modal-close" type="button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="uicm-profile-modal-body">
          <div class="uicm-profile-avatar-section">
            <div class="uicm-profile-avatar">
              <span class="uicm-profile-avatar-text">${this.props.currentUser.name
                .charAt(0)
                .toUpperCase()}</span>
            </div>
            <div class="uicm-profile-avatar-info">
              <p class="uicm-profile-avatar-label">Profile Picture</p>
              <p class="uicm-profile-avatar-subtitle">Avatar will be generated from your name</p>
            </div>
          </div>

          <form class="uicm-profile-form">
            <div class="uicm-form-group">
              <label class="uicm-form-label" for="profile-name">Name</label>
              <input 
                type="text" 
                id="profile-name" 
                class="uicm-form-input" 
                value="${this.props.currentUser.name}"
                placeholder="Enter your name"
                maxlength="50"
              />
              <div class="uicm-form-help">This name will be displayed on your comments</div>
            </div>

            <div class="uicm-form-group">
              <label class="uicm-form-label" for="profile-role">Role</label>
              <select id="profile-role" class="uicm-form-select">
                <option value="developer" ${
                  this.props.currentUser.role === "developer" ? "selected" : ""
                }>Developer</option>
                <option value="designer" ${
                  this.props.currentUser.role === "designer" ? "selected" : ""
                }>Designer</option>
                <option value="product-manager" ${
                  this.props.currentUser.role === "product-manager"
                    ? "selected"
                    : ""
                }>Product Manager</option>
                <option value="qa" ${
                  this.props.currentUser.role === "qa" ? "selected" : ""
                }>QA Tester</option>
                <option value="stakeholder" ${
                  this.props.currentUser.role === "stakeholder"
                    ? "selected"
                    : ""
                }>Stakeholder</option>
                <option value="other" ${
                  this.props.currentUser.role === "other" ? "selected" : ""
                }>Other</option>
              </select>
              <div class="uicm-form-help">Your role helps others understand your perspective</div>
            </div>
          </form>
        </div>

        <div class="uicm-profile-modal-footer">
          <button class="uicm-btn uicm-btn-secondary" type="button">Cancel</button>
          <button class="uicm-btn uicm-btn-primary" type="button">Save Changes</button>
        </div>
      </div>
    `;

    return modal;
  }

  private attachEventListeners(): void {
    // Prevent modal from closing when clicking inside modal content
    const modalContent = this.element.querySelector(
      ".uicm-profile-modal-content"
    );
    if (modalContent) {
      modalContent.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    // Close button
    const closeBtn = this.element.querySelector(".uicm-profile-modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.props.onClose();
      });
    }

    // Cancel button
    const cancelBtn = this.element.querySelector(".uicm-btn-secondary");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.props.onClose();
      });
    }

    // Save button
    const saveBtn = this.element.querySelector(".uicm-btn-primary");
    if (saveBtn) {
      saveBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.handleSave();
      });
    }

    // Close on overlay click
    const overlay = this.element.querySelector(".uicm-profile-modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        e.stopPropagation();
        this.props.onClose();
      });
    }

    // Prevent clicks inside modal from bubbling
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Prevent other events from bubbling
    this.element.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    this.element.addEventListener("mouseup", (e) => {
      e.stopPropagation();
    });

    this.element.addEventListener("keydown", (e) => {
      e.stopPropagation();
    });

    this.element.addEventListener("keyup", (e) => {
      e.stopPropagation();
    });

    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.props.onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Clean up escape listener when modal is destroyed
    this.element.addEventListener("remove", () => {
      document.removeEventListener("keydown", handleEscape);
    });

    // Update avatar when name changes
    const nameInput = this.element.querySelector(
      "#profile-name"
    ) as HTMLInputElement;
    const avatarText = this.element.querySelector(".uicm-profile-avatar-text");

    if (nameInput && avatarText) {
      nameInput.addEventListener("input", (e) => {
        e.stopPropagation();
        const name = nameInput.value.trim();
        if (name) {
          avatarText.textContent = name.charAt(0).toUpperCase();
        } else {
          avatarText.textContent = this.props.currentUser.name
            .charAt(0)
            .toUpperCase();
        }
      });
    }
  }

  private async handleSave(): Promise<void> {
    const nameInput = this.element.querySelector(
      "#profile-name"
    ) as HTMLInputElement;
    const roleSelect = this.element.querySelector(
      "#profile-role"
    ) as HTMLSelectElement;
    const saveBtn = this.element.querySelector(
      ".uicm-btn-primary"
    ) as HTMLButtonElement;

    if (!nameInput || !roleSelect || !saveBtn) return;

    const name = nameInput.value.trim();
    const role = roleSelect.value;

    if (!name) {
      // Show error
      nameInput.classList.add("uicm-form-input-error");
      return;
    }

    // Remove error state
    nameInput.classList.remove("uicm-form-input-error");

    // Disable save button
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const updatedUser: User = {
        ...this.props.currentUser,
        name,
        role: role as any, // Type assertion for role
      };

      // Check if name has changed
      const nameChanged = this.props.currentUser.name !== name;

      // Update profile first
      await this.props.onSave(updatedUser);

      // If name changed, update all comments
      if (nameChanged) {
        console.log(
          `🔄 Updating user name from "${this.props.currentUser.name}" to "${name}" in all comments...`
        );
        await HybridCommentStorage.updateUserNameInAllComments(
          this.props.currentUser.id,
          name
        );
      }

      console.log("✅ Profile updated successfully");
      this.props.onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Re-enable save button
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Changes";
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    // Remove escape listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.props.onClose();
      }
    };
    document.removeEventListener("keydown", handleEscape);

    this.element.remove();
  }
}
