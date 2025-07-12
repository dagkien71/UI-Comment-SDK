import { CommentSidebar } from "../components/CommentSidebar";
import { DebugIcon } from "../components/DebugIcon";
import { SettingsButton } from "../components/SettingsButton";
import { SidebarButton } from "../components/SidebarButton";
import {
  Comment,
  CommentManagerConfig,
  CommentSDKConfig,
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
  private sidebar: CommentSidebar | null = null;
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
      throw new Error("EasyCommentSDK: projectId is required");
    }
    if (!this.config.onFetchJsonFile) {
      throw new Error("EasyCommentSDK: onFetchJsonFile function is required");
    }
    if (!this.config.onUpdate) {
      throw new Error("EasyCommentSDK: onUpdate callback is required");
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn("EasyCommentSDK: Already initialized");
      return;
    }

    try {
      // Setup DOM
      this.setupDOM();

      // Load comments from user's fetch function
      await this.loadCommentsFromUserFunction();

      // Create comment manager config
      const managerConfig: CommentManagerConfig = {
        projectId: this.config.projectId,
        currentUser: this.currentUser,
        theme: this.config.theme,
        onLoadComments: async () => this.comments,
        onSaveComment: async (
          commentData: Omit<Comment, "id" | "createdAt">
        ) => {
          const newComment: Comment = {
            ...commentData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
          };
          this.comments.push(newComment);
          await this.saveCommentsToJsonFile();
          return newComment;
        },
        onUpdateComment: async (updatedComment: Comment) => {
          const index = this.comments.findIndex(
            (c) => c.id === updatedComment.id
          );
          if (index !== -1) {
            this.comments[index] = updatedComment;
            await this.saveCommentsToJsonFile();
          }
          return updatedComment;
        },
        onDeleteComment: async (commentId: string) => {
          this.comments = this.comments.filter((c) => c.id !== commentId);
          await this.saveCommentsToJsonFile();
        },
      };

      // Initialize comment manager
      this.commentManager = new CommentManager(managerConfig, this.root);

      // Initialize UI components
      this.initializeUI();

      // Load comments
      await this.commentManager.loadComments();

      this.isInitialized = true;
      console.log("EasyCommentSDK: Initialized successfully");
    } catch (error) {
      console.error("EasyCommentSDK: Failed to initialize", error);
      throw error;
    }
  }

  private setupDOM(): void {
    this.root = ensureSDKRoot();
    this.root.className = `uicm-theme-${this.config.theme}`;
  }

  private async loadCommentsFromUserFunction(): Promise<void> {
    try {
      // Gọi function của user để fetch data
      const data = await this.config.onFetchJsonFile();
      this.comments = data.comments || [];
      console.log(
        `📂 Loaded ${this.comments.length} comments from user's fetch function`
      );
    } catch (error) {
      console.log(
        `📂 Could not load comments from user's fetch function, starting fresh`
      );
      this.comments = [];
    }
  }

  private async saveCommentsToJsonFile(): Promise<void> {
    try {
      const data = {
        projectId: this.config.projectId,
        comments: this.comments,
        lastUpdated: new Date().toISOString(),
      };

      await this.config.onUpdate(this.comments);
      console.log(`💾 Saved ${this.comments.length} comments to JSON file`);
    } catch (error) {
      console.error("Failed to save comments:", error);
    }
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

  private toggleMode(): void {
    const currentMode = this.commentManager.getMode();
    const newMode = currentMode === "normal" ? "comment" : "normal";
    this.setMode(newMode);
  }

  public setMode(mode: "normal" | "comment"): void {
    if (!this.isInitialized) {
      throw new Error("SimpleCommentSDK: Not initialized. Call init() first.");
    }

    this.commentManager.setMode(mode);
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
          await this.saveCommentsToJsonFile();
        }
      },
    });

    document.body.appendChild(this.sidebar.getElement());
    this.sidebar.show();
  }

  private navigateToComment(comment: Comment): void {
    // Find element by XPath and scroll to it
    const element = this.findElementByXPath(comment.xpath);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      (element as HTMLElement).style.outline = "2px solid #3b82f6";
      (element as HTMLElement).style.outlineOffset = "2px";
      setTimeout(() => {
        (element as HTMLElement).style.outline = "";
        (element as HTMLElement).style.outlineOffset = "";
      }, 3000);
    }
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
    this.isInitialized = false;
  }

  public getComments(): Comment[] {
    return this.comments;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }
}

export function initCommentSDK(config: CommentSDKConfig): CommentSDK {
  return new CommentSDK(config);
}
