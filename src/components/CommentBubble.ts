import { Comment, User, CommentStatus, CommentAttachment } from "../types";
import { CommentModal } from "./CommentModal";
import { constrainToViewport } from "../utils/dom";
import { ImageModal } from "./ImageModal";
import { getRoleColor } from "../utils/roleColors";

export interface CommentBubbleProps {
  comment: Comment;
  position: { x: number; y: number };
  currentUser: User;
  onReply: (
    commentId: string,
    content: string,
    user?: User,
    attachments?: CommentAttachment[]
  ) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
  onShowModal: (modal: any) => void; // Callback to CommentManager for centralized modal management
}

export class CommentBubble {
  private element: HTMLElement;
  private props: CommentBubbleProps;
  private modal: CommentModal | null = null;
  private imageModal: ImageModal | null = null;

  constructor(props: CommentBubbleProps) {
    console.log("🔧 Creating CommentBubble:", props.comment.id);
    this.props = props;
    this.element = this.createElement();
    console.log("📦 Element created:", this.element);
    this.attachEventListeners();
    console.log("🎯 Event listeners attached");

    // Add global click listener to test if bubble receives clicks
    document.addEventListener("click", (e) => {
      if (
        e.target === this.element ||
        this.element.contains(e.target as Node)
      ) {
        console.log(
          "🎯 Global click detected on bubble:",
          this.props.comment.id
        );
        console.log("🎯 Click target:", e.target);
        console.log("🎯 Bubble element:", this.element);
      }
    });
  }

  private checkBubbleVisibility(): void {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Check what element is at the bubble's center point
    const elementAtPoint = document.elementFromPoint(centerX, centerY);

    console.log("👁️ Bubble visibility check:", {
      commentId: this.props.comment.id,
      rect: rect,
      centerPoint: { x: centerX, y: centerY },
      elementAtPoint: elementAtPoint,
      isOwnElement: elementAtPoint === this.element,
      isVisible: rect.width > 0 && rect.height > 0,
      computedStyle: {
        display: getComputedStyle(this.element).display,
        visibility: getComputedStyle(this.element).visibility,
        opacity: getComputedStyle(this.element).opacity,
        pointerEvents: getComputedStyle(this.element).pointerEvents,
        zIndex: getComputedStyle(this.element).zIndex,
      },
    });
  }

  private testBubbleClickability(): void {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Check what element is at the bubble's center point
    const elementAtPoint = document.elementFromPoint(centerX, centerY);

    console.log("🧪 BUBBLE CLICKABILITY TEST:", {
      commentId: this.props.comment.id,
      bubbleElement: this.element,
      elementRect: rect,
      elementAtCenter: elementAtPoint,
      isClickable: elementAtPoint === this.element,
      parentElement: this.element.parentElement,
      parentDisplay: this.element.parentElement?.style.display,
      parentComputedDisplay: this.element.parentElement
        ? getComputedStyle(this.element.parentElement).display
        : null,
      bubbleStyles: {
        display: getComputedStyle(this.element).display,
        visibility: getComputedStyle(this.element).visibility,
        opacity: getComputedStyle(this.element).opacity,
        pointerEvents: getComputedStyle(this.element).pointerEvents,
        zIndex: getComputedStyle(this.element).zIndex,
        position: getComputedStyle(this.element).position,
      },
    });

    // Try to trigger a click programmatically to test
    console.log("🔄 Attempting programmatic click...");
    this.element.click();
  }

  private getStatusColor(): { bg: string; border: string; text: string } {
    switch (this.props.comment.status) {
      case CommentStatus.BUG:
        return { bg: "#dc3545", border: "#c82333", text: "white" }; // Red
      case CommentStatus.FEATURE_REQUEST:
        return { bg: "#ffc107", border: "#e0a800", text: "black" }; // Yellow
      case CommentStatus.DEV_COMPLETED:
        return { bg: "#3b82f6", border: "#2066b3", text: "white" }; // Blue
      case CommentStatus.DONE:
        return { bg: "#28a745", border: "#1e7e34", text: "white" }; // Green
      case CommentStatus.ARCHIVED:
        return { bg: "#6c757d", border: "#545b62", text: "white" }; // Gray
      default:
        return { bg: "#007bff", border: "#0056b3", text: "white" }; // Default blue
    }
  }

