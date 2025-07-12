import {
  Comment,
  CommentMode,
  CommentManagerConfig,
  CommentStatus,
  User,
  CommentAttachment,
} from "../types";
import { CommentBubble } from "../components/CommentBubble";
import { CommentForm } from "../components/CommentForm";
import { DebugIcon } from "../components/DebugIcon";
import {
  debounce,
  generateId,
  getCommentPositionFromClick,
  getXPath,
} from "../utils/dom";
import {
  addMobileCSS,
  isMobileDevice,
  isTouchDevice,
  removeMobileCSS,
  TouchGestureRecognizer,
} from "../utils/mobile";
import {
  EventBatcher,
  LRUCache,
  rafThrottle,
  throttle,
  VisibilityObserver,
} from "../utils/performance";
import {
  getElementByXPath,
  getElementXPath,
  isElementValid,
} from "../utils/xpath";

export class CommentManager {
  private config: CommentManagerConfig;
  private comments: Comment[] = [];
  private commentBubbles: Map<string, CommentBubble> = new Map();
  private activeForm: CommentForm | null = null;
  private activeModal: any | null = null; // For comment modals
  private activeOverlay: HTMLElement | null = null; // For event blocking
  private mode: CommentMode = "normal";
  private root: HTMLElement;
  private mutationTimeout: number | undefined = undefined;
  private escKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Performance optimizations
  private visibilityObserver: VisibilityObserver;
  private eventBatcher: EventBatcher;
  private positionCache: LRUCache<string, { x: number; y: number }>;
  private throttledUpdatePositions = throttle(() => {
    this.updateBubblePositions();
  }, 100);
  private rafUpdatePositions = rafThrottle(() => {
    this.updateBubblePositions();
  });

  // Mobile support
  private isMobile: boolean;
  private touchGestureRecognizer: TouchGestureRecognizer | null = null;

  private debouncedUpdatePositions = debounce(() => {
    this.updateBubblePositions();
  }, 100);

