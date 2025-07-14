import { CommentSidebar } from "../components/CommentSidebar";
import { CommentModal } from "../components/CommentModal";
import { DebugIcon } from "../components/DebugIcon";
import { SettingsButton } from "../components/SettingsButton";
import { SidebarButton } from "../components/SidebarButton";
import {
  Comment,
  CommentManagerConfig,
  CommentSDKConfig,
  User,
  CommentStatus,
  CommentAttachment,
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
  private sidebar: CommentSidebar | null = null;
  private commentModal: CommentModal | null = null; // Add modal reference
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
          console.log(
            "🔄 onLoadComments called - returning SDK comments:",
            this.comments.length
          );
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
          console.log("onSaveComment - SDK comments before push:", {
            count: this.comments.length,
            comments: this.comments.map((c) => ({
              id: c.id,
              content: c.content.substring(0, 30),
            })),
          });
          this.comments.push(newComment);
          console.log(
            "onSaveComment - SDK comments after push:",
            this.comments.length
          );

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
      console.log("🔄 Syncing comments from manager:", {
        managerCommentsCount: managerComments.length,
        sdkCommentsCount: this.comments.length,
        managerComments: managerComments.map((c) => ({
          id: c.id,
          content: c.content.substring(0, 30),
        })),
      });
      this.comments = [...managerComments];
      console.log("✅ Synced comments from manager:", this.comments.length);
    } else {
      console.warn("⚠️ CommentManager not available for sync");
    }
  }

  // Load comments from API directly into SDK
  private async loadCommentsFromAPI(): Promise<void> {
    try {
      console.log("🔄 Loading comments from API into SDK...");
      const data = await this.config.onFetchJsonFile();
      const allComments = data?.comments || [];
      const currentUrl = window.location.href;

      // Filter comments to only show those from the current URL
      this.comments = allComments.filter(
        (comment) => comment.url === currentUrl
      );

      console.log("📂 Loaded comments into SDK:", {
        totalFromAPI: allComments.length,
        filteredForCurrentURL: this.comments.length,
        currentURL: currentUrl,
        sdkComments: this.comments.map((c) => ({
          id: c.id,
          content: c.content.substring(0, 30) + "...",
        })),
      });
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

    // Add to DOM
    document.body.appendChild(this.debugIcon.getElement());
    document.body.appendChild(this.settingsButton.getElement());
    document.body.appendChild(this.sidebarButton.getElement());
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

    // Show sidebar and settings icons for keyboard shortcut too
    this.settingsButton.setVisible(newMode === "comment");
    this.sidebarButton.setVisible(newMode === "comment");

    if (newMode === "comment") {
      document.body.style.cursor = "crosshair";
    } else {
      document.body.style.cursor = "";
    }
  }

  public async setMode(mode: "normal" | "comment"): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    await this.commentManager.setMode(mode);
    this.debugIcon.updateState(mode === "comment");
    this.settingsButton.setVisible(mode === "comment");
    this.sidebarButton.setVisible(mode === "comment");

    if (mode === "comment") {
      document.body.style.cursor = "crosshair";
    } else {
      document.body.style.cursor = "";
    }
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
    console.log("🔧 SDK: Navigating to comment:", {
      id: comment.id,
      url: comment.url,
      currentUrl: window.location.href,
    });

    // Check if comment is from a different URL
    if (comment.url !== window.location.href) {
      console.log("🔄 Comment is from different URL, navigating...");
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
      console.warn("⚠️ Could not find element for comment:", comment.id);
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
      console.log("🔧 SDK: Found comment ID in hash:", commentId);

      // Find the comment
      const comment = this.comments.find((c) => c.id === commentId);
      if (comment) {
        console.log("🔧 SDK: Found comment, opening modal...");
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
