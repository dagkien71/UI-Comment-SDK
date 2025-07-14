import { User, CommentAttachment } from "../types";
import {
  generateId,
  constrainToViewport,
  repositionInViewport,
  getCenterPosition,
} from "../utils/dom";
import { base64UploadManager } from "../utils/base64Upload";
import { ImageModal } from "./ImageModal";

export interface CommentFormProps {
  onSubmit: (
    content: string,
    userName?: string,
    attachments?: CommentAttachment[]
  ) => Promise<void>;
  onCancel: () => void;
  position: { x: number; y: number };
  element: Element;
  currentUser: User;
}

export class CommentForm {
  private element: HTMLElement;
  private props: CommentFormProps;
  private textarea!: HTMLTextAreaElement;
  private nameInput!: HTMLInputElement;
  private submitButton!: HTMLButtonElement;
  private isSubmitting = false;
  private selectedAttachments: CommentAttachment[] = [];

  // Cache DOM elements to avoid repeated queries
  private charCounter!: HTMLElement;
  private avatar!: HTMLElement;
  private imageModal: ImageModal | null = null;

  constructor(props: CommentFormProps) {
    this.props = props;
    this.element = this.createElement();
    this.setupEventListeners();
  }

  private addFilePreview(
    attachment: CommentAttachment,
    container: HTMLElement,
    onRemove: () => void
  ): void {
    // No limit on number of images

    const previewItem = document.createElement("div");
    previewItem.className = "uicm-file-preview-item";
    previewItem.style.position = "relative";

    if (attachment.type === "image") {
      const imagePreview = document.createElement("img");
      imagePreview.className = "uicm-file-preview-image";
      imagePreview.src = attachment.url;
      imagePreview.alt = attachment.filename;
      imagePreview.style.cursor = "pointer";

      // Add click handler to open image modal
      imagePreview.addEventListener("click", () => {
        if (this.imageModal) {
          this.imageModal.destroy();
        }
        this.imageModal = new ImageModal(attachment.url);
        this.imageModal.show();
      });

      previewItem.appendChild(imagePreview);
    } else {
      const fileIcon = document.createElement("span");
      fileIcon.className = "uicm-file-preview-icon";
      fileIcon.innerHTML = "📎";
      previewItem.appendChild(fileIcon);
    }

    // Only show file size (not name or url)
    const fileSize = document.createElement("span");
    fileSize.className = "uicm-file-preview-size";
    fileSize.textContent = this.formatFileSize(attachment.size);
    previewItem.appendChild(fileSize);

    // Remove button absolutely positioned top right
    const removeButton = document.createElement("button");
    removeButton.className = "uicm-file-preview-remove";
    removeButton.innerHTML = "×";
    removeButton.type = "button";
    removeButton.style.position = "absolute";
    removeButton.style.top = "2px";
    removeButton.style.right = "2px";
    removeButton.style.zIndex = "2";
    removeButton.onclick = () => {
      previewItem.remove();
      onRemove();
    };
    previewItem.appendChild(removeButton);

    container.appendChild(previewItem);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private createElement(): HTMLElement {
    const form = document.createElement("div");
    form.className = "uicm-comment-form";
    form.style.position = "absolute";
    form.style.zIndex = "10000";

    // Temporarily add to DOM to get accurate dimensions
    document.body.appendChild(form);

    // Use center position instead of click position
    const centerPosition = getCenterPosition(form, { padding: 20 });

    // Set center position
    form.style.left = `${centerPosition.x}px`;
    form.style.top = `${centerPosition.y}px`;

    // Remove from DOM temporarily
    document.body.removeChild(form);

    // Header with improved layout
    const header = document.createElement("div");
    header.className = "uicm-form-header";

    // Header content container
    const headerContent = document.createElement("div");
    headerContent.className = "uicm-form-header-content";

    // Title section
    const titleSection = document.createElement("div");
    titleSection.className = "uicm-form-title-section";

    const title = document.createElement("h2");
    title.className = "uicm-form-title";
    title.textContent = "Add Comment";

    const subtitle = document.createElement("p");
    subtitle.className = "uicm-form-subtitle";
    subtitle.textContent = "Share your thoughts or feedback";

    titleSection.appendChild(title);
    titleSection.appendChild(subtitle);

    // Action buttons section
    const actionSection = document.createElement("div");
    actionSection.className = "uicm-form-action-section";

    // Close button with improved styling
    const closeButton = document.createElement("button");
    closeButton.className = "uicm-close-button";
    closeButton.innerHTML = "×";
    closeButton.setAttribute("aria-label", "Close comment form");
    closeButton.title = "Close";
    closeButton.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.props.onCancel();
    };

    actionSection.appendChild(closeButton);

    // Assemble header
    headerContent.appendChild(titleSection);
    headerContent.appendChild(actionSection);
    header.appendChild(headerContent);

    // Content area
    const content = document.createElement("div");
    content.className = "uicm-form-content";

    // User info section
    const userInfo = document.createElement("div");
    userInfo.className = "uicm-user-info";

    const avatar = document.createElement("div");
    avatar.className = "uicm-user-avatar";
    avatar.textContent = this.props.currentUser.name.charAt(0).toUpperCase();
    if (this.props.currentUser.avatar) {
      avatar.style.backgroundImage = `url(${this.props.currentUser.avatar})`;
      avatar.style.backgroundSize = "cover";
      avatar.textContent = "";
    }

    // Cache avatar element
    this.avatar = avatar;

    const userDetails = document.createElement("div");
    userDetails.className = "uicm-user-details";

    // Editable name input
    this.nameInput = document.createElement("input");
    this.nameInput.type = "text";
    this.nameInput.className = "uicm-user-name-input";
    this.nameInput.value = this.props.currentUser.name;
    this.nameInput.placeholder = "Your name";
    this.nameInput.maxLength = 50;

    userDetails.appendChild(this.nameInput);

    userInfo.appendChild(avatar);
    userInfo.appendChild(userDetails);

    // Textarea with enhanced features
    this.textarea = document.createElement("textarea");
    this.textarea.placeholder = "Write a comment...";
    this.textarea.className = "uicm-comment-textarea";
    this.textarea.rows = 3;

    // File upload section
    const fileUploadSection = document.createElement("div");
    fileUploadSection.className = "uicm-file-upload-section";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "uicm-file-input";
    fileInput.style.display = "none";
    fileInput.accept = "image/*,application/pdf,.doc,.docx,.txt,.zip,.rar";
    fileInput.multiple = true;

    const fileUploadButton = document.createElement("button");
    fileUploadButton.className = "uicm-file-upload-button";
    fileUploadButton.type = "button";
    fileUploadButton.innerHTML = "📎";
    fileUploadButton.onclick = () => fileInput.click();

    const filePreviewContainer = document.createElement("div");
    filePreviewContainer.className = "uicm-file-preview-container";

    // Handle file selection
    fileInput.addEventListener("change", async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        for (const file of Array.from(files)) {
          try {
            // Upload file using Base64UploadManager
            const attachment = await base64UploadManager.uploadFile(file);
            this.selectedAttachments.push(attachment);
            this.addFilePreview(attachment, filePreviewContainer, () => {
              this.selectedAttachments = this.selectedAttachments.filter(
                (a) => a.id !== attachment.id
              );
              this.updateSubmitButton();
            });
          } catch (error) {
            console.error("Failed to upload file:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            alert(`Failed to upload ${file.name}: ${errorMessage}`);
          }
        }

        this.updateSubmitButton();
      }
    });