  constructor(config: CommentManagerConfig, root: HTMLElement) {
    this.config = config;
    this.root = root;

    // Initialize performance optimizations
    this.visibilityObserver = new VisibilityObserver({
      threshold: 0.1,
      rootMargin: "50px",
    });
    this.eventBatcher = new EventBatcher();
    this.positionCache = new LRUCache(50);

    // Initialize mobile support
    this.isMobile = isMobileDevice();
    if (this.isMobile) {
      addMobileCSS();
    }

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // ESC key handler to exit comment mode and close components
    this.escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("🔑 ESC pressed");

        // If modal or form is active, close them first
        if (this.activeModal || this.activeForm) {
          this.closeActiveComponents();
          e.preventDefault();
          e.stopPropagation();
        }
        // If in comment mode with no active components, exit comment mode
        else if (this.mode === "comment") {
          this.setMode("normal");
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("keydown", this.escKeyHandler);

    // Throttle scroll for better performance - only when in comment mode
    const handleScroll = throttle(() => {
      // Only update if we have bubbles and are in comment mode
      if (this.commentBubbles.size > 0 && this.mode === "comment") {
        this.updateBubblePositions();
      }
    }, 16); // ~60fps

    const handleResize = debounce(() => {
      // Only update if we have bubbles and are in comment mode
      if (this.commentBubbles.size > 0 && this.mode === "comment") {
        // Clear cache on resize
        this.positionCache.clear();
        this.updateBubblePositions();
      }
    }, 100);

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleResize);

    // Also listen for orientation change on mobile
    window.addEventListener("orientationchange", () => {
      // Only update if we have bubbles and are in comment mode
      if (this.commentBubbles.size > 0 && this.mode === "comment") {
        // Clear cache on orientation change
        this.positionCache.clear();
        // Add delay for orientation change to complete
        setTimeout(() => {
          this.updateBubblePositions();
        }, 100);
      }
    });

    // Listen for DOM changes that might affect element positions
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver((mutations) => {
        // Skip if no bubbles to update or not in comment mode
        if (this.commentBubbles.size === 0 || this.mode !== "comment") {
          return;
        }

        let shouldUpdate = false;

        // Filter out SDK-related mutations to avoid infinite loops
        for (const mutation of mutations) {
          const target = mutation.target as Element;

          // Skip if mutation is on SDK elements
          if (
            target.closest("[data-uicm-element]") ||
            target.classList?.contains("uicm-highlight") ||
            target.id?.startsWith("uicm-")
          ) {
            continue;
          }

          // Only update for meaningful changes
          if (
            mutation.type === "childList" ||
            (mutation.type === "attributes" &&
              ["style", "class"].indexOf(mutation.attributeName!) !== -1)
          ) {
            shouldUpdate = true;
            break;
          }
        }

        if (shouldUpdate) {
          // Debounce DOM mutation updates
          clearTimeout(this.mutationTimeout);
          this.mutationTimeout = setTimeout(() => {
            this.updateBubblePositions();
          }, 100); // Increased debounce time
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    // Add event listeners
    document.addEventListener("click", this.handleElementClick);
    document.addEventListener("mouseenter", this.handleElementMouseEnter, true);
    document.addEventListener("mouseleave", this.handleElementMouseLeave, true);

    // Add touch gesture support for mobile
    if (this.isMobile && isTouchDevice()) {
      this.touchGestureRecognizer = new TouchGestureRecognizer(document.body, {
        onTap: (event) => {
          if (this.mode === "comment") {
            // Convert touch event to mouse event-like object
            const mouseEvent = new MouseEvent("click", {
              clientX: event.x,
              clientY: event.y,
              bubbles: true,
              cancelable: true,
            });
            Object.defineProperty(mouseEvent, "target", {
              value: event.target,
              writable: false,
            });
            this.handleElementClick(mouseEvent);
          }
        },
        onLongPress: (event) => {
          if (this.mode === "normal") {
            // Enable comment mode on long press
            this.setMode("comment");
          }
        },
      });
    }

    // Initial position update only if needed
    setTimeout(() => {
      if (this.commentBubbles.size > 0) {
        this.forceUpdateBubblePositions();
      }
    }, 100);
  }

  private handleElementClick = (e: Event): void => {
    console.log("🔍 handleElementClick called", {
      mode: this.mode,
      target: e.target,
      currentTarget: e.currentTarget,
      targetElement: (e.target as HTMLElement)?.tagName,
      targetClass: (e.target as HTMLElement)?.className,
    });

    if (this.mode !== "comment") {
      console.log("❌ Not in comment mode, ignoring click");
      return;
    }

    // Check if we're navigating from sidebar (prevent form opening)
    if ((window as any).uicmIsNavigatingFromSidebar) {
      console.log("🔒 Navigating from sidebar, preventing form opening");
      return;
    }

    const mouseEvent = e as MouseEvent;
    const clickTarget = e.target as HTMLElement;

    // Check if click is on a comment bubble - let bubble handle it
    if (
      clickTarget.classList.contains("uicm-comment-bubble") ||
      clickTarget.closest(".uicm-comment-bubble")
    ) {
      console.log("🔵 Click on bubble, letting bubble handle it");
      return;
    }

    // Check if click is inside form layer or any SDK element
    const formLayer = document.querySelector(".uicm-comment-form");
    if (formLayer && formLayer.contains(clickTarget)) {
      console.log("❌ Click inside form layer, ignoring");
      return;
    }

    console.log("🎯 Processing element click for new comment...");

    // Temporarily hide all SDK elements
    const sdkElements = document.querySelectorAll("[data-uicm-element]");
    const originalDisplay: string[] = [];
    sdkElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      originalDisplay[index] = htmlEl.style.display;
      htmlEl.style.display = "none";
    });

    // Get the actual element under the click point
    const target = document.elementFromPoint(
      mouseEvent.clientX,
      mouseEvent.clientY
    ) as Element;

    // Restore SDK elements
    sdkElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplay[index];
    });

    console.log("🎯 Click target:", {
      element: target,
      tagName: target?.tagName,
      id: target?.id,
      className: target?.className,
      xpath: target ? getElementXPath(target) : null,
    });

    // Ignore if no target found or if it's an SDK element
    if (!target || target.closest("[data-uicm-element]")) {
      console.log("❌ Invalid target or SDK element, ignoring");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { position, relativePosition } = getCommentPositionFromClick(target, {
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY,
    });

    this.showCommentForm(target, position, relativePosition);
  };

