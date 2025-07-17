import { CommentModal } from "../components/CommentModal";
import { CommentSidebar } from "../components/CommentSidebar";
import { CommentsTable } from "../components/CommentsTable";
import { CommentsTableButton } from "../components/CommentsTableButton";
import { DebugIcon } from "../components/DebugIcon";
import { SettingsButton } from "../components/SettingsButton";
import { SidebarButton } from "../components/SidebarButton";
import {
  Comment,
  CommentManagerConfig,
  CommentSDKConfig,
  CommentStatus,
  User,
} from "../types";
import { ensureSDKRoot } from "../utils/dom";
import { userProfileStorage } from "../utils/userProfileStorage";
import { CommentManager } from "./CommentManager";

export class CommentSDK {
  private config: CommentSDKConfig;
  private commentManager!: CommentManager;
  private debugIcon!: DebugIcon;
  private settingsButton!: SettingsButton;
  private sidebarButton!: SidebarButton;
  private commentsTableButton!: CommentsTableButton;
  private sidebar: CommentSidebar | null = null;
  private commentModal: CommentModal | null = null; // Add modal reference
  private commentsTable: CommentsTable | null = null;
  private root!: HTMLElement;
  private isInitialized: boolean = false;
  private comments: Comment[] = [];
  private currentUser: User;

  constructor(config: CommentSDKConfig) {
    this.config = {
      theme: "light",
      ...config,
    };

    // Load or create default user
    const savedUser = userProfileStorage.loadUserProfile();
    this.currentUser = savedUser || {
      id: "default-user",
      name: "Anonymous User",
      role: "other",
    };

    if (!savedUser) {
      userProfileStorage.saveUserProfile(this.currentUser);
    }

    this.validateConfig();
  }