    fileUploadSection.appendChild(fileInput);
    fileUploadSection.appendChild(fileUploadButton);
    fileUploadSection.appendChild(filePreviewContainer);

    // Character counter
    this.charCounter = document.createElement("div");
    this.charCounter.className = "uicm-char-counter";
    this.charCounter.textContent = "0 / 1000";

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "uicm-form-actions";

    // Secondary actions
    const secondaryActions = document.createElement("div");
    secondaryActions.className = "uicm-secondary-actions";

    const emojiButton = document.createElement("button");
    emojiButton.className = "uicm-emoji-button";
    emojiButton.innerHTML = "😊";
    emojiButton.setAttribute("aria-label", "Add emoji");
    emojiButton.type = "button";

    const mentionButton = document.createElement("button");
    mentionButton.className = "uicm-mention-button";
    mentionButton.innerHTML = "@";
    mentionButton.setAttribute("aria-label", "Mention someone");
    mentionButton.type = "button";

    secondaryActions.appendChild(emojiButton);
    secondaryActions.appendChild(mentionButton);

    // Primary actions
    const primaryActions = document.createElement("div");
    primaryActions.className = "uicm-primary-actions";

    this.submitButton = document.createElement("button");
    this.submitButton.className = "uicm-submit-button";
    this.submitButton.type = "button";
    this.updateSubmitButton();