  private handleElementMouseEnter = (e: MouseEvent): void => {
    // Only process highlights in comment mode
    if (this.mode !== "comment") {
      return;
    }

    const target = e.target as HTMLElement;
    if (target.hasAttribute("data-uicm-element")) return;

    const highlightLayer = document.getElementById("uicm-highlight-layer");
    if (!highlightLayer) return;

    const rect = target.getBoundingClientRect();
    const highlight = document.createElement("div");
    highlight.className = "uicm-highlight";
    highlight.style.position = "absolute";
    highlight.style.top = `${rect.top}px`;
    highlight.style.left = `${rect.left}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    // highlight.style.border = "2px solid rgba(255, 0, 0, 0.5)";
    // highlight.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
    highlight.style.pointerEvents = "none";

    highlightLayer.appendChild(highlight);

    // Store the highlight element for removal
    target.dataset.uicmHighlight = highlight.id = generateId();
  };

  private handleElementMouseLeave = (e: MouseEvent): void => {
    // Only process highlights in comment mode
    if (this.mode !== "comment") {
      return;
    }

    const target = e.target as HTMLElement;
    if (target.hasAttribute("data-uicm-element")) return;

    const highlightId = target.dataset.uicmHighlight;
    if (highlightId) {
      const highlight = document.getElementById(highlightId);
      if (highlight) {
        highlight.remove();
      }
      delete target.dataset.uicmHighlight;
    }
  };

  private handleCommentSubmit = async (
    content: string,
    element: Element,
    position: { x: number; y: number },
    userName?: string
  ) => {
    if (!element || !content.trim()) return;

    const xpath = getXPath(element);
    if (!xpath) return;

    // Create user object with updated name if provided
    const user = userName
      ? { ...this.config.currentUser, name: userName }
      : this.config.currentUser;

    // Create new comment
    const comment: Comment = {
      id: generateId(),
      content: content.trim(),
      xpath,
      url: this.getCurrentUrl(),
      position,
      relativePosition: { x: 0, y: 0 }, // Calculate relative position if needed
      createdAt: new Date().toISOString(),
      createdBy: user,
      role: user.role || "other", // Add role from user
      replies: [],
      status: CommentStatus.BUG, // Replies start as BUG
    };

    // Add comment to list
    this.comments.push(comment);

    // Create bubble for the comment
    this.createCommentBubble(comment);

    // Close the form
    this.closeActiveComponents();

    // Save to backend if configured
    if (this.config.onSaveComment) {
      try {
        const savedComment = await this.config.onSaveComment(comment);
        // Update local comment with saved data
        Object.assign(comment, savedComment);
      } catch (error) {
        console.error("Failed to save comment:", error);
      }
    }
  };

  private closeActiveComponents(): void {
    // Close active form
    if (this.activeForm) {
      const formElement = this.activeForm.getElement();
      if (formElement && formElement.parentNode) {
        formElement.parentNode.removeChild(formElement);
      }
      this.activeForm = null;
    }

    // Close active modal
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }

    // Remove overlay
    this.removeOverlay();
  }

  private createOverlay(): HTMLElement {
    // Remove existing overlay first
    this.removeOverlay();

    const overlay = document.createElement("div");
    overlay.className = "uicm-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
    overlay.style.zIndex = "999997"; // Below interaction layer but above page content
    overlay.style.cursor = "pointer";

    // Close on overlay click (only if click target is overlay itself)
    overlay.addEventListener("click", (e) => {
      // Only close if the click target is the overlay itself (not modal/form inside)
      if (e.target === overlay) {
        e.stopPropagation();
        console.log("🔒 Overlay direct click, closing active components");
        this.closeActiveComponents();
      }
    });

    // Add global document click listener for outside clicks
    const globalClickHandler = (e: Event) => {
      // Check if click is outside modal/form
      const target = e.target as Node;
      const isInsideModal =
        target &&
        this.activeModal &&
        this.activeModal.getElement &&
        this.activeModal.getElement().contains(target);
      const isInsideForm =
        target &&
        this.activeForm &&
        this.activeForm.getElement().contains(target);

      // If not inside modal or form, close components
      if (!isInsideModal && !isInsideForm) {
        console.log(
          "🔒 Global click outside modal/form, closing active components"
        );
        this.closeActiveComponents();
        document.removeEventListener("click", globalClickHandler);
      }
    };

    // Add global click listener with slight delay to avoid immediate closure
    setTimeout(() => {
      document.addEventListener("click", globalClickHandler);
    }, 100);

    // Add to root
    const interactionLayer = document.getElementById("uicm-interaction-layer");
    if (interactionLayer) {
      interactionLayer.appendChild(overlay);
    }

    this.activeOverlay = overlay;
    console.log("✅ Overlay created with global click handler");
    return overlay;
  }

  private removeOverlay(): void {
    if (this.activeOverlay) {
      if (this.activeOverlay.parentNode) {
        this.activeOverlay.parentNode.removeChild(this.activeOverlay);
      }
      this.activeOverlay = null;
      console.log("✅ Overlay removed");
    }
  }

  public showModal(modal: any): void {
    console.log("🔄 CommentManager: Showing modal");

    // Close any existing components
    this.closeActiveComponents();

    // Create overlay for event blocking
    this.createOverlay();

    // Set active modal
    this.activeModal = modal;

    console.log("✅ Modal shown with overlay");
  }

  private showCommentForm(
    element: Element,
    position: { x: number; y: number },
    relativePosition: { x: number; y: number }
  ): void {
    // Close any existing components first
    this.closeActiveComponents();

    // Create overlay for event blocking
    this.createOverlay();

    // Use requestAnimationFrame to avoid blocking the UI
    requestAnimationFrame(() => {
      const form = new CommentForm({
        onSubmit: async (
          content: string,
          userName?: string,
          attachments?: CommentAttachment[]
        ) => {
          // Calculate more accurate relative position
          const rect = element.getBoundingClientRect();

          // Calculate relative position based on click position within element
          // Note: position parameter is already in viewport coordinates
          const relativeX = Math.max(
            0,
            Math.min(1, (position.x - rect.left) / rect.width)
          );
          const relativeY = Math.max(
            0,
            Math.min(1, (position.y - rect.top) / rect.height)
          );

          // Create user object with updated name if provided
          const user = userName
            ? { ...this.config.currentUser, name: userName }
            : this.config.currentUser;

          const commentData = {
            content,
            xpath: getXPath(element) || "",
            url: this.getCurrentUrl(),
            position: {
              x: rect.left + rect.width * relativeX,
              y: rect.top + rect.height * relativeY,
            },
            relativePosition: { x: relativeX, y: relativeY },
            createdBy: user,
            role: user.role || "other", // Add role from user
            status: CommentStatus.BUG, // New comments start as BUG
            replies: [] as Comment[],
            attachments: attachments || [], // Add attachments to new comment
          };

          const newComment = await this.config.onSaveComment(commentData);
          this.comments.push(newComment);
          this.createCommentBubble(newComment);
          this.closeActiveComponents();
        },
        onCancel: () => this.closeActiveComponents(),
        position,
        element,
        currentUser: this.config.currentUser,
      });

      const interactionLayer = document.getElementById(
        "uicm-interaction-layer"
      );
      if (interactionLayer) {
        interactionLayer.appendChild(form.getElement());
        // Reposition form to ensure it stays within viewport
        form.reposition();
      }

      this.activeForm = form;
      console.log("✅ Comment form shown with overlay");
    });
  }

  private hideCommentForm(): void {
    if (this.activeForm) {
      this.activeForm.destroy();
      this.activeForm = null;
    }
  }

  private addBubbleToLayer(bubble: CommentBubble): void {
    const interactionLayer = document.getElementById("uicm-interaction-layer");
    if (!interactionLayer) {
      console.error("❌ Interaction layer not found");
      return;
    }

    interactionLayer.appendChild(bubble.getElement());
    console.log("✅ Bubble added to interaction layer");
  }

  private async createComment(
    element: Element,
    content: string,
    position: { x: number; y: number },
    relativePosition: { x: number; y: number }
  ): Promise<void> {
    const xpath = getXPath(element);
    if (!xpath) return;

    const commentData = {
      content: content.trim(),
      xpath,
      url: this.getCurrentUrl(),
      position,
      relativePosition,
      createdBy: this.config.currentUser,
      role: this.config.currentUser.role || "other", // Add role from current user
      status: CommentStatus.BUG, // New comments start as BUG
      replies: [] as Comment[],
    };

    try {
      const newComment = await this.config.onSaveComment(commentData);
      this.comments.push(newComment);
      this.createCommentBubble(newComment);
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  }

  private createCommentBubble(comment: Comment): void {
    const element = getElementByXPath(comment.xpath);
    if (!element || !isElementValid(element)) {
      console.warn("Element not found for comment:", comment.xpath);
      return;
    }

    // Calculate current viewport position from element and relative position
    const rect = element.getBoundingClientRect();

    const absoluteX = rect.left + rect.width * comment.relativePosition.x;
    const absoluteY = rect.top + rect.height * comment.relativePosition.y;

    const bubble = new CommentBubble({
      comment,
      position: { x: absoluteX, y: absoluteY },
      currentUser: this.config.currentUser,
      onReply: (
        commentId: string,
        content: string,
        user?: User,
        attachments?: CommentAttachment[]
      ) => this.addReply(commentId, content, user, attachments),
      onResolve: (commentId: string) => this.resolveComment(commentId),
      onDelete: (commentId: string) => this.deleteComment(commentId),
      onShowModal: (modal: any) => this.showModal(modal), // Pass callback for centralized modal management
      onStatusChange: (commentId: string, status: CommentStatus) =>
        this.changeCommentStatus(commentId, status),
    });

    this.addBubbleToLayer(bubble);
    this.commentBubbles.set(comment.id, bubble);

    // Add to visibility observer for performance
    this.visibilityObserver.observe(
      bubble.getElement(),
      (isVisible: boolean) => {
        // Bubble visibility changed
      }
    );

    // Cache the position
    this.positionCache.set(comment.id, { x: absoluteX, y: absoluteY });
  }

  private async addReply(
    commentId: string,
    content: string,
    user?: User,
    attachments?: CommentAttachment[]
  ): Promise<void> {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Use provided user or fallback to current user
    const replyUser = user || this.config.currentUser;

    const reply: Comment = {
      id: generateId(),
      content,
      xpath: comment.xpath,
      url: comment.url,
      position: comment.position,
      relativePosition: comment.relativePosition,
      createdAt: new Date().toISOString(),
      createdBy: replyUser,
      role: replyUser.role || "other", // Add role from reply user
      replies: [],
      status: CommentStatus.BUG, // Replies start as BUG
      attachments: attachments || [], // Add attachments to reply
    };

    comment.replies.push(reply);

    // Update comment via API if configured
    if (this.config.onUpdateComment) {
      await this.config.onUpdateComment(comment);
    }

    // Update bubble
    const bubble = this.commentBubbles.get(commentId);
    if (bubble) {
      bubble.updateComment(comment);
    }
  }

  private async resolveComment(commentId: string): Promise<void> {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return;

    comment.status = CommentStatus.DONE;
    comment.resolvedAt = new Date().toISOString();

    // Update comment via API if configured
    if (this.config.onUpdateComment) {
      await this.config.onUpdateComment(comment);
    }

    // Update bubble
    const bubble = this.commentBubbles.get(commentId);
    if (bubble) {
      bubble.updateComment(comment);
    }
  }

  private async changeCommentStatus(
    commentId: string,
    status: CommentStatus
  ): Promise<void> {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return;

    const previousStatus = comment.status;
    comment.status = status;

    // Update timestamps based on status
    if (
      status === CommentStatus.DONE &&
      previousStatus !== CommentStatus.DONE
    ) {
      comment.resolvedAt = new Date().toISOString();
    } else if (
      status === CommentStatus.ARCHIVED &&
      previousStatus !== CommentStatus.ARCHIVED
    ) {
      comment.archivedAt = new Date().toISOString();
    }

    console.log("📝 Comment status changed:", {
      commentId,
      previousStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });

    // Update comment via API if configured
    if (this.config.onUpdateComment) {
      await this.config.onUpdateComment(comment);
    }

    // Update bubble
    const bubble = this.commentBubbles.get(commentId);
    if (bubble) {
      bubble.updateComment(comment);
    }

    // Emit status change event
    // this.emit("comment-updated", { comment });
  }

  private async deleteComment(commentId: string): Promise<void> {
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Update resolved status
    comment.status = CommentStatus.ARCHIVED;

    if (this.config.onDeleteComment) {
      try {
        await this.config.onDeleteComment(commentId);
      } catch (error) {
        console.error("Failed to delete comment:", error);
        return;
      }
    }

    // Remove from local array
    this.comments = this.comments.filter((c) => c.id !== commentId);

    // Remove bubble
    const bubble = this.commentBubbles.get(commentId);
    if (bubble) {
      bubble.destroy();
      this.commentBubbles.delete(commentId);
    }
  }

  private updateBubblePositions(): void {
    // Only update if we have bubbles AND are in comment mode
    if (this.commentBubbles.size === 0) {
      return;
    }

    // In normal mode, bubbles should be static - no need to update positions
    if (this.mode === "normal") {
      return;
    }

    console.log(
      "🔄 Updating bubble positions, total bubbles:",
      this.commentBubbles.size,
      "mode:",
      this.mode
    );

    this.commentBubbles.forEach((bubble, commentId) => {
      const comment = this.comments.find((c) => c.id === commentId);
      if (!comment) {
        console.warn("❌ Comment not found for bubble:", commentId);
        return;
      }

      // Hide archived bubbles
      if (comment.status === CommentStatus.ARCHIVED) {
        bubble.getElement().style.display = "none";
        console.log("📦 Hiding archived bubble:", commentId);
        return;
      }

      const element = getElementByXPath(comment.xpath);
      if (!element || !isElementValid(element)) {
        // Element not found, hide bubble
        console.log("❌ Element not found, hiding bubble:", comment.xpath);
        bubble.getElement().style.display = "none";
        return;
      }

      // Show bubble if it was hidden (and not archived)
      bubble.getElement().style.display = "flex";

      // Get current element position
      const rect = element.getBoundingClientRect();

      // Calculate viewport position from relative position
      // Note: Root container uses position:fixed, so we need viewport coordinates, not document coordinates
      const absoluteX = rect.left + rect.width * comment.relativePosition.x;
      const absoluteY = rect.top + rect.height * comment.relativePosition.y;

      console.log("📍 Updating bubble position:", {
        commentId,
        xpath: comment.xpath,
        elementRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        relativePosition: comment.relativePosition,
        newPosition: { x: absoluteX, y: absoluteY },
        status: comment.status,
      });

      // Update bubble position
      bubble.updatePosition({ x: absoluteX, y: absoluteY });

      // Update cache
      this.positionCache.set(commentId, { x: absoluteX, y: absoluteY });
    });
  }

  private forceUpdateBubblePositions(): void {
    // Force update positions regardless of mode - used for initial load and new comments
    if (this.commentBubbles.size === 0) {
      return;
    }

    console.log(
      "🔄 Force updating bubble positions:",
      this.commentBubbles.size
    );

    this.commentBubbles.forEach((bubble, commentId) => {
      const comment = this.comments.find((c) => c.id === commentId);
      if (!comment) {
        console.warn("❌ Comment not found for bubble:", commentId);
        return;
      }

      const element = getElementByXPath(comment.xpath);
      if (!element || !isElementValid(element)) {
        // Element not found, hide bubble
        bubble.getElement().style.display = "none";
        return;
      }

      // Show bubble if it was hidden
      bubble.getElement().style.display = "flex";

      // Get current element position
      const rect = element.getBoundingClientRect();

      // Calculate viewport position from relative position
      const absoluteX = rect.left + rect.width * comment.relativePosition.x;
      const absoluteY = rect.top + rect.height * comment.relativePosition.y;

      // Update bubble position
      bubble.updatePosition({ x: absoluteX, y: absoluteY });

      // Update cache
      this.positionCache.set(commentId, { x: absoluteX, y: absoluteY });
    });
  }

  private getCurrentUrl(): string {
    return window.location.href;
  }

  public async loadComments(): Promise<void> {
    try {
      const allComments = await this.config.onLoadComments();
      const currentUrl = this.getCurrentUrl();

      // Filter comments to only show those from the current URL
      this.comments = allComments.filter(
        (comment) => comment.url === currentUrl
      );

      // Create bubbles for all comments
      this.comments.forEach((comment) => {
        this.createCommentBubble(comment);
      });

      // Force update positions after loading comments
      if (this.comments.length > 0) {
        setTimeout(() => {
          this.forceUpdateBubblePositions();
        }, 100);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  }

  private updateLayerVisibility(): void {
    const interactionLayer = document.getElementById("uicm-interaction-layer");
    const highlightLayer = document.getElementById("uicm-highlight-layer");

    if (this.mode === "comment") {
      // Show layers
      if (interactionLayer) {
        interactionLayer.style.display = "block";

        // Update visibility of individual bubbles based on status
        this.commentBubbles.forEach((bubble, commentId) => {
          const comment = this.comments.find((c) => c.id === commentId);
          if (comment && comment.status === CommentStatus.ARCHIVED) {
            bubble.getElement().style.display = "none";
          } else {
            bubble.getElement().style.display = "flex";
          }
        });
      }
      if (highlightLayer) {
        highlightLayer.style.display = "block";
      }

      // Force position update with slight delay
      setTimeout(() => {
        this.forceUpdateBubblePositions();
      }, 50);
    } else {
      // Hide layers completely in normal mode
      if (interactionLayer) {
        interactionLayer.style.display = "none";
      }
      if (highlightLayer) {
        highlightLayer.style.display = "none";
      }
    }
  }

  public setMode(mode: CommentMode): void {
    this.mode = mode;
    this.updateLayerVisibility();

    // Force update bubble positions when switching to comment mode
    if (mode === "comment" && this.commentBubbles.size > 0) {
      console.log("🔄 Switching to comment mode, updating bubble positions");

      // Update positions immediately (synchronous)
      this.forceUpdateBubblePositions();

      // Also update after a short delay to ensure proper positioning
      setTimeout(() => {
        this.forceUpdateBubblePositions();
      }, 100);
    }
  }

  public getMode(): CommentMode {
    return this.mode;
  }

  public getComments(): Comment[] {
    return [...this.comments];
  }

  public getCommentsForElement(element: Element): Comment[] {
    const xpath = getElementXPath(element);
    return this.comments.filter((comment) => comment.xpath === xpath);
  }

  public getCommentBubble(commentId: string): any | null {
    return this.commentBubbles.get(commentId) || null;
  }

  public updateCurrentUser(user: User): void {
    this.config.currentUser = user;
    console.log("🔄 CommentManager: Current user updated:", user);

    // Refresh all comment bubbles to show updated user names
    this.refreshAllCommentBubbles();
  }

  private refreshAllCommentBubbles(): void {
    // Update all existing bubbles to reflect user name changes
    this.commentBubbles.forEach((bubble, commentId) => {
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        bubble.updateComment(comment);
        bubble.updateUser(this.config.currentUser);
      }
    });
  }

  public highlightElement(element: Element): void {
    // Remove existing highlights
    const existingHighlights = this.root.querySelectorAll(
      ".uicm-element-highlight"
    );
    existingHighlights.forEach((highlight) => highlight.remove());

    // Create new highlight
    const highlight = document.createElement("div");
    highlight.className = "uicm-element-highlight";
    highlight.setAttribute("data-uicm-element", "true");

    const rect = element.getBoundingClientRect();
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    this.root.appendChild(highlight);

    // Auto-remove highlight after 3 seconds
    setTimeout(() => {
      if (highlight.parentNode) {
        highlight.remove();
      }
    }, 3000);
  }

  public testBubbleClicks(): void {
    console.log("🧪 TESTING ALL BUBBLE CLICKS");
    console.log("Mode:", this.mode);
    console.log("Bubble count:", this.commentBubbles.size);

    const interactionLayer = document.getElementById("uicm-interaction-layer");
    console.log("Interaction layer:", {
      found: !!interactionLayer,
      display: interactionLayer?.style.display,
      computedDisplay: interactionLayer
        ? getComputedStyle(interactionLayer).display
        : null,
      children: interactionLayer?.children.length,
    });

    this.commentBubbles.forEach((bubble, commentId) => {
      console.log(`🔍 Testing bubble ${commentId}:`);
      bubble.testClickability();
    });
  }

  public destroy(): void {
    // Clean up active components and overlay
    this.closeActiveComponents();

    // Remove event listeners
    window.removeEventListener("scroll", this.rafUpdatePositions);
    window.removeEventListener("resize", this.throttledUpdatePositions);
    document.removeEventListener("click", this.handleElementClick);
    document.removeEventListener(
      "mouseenter",
      this.handleElementMouseEnter,
      true
    );
    document.removeEventListener(
      "mouseleave",
      this.handleElementMouseLeave,
      true
    );
    if (this.escKeyHandler) {
      document.removeEventListener("keydown", this.escKeyHandler);
    }

    // Clean up performance optimizations
    this.visibilityObserver.disconnect();
    this.positionCache.clear();

    // Clean up mobile support
    if (this.touchGestureRecognizer) {
      this.touchGestureRecognizer.destroy();
    }
    if (this.isMobile) {
      removeMobileCSS();
    }

    // Clean up all bubbles
    this.commentBubbles.forEach((bubble) => bubble.destroy());
    this.commentBubbles.clear();

    console.log("CommentManager destroyed");
  }
}