  private createCustomCursor(): string {
    // SVG chỉ có icon 💬, không background
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <text x="20" y="28" font-size="24" text-anchor="middle" fill="#00bcd4" font-family="Arial" font-weight="bold">💬</text>
      </svg>
    `;
    // Encode SVG cho data URL
    const encodedSvg = encodeURIComponent(svg);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    return `url('${dataUrl}') 20 20, auto`;
  }

  private setCustomCursor(enable: boolean): void {
    const cursor = enable ? this.createCustomCursor() : "";
    document.body.style.cursor = cursor;
    // Apply to all SDK layers that may override cursor
    const layers = [
      ".uicm-overlay",
      ".uicm-comment-modal",
      ".uicm-comment-form",
      ".uicm-comment-bubble",
      "#uicm-root",
      "#uicm-highlight-layer",
      "#uicm-interaction-layer",
    ];
    layers.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.cursor = cursor;
        }
      });
    });
  }

  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error("CommentSDK: projectId is required");
    }
    if (!this.config.onFetchJsonFile) {
      throw new Error("CommentSDK: onFetchJsonFile function is required");
    }
    if (!this.config.onUpdate) {
      throw new Error("CommentSDK: onUpdate callback is required");
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Setup DOM
      this.setupDOM();

      // Create comment manager config
      const managerConfig: CommentManagerConfig = {
        projectId: this.config.projectId,
        currentUser: this.currentUser,
        theme: this.config.theme,
        onLoadComments: async () => {
          // Return SDK comments and sync to CommentManager
          return this.comments;
        },
        onSaveComment: async (
          commentData: Omit<Comment, "id" | "createdAt">
        ) => {
          const newComment: Comment = {
            ...commentData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
          };
          this.comments.push(newComment);

          await this.config.onUpdate(this.comments);
          return newComment;
        },
        onUpdateComment: async (updatedComment: Comment) => {
          // Update local array
          const index = this.comments.findIndex(
            (c) => c.id === updatedComment.id
          );
          if (index !== -1) {
            this.comments[index] = updatedComment;
            // Always use onUpdate to send complete JSON
            await this.config.onUpdate(this.comments);
          }
          return updatedComment;
        },
        onDeleteComment: async (commentId: string) => {
          this.comments = this.comments.filter((c) => c.id !== commentId);
          await this.config.onUpdate(this.comments);
        },
        onFetchJsonFile: this.config.onFetchJsonFile,
        onToggleModeSilent: async () => {
          await this.toggleModeSilent();
        },
      };

      // Initialize comment manager
      this.commentManager = new CommentManager(managerConfig, this.root);

      // Initialize UI components
      this.initializeUI();

      // Load comments from API directly into SDK
      await this.loadCommentsFromAPI();

      // Check if we're navigating from sidebar and need to open a comment
      this.handleSidebarNavigation();

      this.isInitialized = true;
    } catch (error) {
      console.error("CommentSDK: Failed to initialize", error);
      throw error;
    }
  }

  // Method to sync comments from CommentManager
  public syncCommentsFromManager(): void {
    if (this.commentManager) {
      const managerComments = this.commentManager.getComments();
      this.comments = [...managerComments];
    } else {
      console.warn("⚠️ CommentManager not available for sync");
    }
  }

  // Load comments from API directly into SDK
  private async loadCommentsFromAPI(): Promise<void> {
    try {
      const data = await this.config.onFetchJsonFile();
      const allComments = data?.comments || [];
      const currentUrl = window.location.href;

      // Filter comments to only show those from the current URL
      this.comments = allComments.filter(
        (comment) => comment.url === currentUrl
      );

      // Update comments count in table button
      if (this.commentsTableButton) {
        this.commentsTableButton.updateCommentsCount(this.comments.length);
      }
    } catch (error) {
      console.error("Failed to load comments from API into SDK:", error);
    }
  }

  private setupDOM(): void {
    this.root = ensureSDKRoot();
    this.root.className = `uicm-theme-${this.config.theme}`;
  }

  private initializeUI(): void {
    // Debug icon
    this.debugIcon = new DebugIcon({
      isActive: false,
      onClick: () => this.toggleMode(),
      theme: this.config.theme!,
    });

    // Settings button
    this.settingsButton = new SettingsButton({
      currentUser: this.currentUser,
      onUserUpdate: async (updatedUser: User) => {
        this.currentUser = updatedUser;
        this.commentManager.updateCurrentUser(updatedUser);
        userProfileStorage.saveUserProfile(updatedUser);

        // Update sidebar button with new user info
        this.sidebarButton.updateUser(updatedUser);

        // Refresh sidebar if it's open
        if (this.sidebar) {
          this.sidebar.updateComments(this.comments);
        }
      },
      isVisible: false,
    });

    // Sidebar button
    this.sidebarButton = new SidebarButton({
      currentUser: this.currentUser,
      onClick: () => this.openSidebar(),
      isVisible: false,
    });

    // Comments table button
    this.commentsTableButton = new CommentsTableButton({
      onClick: () => this.toggleCommentsTable(),
      theme: this.config.theme!,
      commentsCount: this.comments.length,
      isVisible: false,
    });

    // Add to DOM
    document.body.appendChild(this.debugIcon.getElement());
    document.body.appendChild(this.settingsButton.getElement());
    document.body.appendChild(this.sidebarButton.getElement());
    document.body.appendChild(this.commentsTableButton.getElement());
  }

  private async toggleMode(): Promise<void> {
    const currentMode = this.commentManager.getMode();
    const newMode = currentMode === "normal" ? "comment" : "normal";
    await this.setMode(newMode);
  }

  // New method for keyboard shortcut - toggle mode without showing sidebar/settings icons
  private async toggleModeSilent(): Promise<void> {
    const currentMode = this.commentManager.getMode();
    const newMode = currentMode === "normal" ? "comment" : "normal";

    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    await this.commentManager.setMode(newMode);
    this.debugIcon.updateState(newMode === "comment");
    this.settingsButton.setVisible(newMode === "comment");
    this.sidebarButton.setVisible(newMode === "comment");
    this.commentsTableButton.setVisible(newMode === "comment");

    // Apply custom cursor
    this.setCustomCursor(newMode === "comment");
  }

  public async setMode(mode: "normal" | "comment"): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    await this.commentManager.setMode(mode);
    this.debugIcon.updateState(mode === "comment");
    this.settingsButton.setVisible(mode === "comment");
    this.sidebarButton.setVisible(mode === "comment");
    this.commentsTableButton.setVisible(mode === "comment");

    // Apply custom cursor
    this.setCustomCursor(mode === "comment");
  }

  private openSidebar(): void {
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
      return;
    }

    this.sidebar = new CommentSidebar({
      comments: this.comments,
      currentUser: this.currentUser,
      onNavigateToComment: (comment) => this.navigateToComment(comment),
      onClose: () => {
        if (this.sidebar) {
          this.sidebar.destroy();
          this.sidebar = null;
        }
      },
      onStatusChange: async (commentId, status) => {
        const comment = this.comments.find((c) => c.id === commentId);
        if (comment) {
          comment.status = status;
          await this.config.onUpdate(this.comments);
        }
      },
    });

    document.body.appendChild(this.sidebar.getElement());
    this.sidebar.show();
  }

  private navigateToComment(comment: Comment): void {
    // Check if comment is from a different URL
    if (comment.url !== window.location.href) {
      // Set a flag to indicate we're navigating from sidebar
      (window as any).uicmIsNavigatingFromSidebar = true;

      // Navigate to the comment's URL with hash for comment ID
      const targetUrl = comment.url.includes("#")
        ? `${comment.url}#comment-${comment.id}`
        : `${comment.url}#comment-${comment.id}`;

      window.location.href = targetUrl;
      return;
    }

