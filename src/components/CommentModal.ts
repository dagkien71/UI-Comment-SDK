import { Comment, User, CommentStatus, CommentAttachment } from "../types";
import { base64UploadManager } from "../utils/base64Upload";
import { ImageModal } from "./ImageModal";
import { constrainToViewport, repositionInViewport } from "../utils/dom";
import { getRoleColor, getRoleDisplayName } from "../utils/roleColors";

export interface CommentModalProps {
  comments: Comment[];
  currentUser: User;
  position: { x: number; y: number };
  onClose: () => void;
  onAddReply: (
    commentId: string,
    content: string,
    user?: User,
    attachments?: CommentAttachment[]
  ) => Promise<void>;
  onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export class CommentModal {
  private element: HTMLElement;
  private props: CommentModalProps;
  private imageModal: ImageModal | null = null;

  constructor(props: CommentModalProps) {
    this.props = props;
    this.element = this.createElement();
    this.attachEventListeners();
  }

  private detectAndFormatUrls(text: string): string {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="uicm-url-link">${url}</a>`;
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private addFilePreview(
    attachment: CommentAttachment,
    container: HTMLElement,
    onRemove: () => void
  ): void {
    // Limit to 5 images
    if (container.childElementCount >= 5) return;

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

  private createElement(): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "uicm-comment-modal";
    modal.style.position = "absolute";
    modal.style.zIndex = "10000";

    // Temporarily add to DOM to get accurate dimensions
    document.body.appendChild(modal);

    // Constrain position to viewport
    const constrainedPosition = constrainToViewport(
      modal,
      this.props.position,
      {
        padding: 20,
        preferredSide: "bottom",
      }
    );

    // Set constrained position
    modal.style.left = `${constrainedPosition.x}px`;
    modal.style.top = `${constrainedPosition.y}px`;

    // Remove from DOM temporarily
    document.body.removeChild(modal);

    // Gradient header bar
    const headerBar = document.createElement("div");
    headerBar.className = "uicm-modal-header-bar";

    // Main header container
    const header = document.createElement("div");
    header.className = "uicm-modal-header";

    // Header content wrapper
    const headerContent = document.createElement("div");
    headerContent.className = "uicm-modal-header-content";

    // Top section: Title, description, and close button
    const topSection = document.createElement("div");
    topSection.className = "uicm-modal-top-section";

    // Left side: Title and description
    const titleSection = document.createElement("div");
    titleSection.className = "uicm-modal-title-section";

    const title = document.createElement("h3");
    title.className = "uicm-modal-title";
    title.textContent = "Comment";

    const description = document.createElement("p");
    description.className = "uicm-modal-description";
    description.textContent = "View and manage feedback";

    titleSection.appendChild(title);
    titleSection.appendChild(description);

    // Right side: Close button
    const closeButton = document.createElement("button");
    closeButton.className = "uicm-close-button";
    closeButton.innerHTML = "×";
    closeButton.title = "Close";
    closeButton.onclick = () => this.props.onClose();

    topSection.appendChild(titleSection);
    topSection.appendChild(closeButton);

    // Bottom section: Status select and delete button
    const bottomSection = document.createElement("div");
    bottomSection.className = "uicm-modal-bottom-section";

    const mainComment = this.props.comments[0];

    // Status select with color coding
    const statusSelect = document.createElement("select");
    statusSelect.className = "uicm-status-select";
    statusSelect.value = mainComment.status;
    statusSelect.setAttribute("data-status", mainComment.status);

    // Add status options with color coding
    const statuses = [
      CommentStatus.BUG,
      CommentStatus.FEATURE_REQUEST,
      CommentStatus.DEV_COMPLETED,
      CommentStatus.DONE,
      CommentStatus.ARCHIVED,
    ];

    statuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status.toUpperCase();
      option.selected = status === mainComment.status;
      statusSelect.appendChild(option);
    });

    // Status change handler
    statusSelect.addEventListener("change", async (e) => {
      const newStatus = (e.target as HTMLSelectElement).value as CommentStatus;
      if (newStatus !== mainComment.status) {
        await this.props.onStatusChange(mainComment.id, newStatus);
        // Update the data-status attribute for color coding
        statusSelect.setAttribute("data-status", newStatus);
      }
    });

    // Delete button (only show if onDeleteComment callback is provided)
    if (this.props.onDeleteComment) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "uicm-delete-button";
      deleteButton.innerHTML = "🗑️";
      deleteButton.title = "Delete comment";

      // Delete functionality
      deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation();

        if (
          confirm(
            "Are you sure you want to delete this comment and all its replies? This action cannot be undone."
          )
        ) {
          try {
            deleteButton.disabled = true;
            deleteButton.innerHTML = "⏳";
            deleteButton.title = "Deleting...";
            deleteButton.style.opacity = "0.7";

            // Delete the main comment (which will delete all replies too)
            await this.props.onDeleteComment!(mainComment.id);

            // Close the modal after successful deletion
            this.props.onClose();
          } catch (error) {
            console.error("Failed to delete comment:", error);
            deleteButton.disabled = false;
            deleteButton.innerHTML = "🗑️";
            deleteButton.title = "Delete comment";
            deleteButton.style.opacity = "1";
            alert("Failed to delete comment. Please try again.");
          }
        }
      });

      bottomSection.appendChild(statusSelect);
      bottomSection.appendChild(deleteButton);
    } else {
      // If no delete function, just add the status select
      bottomSection.appendChild(statusSelect);
    }

    // Assemble header
    headerContent.appendChild(topSection);
    headerContent.appendChild(bottomSection);
    header.appendChild(headerContent);

    // Comments list
    const commentsList = document.createElement("div");
    commentsList.className = "uicm-comments-list";

    this.props.comments.forEach((comment) => {
      const commentItem = this.createCommentItem(comment);
      commentsList.appendChild(commentItem);
    });

    // Reply form
    const replyForm = this.createReplyForm();

    modal.appendChild(headerBar);
    modal.appendChild(header);
    modal.appendChild(commentsList);
    modal.appendChild(replyForm);

    return modal;
  }

  private createCommentItem(comment: Comment): HTMLElement {
    const item = document.createElement("div");
    item.className = "uicm-comment-item";

    // Avatar with gradient background
    const avatar = document.createElement("div");
    avatar.className = "uicm-comment-avatar";
    if (comment.createdBy.avatar) {
      avatar.innerHTML = `<img src="${comment.createdBy.avatar}" alt="${comment.createdBy.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      avatar.textContent = comment.createdBy.name.charAt(0).toUpperCase();
    }

    // Content
    const content = document.createElement("div");
    content.className = "uicm-comment-content";

    const commentHeader = document.createElement("div");
    commentHeader.className = "uicm-comment-header";

    const authorName = document.createElement("span");
    authorName.className = "uicm-author-name";
    authorName.textContent = comment.createdBy.name;

    // Add role badge
    const roleBadge = document.createElement("span");
    roleBadge.className = "uicm-role-badge";
    roleBadge.textContent = getRoleDisplayName(comment.role);

    // Apply role colors
    const roleColors = getRoleColor(comment.role);
    roleBadge.style.backgroundColor = roleColors.bg;
    roleBadge.style.color = roleColors.text;
    roleBadge.style.borderColor = roleColors.border;

    const timeAgo = document.createElement("span");
    timeAgo.className = "uicm-comment-time";
    timeAgo.textContent = this.formatTimeAgo(comment.createdAt);

    commentHeader.appendChild(authorName);
    commentHeader.appendChild(roleBadge);
    commentHeader.appendChild(timeAgo);

    const commentText = document.createElement("p");
    commentText.className = "uicm-comment-text";
    commentText.innerHTML = this.detectAndFormatUrls(comment.content);

    content.appendChild(commentHeader);
    content.appendChild(commentText);

    // Add attachments if any
    console.log(
      "🔍 Checking attachments for comment:",
      comment.id,
      comment.attachments
    );
    if (comment.attachments && comment.attachments.length > 0) {
      console.log("📎 Found attachments:", comment.attachments.length);
      const attachmentsContainer = document.createElement("div");
      attachmentsContainer.className = "uicm-comment-attachments";

      // Add class for multiple images layout
      const imageAttachments = comment.attachments.filter(
        (a) => a.type === "image"
      );
      if (imageAttachments.length > 1) {
        attachmentsContainer.classList.add("has-multiple-images");
      }

      comment.attachments.forEach((attachment, index) => {
        console.log(`📎 Processing attachment ${index}:`, attachment);
        const attachmentItem = document.createElement("div");
        attachmentItem.className = "uicm-attachment-item";

        if (attachment.type === "image") {
          const imagePreview = document.createElement("img");
          imagePreview.className = "uicm-attachment-image";
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

          attachmentItem.appendChild(imagePreview);
        } else {
          const fileIcon = document.createElement("span");
          fileIcon.className = "uicm-attachment-icon";
          fileIcon.innerHTML = "📎";

          const fileInfo = document.createElement("div");
          fileInfo.className = "uicm-attachment-info";

          const fileName = document.createElement("span");
          fileName.className = "uicm-attachment-name";
          fileName.textContent = attachment.filename;

          const fileSize = document.createElement("span");
          fileSize.className = "uicm-attachment-size";
          fileSize.textContent = this.formatFileSize(attachment.size);

          fileInfo.appendChild(fileName);
          fileInfo.appendChild(fileSize);

          attachmentItem.appendChild(fileIcon);
          attachmentItem.appendChild(fileInfo);

          attachmentItem.style.cursor = "pointer";
          attachmentItem.addEventListener("click", () => {
            window.open(attachment.url, "_blank");
          });
        }

        attachmentsContainer.appendChild(attachmentItem);
        console.log(`✅ Attachment ${index} added to container`);
      });

      content.appendChild(attachmentsContainer);
      console.log("✅ Attachments container added to comment item");
    }

    item.appendChild(avatar);
    item.appendChild(content);

    return item;
  }