  private createElement(): HTMLElement {
    const bubble = document.createElement("div");
    bubble.className = "uicm-comment-bubble";
    bubble.style.position = "absolute";
    bubble.style.left = `${this.props.position.x}px`;
    bubble.style.top = `${this.props.position.y}px`;
    bubble.style.width = "32px";
    bubble.style.height = "32px";
    bubble.style.borderRadius = "50%";

    const colors = this.getStatusColor();
    bubble.style.backgroundColor = colors.bg;
    bubble.style.border = `2px solid ${colors.border}`;
    bubble.style.color = colors.text;

    bubble.style.cursor = "pointer";
    bubble.style.display = "flex";
    bubble.style.alignItems = "center";
    bubble.style.justifyContent = "center";
    bubble.style.fontSize = "16px";
    bubble.style.fontWeight = "bold";
    bubble.style.zIndex = "100"; // Relative to interaction layer which has z-index 2
    bubble.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
    bubble.style.transition = "all 0.2s ease";
    bubble.style.position = "relative";

    // Show chat icon instead of number
    bubble.innerHTML = "💬";

    // Create comment count badge
    const commentCount = 1 + (this.props.comment.replies?.length || 0);
    const countBadge = document.createElement("div");
    countBadge.className = "uicm-comment-count-badge";
    countBadge.textContent = commentCount.toString();
    countBadge.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      background: ${colors.bg};
      color: ${colors.text};
      border: 2px solid ${colors.border};
      border-radius: 50%;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      z-index: 101;
    `;

    bubble.appendChild(countBadge);

    // Add status and role tooltip
    const roleColors = getRoleColor(this.props.comment.role);
    bubble.title = `Status: ${this.props.comment.status.toUpperCase()} | Role: ${this.props.comment.role.toUpperCase()} | Comments: ${commentCount}`;

    // Add role indicator with color
    const roleIndicator = document.createElement("div");
    roleIndicator.className = "uicm-role-indicator";
    roleIndicator.style.cssText = `
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${roleColors.border};
      border: 1px solid white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      z-index: 102;
    `;

    bubble.appendChild(roleIndicator);

    console.log("💬 Chat bubble element created:", {
      className: bubble.className,
      position: { x: this.props.position.x, y: this.props.position.y },
      status: this.props.comment.status,
      colors: colors,
      commentCount: commentCount,
    });

    return bubble;
  }

  private attachEventListeners(): void {
    console.log("🔗 Attaching event listeners to bubble");

    this.element.addEventListener("click", this.handleClick);
    console.log("✅ Click listener attached");

    this.element.addEventListener("mouseenter", () => {
      console.log("🐭 Mouse enter bubble");
      this.element.style.transform = "scale(1.1)";
    });

    this.element.addEventListener("mouseleave", () => {
      console.log("🐭 Mouse leave bubble");
      this.element.style.transform = "scale(1)";
    });

    // Listen for reply added events to refresh modal
    document.addEventListener("uicm-reply-added", (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail.commentId === this.props.comment.id &&
        this.modal
      ) {
        console.log("🔄 Reply added event received, refreshing modal");
        const updatedComments = [
          this.props.comment,
          ...this.props.comment.replies,
        ];
        this.modal.updateComments(updatedComments);
      }
    });
  }

  private handleClick = (e: Event): void => {
    console.log("🔵 CommentBubble clicked!", this.props.comment.id);
    console.log("🔵 Click event details:", {
      target: e.target,
      currentTarget: e.currentTarget,
      type: e.type,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      eventPhase: e.eventPhase,
      isTrusted: e.isTrusted,
    });

    console.log("🔵 Bubble element state:", {
      element: this.element,
      parent: this.element.parentElement,
      parentDisplay: this.element.parentElement?.style.display,
      rect: this.element.getBoundingClientRect(),
    });

    e.stopPropagation();
    e.preventDefault();

    // Get click position from mouse event
    const mouseEvent = e as MouseEvent;
    const clickPosition = {
      x: mouseEvent.clientX || this.props.position.x,
      y: mouseEvent.clientY || this.props.position.y,
    };

    console.log("🔄 About to show modal at click position:", clickPosition);
    this.showModal(clickPosition);
  };

  private showModal(position: { x: number; y: number }): void {
    console.log("🔄 Creating modal for comment:", this.props.comment.id);

    // Destroy existing modal if any
    if (this.modal) {
      console.log("🗑️ Destroying existing modal");
      this.modal.destroy();
      this.modal = null;
    }

    // Get all comments for this element (main comment + replies)
    const allComments = [this.props.comment, ...this.props.comment.replies];
    console.log("📝 Modal comments:", allComments.length);

    // Calculate initial modal position
    const initialPosition = {
      x: position.x + 30,
      y: position.y,
    };

    // Create modal with initial position
    this.modal = new CommentModal({
      comments: allComments,
      currentUser: this.props.currentUser,
      position: initialPosition,
      onClose: () => {
        console.log("❌ Modal closed");
        if (this.modal) {
          this.modal.destroy();
          this.modal = null;
        }
      },
      onAddReply: async (
        commentId: string,
        content: string,
        user?: User,
        attachments?: CommentAttachment[]
      ) => {
        console.log(
          "💬 Adding reply:",
          commentId,
          content,
          user?.name,
          "attachments:",
          attachments?.length || 0
        );
        await this.props.onReply(commentId, content, user, attachments);

        // Update modal with refreshed comment data (including new reply)
        if (this.modal) {
          const updatedComments = [
            this.props.comment,
            ...this.props.comment.replies,
          ];
          this.modal.updateComments(updatedComments);
        }

        // Update comment count display
        const commentCount = 1 + (this.props.comment.replies?.length || 0);
        const countBadge = this.element.querySelector(
          ".uicm-comment-count-badge"
        ) as HTMLElement;
        if (countBadge) {
          countBadge.textContent = commentCount.toString();
        }
        this.element.title = `Status: ${this.props.comment.status.toUpperCase()} | Comments: ${commentCount}`;
      },
      onStatusChange: async (commentId: string, status: CommentStatus) => {
        console.log("🔄 Changing status:", commentId, status);
        await this.props.onStatusChange(commentId, status);
        // Update bubble appearance
        this.updateBubbleAppearance();
      },
      onDeleteComment: async (commentId: string) => {
        console.log("🗑️ Deleting comment:", commentId);
        await this.props.onDelete(commentId);

        // Update bubble appearance after deletion
        this.updateBubbleAppearance();

        // If this was the main comment being deleted, close modal
        if (commentId === this.props.comment.id) {
          if (this.modal) {
            this.modal.destroy();
            this.modal = null;
          }
        }
      },
    });

    console.log("✅ Modal created, using CommentManager to show");

    // Use CommentManager for centralized modal management
    this.props.onShowModal(this.modal);

    // Add modal to interaction layer
    const interactionLayer = document.getElementById("uicm-interaction-layer");
    if (interactionLayer) {
      interactionLayer.appendChild(this.modal.getElement());
      // Reposition modal to ensure it stays within viewport
      this.modal.reposition();
      console.log("🎯 Modal appended to interaction layer");
    }
  }

  public updateComment(comment: Comment): void {
    console.log("🔄 CommentBubble.updateComment called:", {
      commentId: comment.id,
      oldRepliesCount: this.props.comment.replies?.length || 0,
      newRepliesCount: comment.replies?.length || 0,
      modalExists: !!this.modal,
    });

    this.props.comment = comment;
    this.updateBubbleAppearance();

    // Update modal if it exists and is open
    if (this.modal) {
      console.log("🔄 Updating modal with new comment data");
      const updatedComments = [
        this.props.comment,
        ...this.props.comment.replies,
      ];
      this.modal.updateComments(updatedComments);
    }
  }

  public updateUser(user: User): void {
    this.props.currentUser = user;
    console.log("🔄 CommentBubble: User updated:", user.name);
    // Refresh modal if it's open
    if (this.modal) {
      this.modal.updateUser(user);
    }
  }

  private updateBubbleAppearance(): void {
    const colors = this.getStatusColor();
    this.element.style.backgroundColor = colors.bg;
    this.element.style.border = `2px solid ${colors.border}`;
    this.element.style.color = colors.text;

    const commentCount = 1 + (this.props.comment.replies?.length || 0);

    // Update count badge
    const countBadge = this.element.querySelector(
      ".uicm-comment-count-badge"
    ) as HTMLElement;
    if (countBadge) {
      countBadge.textContent = commentCount.toString();
      countBadge.style.background = colors.bg;
      countBadge.style.color = colors.text;
      countBadge.style.borderColor = colors.border;
    }

    // Update role indicator
    const roleIndicator = this.element.querySelector(
      ".uicm-role-indicator"
    ) as HTMLElement;
    if (roleIndicator) {
      const roleColors = getRoleColor(this.props.comment.role);
      roleIndicator.style.background = roleColors.border;
    }

    this.element.title = `Status: ${this.props.comment.status.toUpperCase()} | Role: ${this.props.comment.role.toUpperCase()} | Comments: ${commentCount}`;

    console.log("💬 Chat bubble appearance updated:", {
      status: this.props.comment.status,
      role: this.props.comment.role,
      colors: colors,
      commentCount: commentCount,
    });
  }

  public updatePosition(position: { x: number; y: number }): void {
    this.props.position = position;
    this.element.style.left = `${position.x}px`;
    this.element.style.top = `${position.y}px`;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    if (this.modal) {
      this.modal.destroy();
    }
    this.element.removeEventListener("click", this.handleClick);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  public testClickability(): void {
    console.log("🧪 TESTING BUBBLE CLICKABILITY for:", this.props.comment.id);
    this.testBubbleClickability();
  }
}