    primaryActions.appendChild(this.submitButton);

    actions.appendChild(secondaryActions);
    actions.appendChild(primaryActions);

    // Create input container for textarea and file upload button (like reply form)
    const inputContainer = document.createElement("div");
    inputContainer.className = "uicm-form-input-container";

    // Add textarea and file upload button to input container
    inputContainer.appendChild(this.textarea);
    inputContainer.appendChild(fileUploadButton);
    inputContainer.appendChild(this.charCounter);

    // Restructure: file previews at top, input container in middle, actions at bottom
    content.appendChild(filePreviewContainer); // File previews at top
    content.appendChild(userInfo); // User info
    content.appendChild(inputContainer); // Input container (textarea + file upload button)
    content.appendChild(actions); // Actions at bottom

    form.appendChild(header);
    form.appendChild(content);

    return form;
  }

  private setupEventListeners(): void {
    // Prevent form from closing when clicking inside form
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("🔒 Form internal click - prevented propagation");
    });

    // Prevent form from closing when interacting with form elements
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

    // Auto-resize textarea
    this.textarea.addEventListener("input", () => {
      this.textarea.style.height = "auto";
      this.textarea.style.height =
        Math.min(this.textarea.scrollHeight, 200) + "px";
      this.updateCharCounter();
      this.updateSubmitButton();
    });

    // Handle paste events for images
    this.textarea.addEventListener("paste", async (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf("image") !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              // Show loading state
              const originalPlaceholder = this.textarea.placeholder;
              this.textarea.placeholder = "🔄 Processing image...";
              this.textarea.disabled = true;

              // Show loading indicator
              const loadingIndicator = document.createElement("div");
              loadingIndicator.className = "uicm-paste-loading";
              loadingIndicator.innerHTML = `
                <div class="uicm-loading-spinner"></div>
                <span>Processing image: ${file.name}</span>
              `;
              loadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 16px 24px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                color: #1e293b;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                z-index: 1000;
              `;

              const spinner = loadingIndicator.querySelector(
                ".uicm-loading-spinner"
              ) as HTMLElement;
              spinner.style.cssText = `
                width: 20px;
                height: 20px;
                border: 2px solid #e2e8f0;
                border-top: 2px solid #3b82f6;
                border-radius: 50%;
                animation: uicm-spin 1s linear infinite;
              `;

              this.element.appendChild(loadingIndicator);

              try {
                const attachment = await base64UploadManager.uploadFile(file);
                this.selectedAttachments.push(attachment);

                // Find file preview container
                const filePreviewContainer = this.element.querySelector(
                  ".uicm-file-preview-container"
                );
                if (filePreviewContainer) {
                  this.addFilePreview(
                    attachment,
                    filePreviewContainer as HTMLElement,
                    () => {
                      this.selectedAttachments =
                        this.selectedAttachments.filter(
                          (a) => a.id !== attachment.id
                        );
                      this.updateSubmitButton();
                    }
                  );
                }

                this.updateSubmitButton();
                console.log(
                  "📸 Image pasted and uploaded:",
                  attachment.filename
                );

                // Show success message briefly
                loadingIndicator.innerHTML = `
                  <span style="color: #10b981;">✅</span>
                  <span>Image uploaded successfully!</span>
                `;
                setTimeout(() => {
                  if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                  }
                }, 1000);
              } catch (error) {
                console.error("Failed to paste image:", error);
                const errorMessage =
                  error instanceof Error ? error.message : "Unknown error";

                // Show error message
                loadingIndicator.innerHTML = `
                  <span style="color: #ef4444;">❌</span>
                  <span>Failed to upload: ${errorMessage}</span>
                `;
                setTimeout(() => {
                  if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                  }
                }, 3000);
              } finally {
                // Restore input state
                this.textarea.placeholder = originalPlaceholder;
                this.textarea.disabled = false;
                this.textarea.focus();
              }
            }
          }
        }
      }
    });

    // Update avatar when name changes
    this.nameInput.addEventListener("input", () => {
      if (this.avatar && this.nameInput.value.trim()) {
        this.avatar.textContent = this.nameInput.value
          .trim()
          .charAt(0)
          .toUpperCase();
      }
      this.updateSubmitButton();
    });

    // Submit on Ctrl/Cmd + Enter
    this.textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        this.handleSubmit();
      }
    });

    // Focus textarea on mount - use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      this.textarea.focus();
    });

    // Submit button click
    this.submitButton.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleSubmit();
    };
  }

  private updateCharCounter(): void {
    const length = this.textarea.value.length;
    const maxLength = 1000;

    this.charCounter.textContent = `${length} / ${maxLength}`;

    if (length > maxLength * 0.8) {
      this.charCounter.classList.add("uicm-warning");
    } else {
      this.charCounter.classList.remove("uicm-warning");
    }

    if (length > maxLength) {
      this.charCounter.classList.add("uicm-error");
    } else {
      this.charCounter.classList.remove("uicm-error");
    }
  }

  private updateSubmitButton(): void {
    const content = this.textarea.value.trim();
    const userName = this.nameInput.value.trim();
    const hasContent = content.length > 0;
    const hasAttachments = this.selectedAttachments.length > 0;
    const isValid =
      (hasContent || hasAttachments) &&
      userName.length > 0 &&
      content.length <= 1000;

    this.submitButton.disabled = !isValid || this.isSubmitting;

    if (this.isSubmitting) {
      this.submitButton.innerHTML = `
        <div class="uicm-spinner"></div>
        <span>Posting...</span>
      `;
    } else {
      const shortcut = navigator.platform.includes("Mac") ? "⌘" : "Ctrl";
      this.submitButton.innerHTML = `
        <span>Submit</span>
        <kbd>${shortcut} + Enter</kbd>
      `;
    }
  }

  private async handleSubmit(): Promise<void> {
    const content = this.textarea.value.trim();
    const userName = this.nameInput.value.trim();
    const hasContent = content.length > 0;
    const hasAttachments = this.selectedAttachments.length > 0;

    if ((!hasContent && !hasAttachments) || !userName || content.length > 1000)
      return;

    this.isSubmitting = true;
    this.updateSubmitButton();

    try {
      await this.props.onSubmit(
        content,
        userName,
        this.selectedAttachments.length > 0
          ? this.selectedAttachments
          : undefined
      );

      // Clear form after successful submission
      this.textarea.value = "";
      this.selectedAttachments = [];

      // Clear file preview container
      const filePreviewContainer = this.element.querySelector(
        ".uicm-file-preview-container"
      );
      if (filePreviewContainer) {
        filePreviewContainer.innerHTML = "";
      }

      // Clear file input
      const fileInput = this.element.querySelector(
        ".uicm-file-input"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      this.updateCharCounter();
      this.updateSubmitButton();
    } catch (error) {
      console.error("Failed to submit comment:", error);
      this.showError("Failed to post comment. Please try again.");
    } finally {
      this.isSubmitting = false;
      this.updateSubmitButton();
    }
  }

  private showError(message: string): void {
    // Remove existing error
    const existingError = this.element.querySelector(".uicm-error-message");
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "uicm-error-message";
    errorDiv.textContent = message;

    // Insert before actions
    const actions = this.element.querySelector(".uicm-form-actions");
    if (actions) {
      actions.parentNode?.insertBefore(errorDiv, actions);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public reposition(): void {
    // Use center position instead of click position
    const centerPosition = getCenterPosition(this.element, { padding: 20 });

    // Apply center position
    this.element.style.position = "fixed";
    this.element.style.left = `${centerPosition.x}px`;
    this.element.style.top = `${centerPosition.y}px`;
    this.element.style.transform = "none";
  }

  public destroy(): void {
    if (this.imageModal) {
      this.imageModal.destroy();
      this.imageModal = null;
    }
    this.element.remove();
  }
}