  private createReplyForm(): HTMLElement {
    const form = document.createElement("div");
    form.className = "uicm-reply-form";

    const replyHeader = document.createElement("div");
    replyHeader.className = "uicm-reply-header";

    // Avatar for current user
    const avatar = document.createElement("div");
    avatar.className = "uicm-reply-avatar";
    if (this.props.currentUser.avatar) {
      avatar.innerHTML = `<img src="${this.props.currentUser.avatar}" alt="${this.props.currentUser.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      avatar.textContent = this.props.currentUser.name.charAt(0).toUpperCase();
    }

    // Editable user name
    const nameInput = document.createElement("input");
    nameInput.className = "uicm-reply-user-name-input";
    nameInput.type = "text";
    nameInput.value = this.props.currentUser.name;
    nameInput.placeholder = "Your name";

    // Update avatar when name changes
    nameInput.addEventListener("input", () => {
      if (nameInput.value.trim()) {
        avatar.textContent = nameInput.value.trim().charAt(0).toUpperCase();
      } else {
        avatar.textContent = this.props.currentUser.name
          .charAt(0)
          .toUpperCase();
      }
    });

    replyHeader.appendChild(avatar);
    replyHeader.appendChild(nameInput);

    // Input container
    const inputContainer = document.createElement("div");
    inputContainer.className = "uicm-reply-input-container";

    const input = document.createElement("textarea");
    input.className = "uicm-reply-input";
    input.placeholder = "Write a reply...";
    input.rows = 2;

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
    fileUploadButton.innerHTML = "📎 Attach Files";
    fileUploadButton.onclick = () => fileInput.click();

    const filePreviewContainer = document.createElement("div");
    filePreviewContainer.className = "uicm-file-preview-container";

    let selectedAttachments: CommentAttachment[] = [];

    // Handle file selection
    fileInput.addEventListener("change", async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        for (const file of Array.from(files)) {
          try {
            // Upload file using Base64UploadManager
            const attachment = await base64UploadManager.uploadFile(file);
            selectedAttachments.push(attachment);
            this.addFilePreview(attachment, filePreviewContainer, () => {
              selectedAttachments = selectedAttachments.filter(
                (a) => a.id !== attachment.id
              );
              updateSendButtonState();
            });
          } catch (error) {
            console.error("Failed to upload file:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            alert(`Failed to upload ${file.name}: ${errorMessage}`);
          }
        }

        updateSendButtonState();
      }
    });

    const updateSendButtonState = () => {
      const hasContent = input.value.trim().length > 0;
      const hasName = nameInput.value.trim().length > 0;
      const hasAttachments = selectedAttachments.length > 0;
      sendButton.disabled =
        (!hasContent && !hasAttachments) ||
        !hasName ||
        input.value.length > 500;
    };

    fileUploadSection.appendChild(fileInput);
    fileUploadSection.appendChild(fileUploadButton);
    fileUploadSection.appendChild(filePreviewContainer);

    // Character counter
    const charCounter = document.createElement("div");
    charCounter.className = "uicm-reply-char-counter";

    // Action buttons
    const actions = document.createElement("div");
    actions.className = "uicm-reply-actions";

    const sendButton = document.createElement("button");
    sendButton.className = "uicm-reply-send";
    sendButton.textContent = "Reply";
    sendButton.disabled = true;

    actions.appendChild(sendButton);

    inputContainer.appendChild(input);
    inputContainer.appendChild(fileUploadSection);
    inputContainer.appendChild(charCounter);
    inputContainer.appendChild(actions);

    // Input event handlers
    input.addEventListener("input", () => {
      const length = input.value.length;
      const maxLength = 500;

      charCounter.textContent = `${length} / ${maxLength}`;

      // Update send button state
      updateSendButtonState();

      if (length > maxLength * 0.8) {
        charCounter.classList.add("uicm-warning");
      } else {
        charCounter.classList.remove("uicm-warning");
      }

      if (length > maxLength) {
        charCounter.classList.add("uicm-error");
      } else {
        charCounter.classList.remove("uicm-error");
      }

      // Auto-resize textarea
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    // Handle paste events for images
    input.addEventListener("paste", async (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf("image") !== -1) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              // Show loading state
              const originalPlaceholder = input.placeholder;
              input.placeholder = "🔄 Processing image...";
              input.disabled = true;

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
                selectedAttachments.push(attachment);

                this.addFilePreview(attachment, filePreviewContainer, () => {
                  selectedAttachments = selectedAttachments.filter(
                    (a) => a.id !== attachment.id
                  );
                  updateSendButtonState();
                });

                updateSendButtonState();
                console.log(
                  "📸 Image pasted and uploaded in reply:",
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
                console.error("Failed to paste image in reply:", error);
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
                input.placeholder = originalPlaceholder;
                input.disabled = false;
                input.focus();
              }
            }
          }
        }
      }
    });

    // Name input validation
    nameInput.addEventListener("input", () => {
      updateSendButtonState();
    });

    // Send reply
    const sendReply = async () => {
      const content = input.value.trim();
      const userName = nameInput.value.trim();
      const hasContent = content.length > 0;
      const hasAttachments = selectedAttachments.length > 0;

      if (
        (!hasContent && !hasAttachments) ||
        !userName ||
        this.props.comments.length === 0
      )
        return;

      try {
        sendButton.disabled = true;
        sendButton.textContent = "Sending...";

        // Use custom name if provided, otherwise use current user
        const userForReply =
          userName !== this.props.currentUser.name
            ? { ...this.props.currentUser, name: userName }
            : this.props.currentUser;

        console.log(
          "📤 Sending reply with attachments:",
          selectedAttachments.length
        );

        await this.props.onAddReply(
          this.props.comments[0].id,
          content,
          userForReply,
          selectedAttachments.length > 0 ? selectedAttachments : undefined
        );

        // Clear form after successful send
        input.value = "";
        charCounter.textContent = "0 / 500";
        charCounter.classList.remove("uicm-warning", "uicm-error");

        input.style.height = "auto";

        // Clear attachments
        selectedAttachments = [];
        filePreviewContainer.innerHTML = "";
        fileInput.value = "";

        // Force refresh the modal to show the new reply with attachments
        console.log("🔄 Force refreshing modal after reply");
        setTimeout(() => {
          // This will trigger a refresh of the modal content
          const event = new CustomEvent("uicm-reply-added", {
            detail: { commentId: this.props.comments[0].id },
          });
          document.dispatchEvent(event);
        }, 100);

        console.log("✅ Reply sent successfully");
      } catch (error) {
        console.error("Failed to send reply:", error);
      } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Reply";
      }
    };

    sendButton.onclick = sendReply;
    input.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        !sendButton.disabled
      ) {
        e.preventDefault();
        sendReply();
      }
    });

    form.appendChild(replyHeader);
    form.appendChild(inputContainer);

    return form;
  }

  public updateComments(comments: Comment[]): void {
    console.log("🔄 Updating modal comments:", comments.length);
    comments.forEach((comment, index) => {
      console.log(`📝 Comment ${index}:`, {
        id: comment.id,
        content: comment.content.substring(0, 50) + "...",
        attachments: comment.attachments?.length || 0,
        attachmentDetails:
          comment.attachments?.map((a) => ({
            type: a.type,
            filename: a.filename,
            size: a.size,
          })) || [],
      });
    });

    const previousCount = this.props.comments.length;
    this.props.comments = comments;
    this.refreshCommentsList();

    // Update comment count in header
    const commentCount = this.element.querySelector(".uicm-comment-count");
    if (commentCount) {
      commentCount.textContent = `${comments.length} comment${
        comments.length !== 1 ? "s" : ""
      }`;
    }

    // Scroll to bottom to show newest reply
    const commentsList = this.element.querySelector(".uicm-comments-list");
    if (commentsList) {
      commentsList.scrollTop = commentsList.scrollHeight;

      // Highlight newest reply if a new one was added
      if (comments.length > previousCount) {
        const commentItems =
          commentsList.querySelectorAll(".uicm-comment-item");
        const newestItem = commentItems[commentItems.length - 1] as HTMLElement;
        if (newestItem) {
          newestItem.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
          newestItem.style.transition = "background-color 0.3s ease";

          // Remove highlight after animation
          setTimeout(() => {
            newestItem.style.backgroundColor = "";
          }, 1000);
        }
      }
    }

    console.log("✅ Modal updated with new comments:", comments.length);
  }

  public updateUser(user: User): void {
    this.props.currentUser = user;
    console.log("🔄 CommentModal: User updated:", user.name);
    // Refresh the modal to show updated user info
    this.refreshCommentsList();
  }

  private refreshCommentsList(): void {
    console.log("🔄 Refreshing comments list");
    const commentsList = this.element.querySelector(".uicm-comments-list");
    if (commentsList) {
      commentsList.innerHTML = "";
      this.props.comments.forEach((comment) => {
        console.log("📝 Creating comment item for:", comment.id);
        const commentItem = this.createCommentItem(comment);
        commentsList.appendChild(commentItem);
      });
      console.log("✅ Comments list refreshed");
    }
  }

  private formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  private attachEventListeners(): void {
    // Prevent modal from closing when clicking inside modal
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("🔒 Modal internal click - prevented propagation");
    });

    // Prevent modal from closing when interacting with form elements
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

    // Close modal when clicking outside
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);
  }

  private handleOutsideClick = (e: Event): void => {
    if (!this.element.contains(e.target as Node)) {
      this.props.onClose();
    }
  };

  public getElement(): HTMLElement {
    return this.element;
  }

  public reposition(): void {
    // Reposition modal to ensure it stays within viewport with 100px padding
    repositionInViewport(this.element, {
      padding: 100,
      preferredSide: "bottom",
    });
  }

  public destroy(): void {
    if (this.imageModal) {
      this.imageModal.destroy();
      this.imageModal = null;
    }
    document.removeEventListener("click", this.handleOutsideClick);
    this.element.remove();
  }
}