    // Comment is from current page, find element and open modal
    const element = this.findElementByXPath(comment.xpath);
    if (element) {
      // Scroll to element
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight element temporarily
      (element as HTMLElement).style.outline = "2px solid #3b82f6";
      (element as HTMLElement).style.outlineOffset = "2px";
      setTimeout(() => {
        (element as HTMLElement).style.outline = "";
        (element as HTMLElement).style.outlineOffset = "";
      }, 3000);

      // Open comment modal
      this.openCommentModal(comment, element);
    } else {
      // Still try to open modal even if element not found
      this.openCommentModal(comment, null);
    }
  }

  private openCommentModal(comment: Comment, element: Element | null): void {
    // Close sidebar first
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
    }

    // Create and show comment modal
    this.commentModal = new CommentModal({
      comments: [comment],
      currentUser: this.currentUser,
      position: element ? this.getElementPosition(element) : { x: 0, y: 0 },
      onClose: () => {
        if (this.commentModal) {
          this.commentModal.destroy();
          this.commentModal = null;
        }
      },
      onAddReply: async (commentId, content, user, attachments) => {
        // Add reply to comment
        const targetComment = this.comments.find((c) => c.id === commentId);
        if (targetComment) {
          const newReply: Comment = {
            id: this.generateId(),
            content,
            xpath: targetComment.xpath,
            url: targetComment.url,
            position: targetComment.position,
            relativePosition: targetComment.relativePosition,
            createdAt: new Date().toISOString(),
            createdBy: user || this.currentUser,
            role: user?.role || this.currentUser.role || "other",
            replies: [],
            status: CommentStatus.BUG,
            attachments,
          };

          targetComment.replies.push(newReply);
          await this.config.onUpdate(this.comments);
        }
      },
      onStatusChange: async (commentId, status) => {
        const targetComment = this.comments.find((c) => c.id === commentId);
        if (targetComment) {
          targetComment.status = status;
          await this.config.onUpdate(this.comments);
        }
      },
    });

    document.body.appendChild(this.commentModal.getElement());
  }

  private getElementPosition(element: Element): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  private findElementByXPath(xpath: string): Element | null {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue as Element;
    } catch {
      return null;
    }
  }

  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private toggleCommentsTable(): void {
    console.log("🔄 Toggling CommentsTable...");

    // If modal is already open, close it
    if (this.commentsTable) {
      console.log("📋 CommentsTable is open, closing...");
      this.commentsTable.destroy();
      this.commentsTable = null;

      // Restore SDK cursor if in comment mode
      if (this.commentManager.getMode() === "comment") {
        this.setCustomCursor(true);
        console.log("🖱️ Custom cursor restored");
      }
      return;
    }

    // Otherwise open the modal
    this.openCommentsTable();
  }

  private openCommentsTable(): void {
    console.log("🔄 Opening CommentsTable...");
    console.log("📊 Total comments available:", this.comments.length);

    // Close sidebar and comment modal if open
    if (this.sidebar) {
      this.sidebar.destroy();
      this.sidebar = null;
    }
    if (this.commentModal) {
      this.commentModal.destroy();
      this.commentModal = null;
    }

    // Create and show comments table
    this.commentsTable = new CommentsTable({
      comments: this.comments,
      currentUser: this.currentUser,
      onClose: () => {
        console.log("🔄 CommentsTable onClose callback triggered");

        // Always remove modal from DOM if exists
        if (this.commentsTable) {
          const modalEl = this.commentsTable.getElement();
          if (modalEl.parentNode) {
            modalEl.parentNode.removeChild(modalEl);
            console.log("✅ Modal removed from DOM by SDK");
          }
        }

        // Restore SDK cursor if in comment mode
        if (this.commentManager.getMode() === "comment") {
          this.setCustomCursor(true);
          console.log("🖱️ Custom cursor restored");
        }

        // Always set commentsTable = null
        this.commentsTable = null;
        console.log("✅ CommentsTable reference cleared");
      },
      onDeleteComments: async (commentIds: string[]) => {
        // Remove comments from array
        this.comments = this.comments.filter(
          (comment) => !commentIds.includes(comment.id)
        );

        // Update via API
        await this.config.onUpdate(this.comments);

        // Update comments count in button
        this.commentsTableButton.updateCommentsCount(this.comments.length);

        // Update comment manager
        if (this.commentManager) {
          await this.commentManager.loadComments();
        }
      },
      onUpdateComment: async (updatedComment: Comment) => {
        // Update local array
        const index = this.comments.findIndex(
          (c) => c.id === updatedComment.id
        );
        if (index !== -1) {
          this.comments[index] = updatedComment;
          await this.config.onUpdate(this.comments);

          // Update comment manager
          if (this.commentManager) {
            await this.commentManager.loadComments();
          }
        }
      },
    });

    document.body.appendChild(this.commentsTable.getElement());
    // Set cursor: auto for modal and all children
    const modal = this.commentsTable.getElement();
    modal.style.cursor = "auto";
    modal.querySelectorAll("*").forEach((el) => {
      (el as HTMLElement).style.cursor = "auto";
    });
    // Also set body cursor to auto while modal is open
    document.body.style.cursor = "auto";
  }

  public destroy(): void {
    if (this.sidebar) {
      this.sidebar.destroy();
    }
    if (this.commentManager) {
      this.commentManager.destroy();
    }
    if (this.commentModal) {
      this.commentModal.destroy();
      this.commentModal = null;
    }
    if (this.commentsTable) {
      this.commentsTable.destroy();
      this.commentsTable = null;
    }
    this.isInitialized = false;
  }

  public getComments(): Comment[] {
    return this.comments;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  private handleSidebarNavigation(): void {
    // Check if we have a comment ID in URL hash from sidebar navigation
    const hash = window.location.hash;
    if (hash && hash.startsWith("#comment-")) {
      const commentId = hash.substring(9); // Remove '#comment-' prefix

      // Find the comment
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        // Clear the hash
        window.location.hash = "";

        // Open comment modal after a short delay to ensure page is loaded
        setTimeout(() => {
          this.openCommentModal(comment, null);
        }, 500);
      }
    }
  }
}

export function initCommentSDK(config: CommentSDKConfig): CommentSDK {
  return new CommentSDK(config);
}
