import { DebugIcon } from "../components/DebugIcon";
import { SettingsButton } from "../components/SettingsButton";
import { SidebarButton } from "../components/SidebarButton";
import { CommentSidebar } from "../components/CommentSidebar";
import {
  CommentMode,
  CommentSDKConfig,
  EventCallback,
  SDKEvents,
  User,
  Comment,
  CommentStatus,
} from "../types";
import { ensureSDKRoot, removeGlobalStyles, removeSDKRoot } from "../utils/dom";
import { CommentManager } from "./CommentManager";
import { userProfileStorage } from "../utils/userProfileStorage";

export class CommentSDK {
  private config: CommentSDKConfig;
  private commentManager!: CommentManager;
  private debugIcon!: DebugIcon;
  private settingsButton!: SettingsButton;
  private sidebarButton!: SidebarButton;
  private sidebar: CommentSidebar | null = null;
  private root!: HTMLElement;
  private isInitialized: boolean = false;
  private isNavigatingFromSidebar: boolean = false;
  private eventListeners: Map<keyof SDKEvents, Set<EventCallback<any>>> =
    new Map();

  constructor(config: CommentSDKConfig) {
    // Try to load user profile from localStorage first
    const savedUser = userProfileStorage.loadUserProfile();

    this.config = {
      theme: "light",
      autoInject: true,
      debugMode: false,
      ...config,
      // Use saved user profile if available, otherwise use provided config
      currentUser: savedUser || config.currentUser,
    };

    this.validateConfig();

    // Save initial user profile to localStorage if not exists
    if (!savedUser) {
      userProfileStorage.saveUserProfile(this.config.currentUser);
      console.log("💾 Initial user profile saved to localStorage");
    }
  }

  private validateConfig(): void {
    if (!this.config.projectId) {
      throw new Error("CommentSDK: projectId is required");
    }
    if (!this.config.currentUser) {
      throw new Error("CommentSDK: currentUser is required");
    }
    if (!this.config.onLoadComments) {
      throw new Error("CommentSDK: onLoadComments callback is required");
    }
    if (!this.config.onSaveComment) {
      throw new Error("CommentSDK: onSaveComment callback is required");
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.warn("CommentSDK: Already initialized");
      return;
    }

    try {
      // Setup DOM structure (KHÔNG phụ thuộc bất kỳ phần tử ngoài nào)
      this.setupDOM();

      // Initialize comment manager (render toàn bộ UI vào root)
      this.commentManager = new CommentManager(this.config, this.root);

      // Initialize debug icon
      this.debugIcon = new DebugIcon({
        isActive: false,
        onClick: () => this.toggleMode(),
        theme: this.config.theme!,
      });

      // Initialize settings button (hidden by default)
      this.settingsButton = new SettingsButton({
        currentUser: this.config.currentUser,
        onUserUpdate: async (updatedUser: User) => {
          this.config.currentUser = updatedUser;
          // Update user in comment manager
          this.commentManager.updateCurrentUser(updatedUser);
          // Save to localStorage
          userProfileStorage.saveUserProfile(updatedUser);
          console.log(
            "✅ User profile updated in SDK and localStorage:",
            updatedUser
          );
        },
        isVisible: false, // Hidden by default
      });

      // Initialize sidebar button (hidden by default)
      this.sidebarButton = new SidebarButton({
        currentUser: this.config.currentUser,
        onClick: () => this.openSidebar(),
        isVisible: false, // Hidden by default - chỉ hiện khi ở comment mode
      });

      // Add debug icon to root
      this.root.appendChild(this.debugIcon.getElement());

      // Add settings button to body (fixed position)
      document.body.appendChild(this.settingsButton.getElement());

      // Add sidebar button to body (fixed position)
      document.body.appendChild(this.sidebarButton.getElement());

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Load existing comments
      await this.commentManager.loadComments();

      // Check if there's a comment to highlight after navigation
      this.checkForHighlightComment();

      this.isInitialized = true;

      console.log("CommentSDK: Initialized successfully");
    } catch (error) {
      console.error("CommentSDK: Failed to initialize", error);
      throw error;
    }
  }

  private setupDOM(): void {
    // Create root container (SDK tự động tạo nếu chưa có)
    this.root = ensureSDKRoot();

    // Apply theme class to root
    this.root.className = `uicm-theme-${this.config.theme}`;
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", this.handleKeyboardShortcut);
  }

  private handleKeyboardShortcut = (e: KeyboardEvent): void => {
    // Toggle comment mode with Alt+E
    if (e.key === "e" && e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.toggleMode();
    }
  };

  private toggleMode(): void {
    const currentMode = this.commentManager.getMode();
    const newMode: CommentMode =
      currentMode === "normal" ? "comment" : "normal";

    this.setMode(newMode);
  }

  public setMode(mode: CommentMode): void {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    const previousMode = this.commentManager.getMode();

    this.commentManager.setMode(mode);
    this.debugIcon.updateState(mode === "comment");

    // Update settings button visibility based on mode
    if (this.settingsButton) {
      this.settingsButton.setVisible(mode === "comment");
    }

    // Update sidebar button visibility based on mode
    if (this.sidebarButton) {
      this.sidebarButton.setVisible(mode === "comment");
    }

    // Update cursor style for the entire page
    if (mode === "comment") {
      document.body.style.cursor = "crosshair";
    } else {
      document.body.style.cursor = "";
    }

    // Emit mode change event
    this.emit("mode-changed", { mode });

    console.log(`CommentSDK: Mode changed from ${previousMode} to ${mode}`);
  }

  public getMode(): CommentMode {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }
    return this.commentManager.getMode();
  }

  public async reload(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    try {
      await this.commentManager.loadComments();
      console.log("CommentSDK: Comments reloaded successfully");
    } catch (error) {
      console.error("CommentSDK: Failed to reload comments", error);
      throw error;
    }
  }

  public getComments() {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }
    return this.commentManager.getComments();
  }

  private openSidebar(): void {
    console.log("🔧 CommentSDK: openSidebar called");

    if (!this.isInitialized) {
      console.error("CommentSDK: Not initialized. Call init() first.");
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    // Close existing sidebar if open
    if (this.sidebar) {
      console.log("🔧 CommentSDK: Closing existing sidebar");
      this.sidebar.destroy();
      this.sidebar = null;
      return;
    }

    // Get all comments
    const allComments = this.commentManager.getComments();
    console.log("🔧 CommentSDK: Found comments:", allComments.length);

    // Create and show sidebar
    console.log("🔧 CommentSDK: Creating new sidebar");
    this.sidebar = new CommentSidebar({
      comments: allComments,
      currentUser: this.config.currentUser,
      onNavigateToComment: (comment: Comment) => {
        console.log("🔧 CommentSDK: Navigating to comment:", comment.id);
        this.navigateToComment(comment);
      },
      onClose: () => {
        console.log("🔧 CommentSDK: Sidebar closed");
        if (this.sidebar) {
          this.sidebar.destroy();
          this.sidebar = null;
        }
      },
      onStatusChange: async (commentId: string, status: CommentStatus) => {
        console.log("🔧 CommentSDK: Status change:", commentId, status);
        // Find comment and update status
        const comment = allComments.find((c) => c.id === commentId);
        if (comment) {
          comment.status = status;
          // Update in comment manager
          const bubble = this.commentManager.getCommentBubble(commentId);
          if (bubble) {
            bubble.updateComment(comment);
          }
        }
      },
    });

    console.log("🔧 CommentSDK: Showing sidebar");
    this.sidebar.show();
  }

  private navigateToComment(comment: Comment): void {
    console.log(
      "🔧 CommentSDK: navigateToComment called for comment:",
      comment.id
    );

    // Set flag to prevent form comment from opening
    this.isNavigatingFromSidebar = true;
    (window as any).uicmIsNavigatingFromSidebar = true;

    // Close sidebar first
    if (this.sidebar) {
      console.log("🔧 CommentSDK: Closing sidebar before navigation");
      this.sidebar.destroy();
      this.sidebar = null;
    }

    // Check if we're on the same page
    const currentUrl = window.location.href;
    const commentUrl = comment.url;

    if (currentUrl !== commentUrl) {
      console.log("🔧 CommentSDK: Navigating to different page:", commentUrl);
      // Navigate to the comment's page
      window.location.href = commentUrl;

      // Store comment to highlight after navigation
      sessionStorage.setItem("uicm-highlight-comment", comment.id);
    } else {
      console.log("🔧 CommentSDK: Same page, highlighting comment");
      // We're on the same page, just highlight the comment
      this.highlightCommentOnPage(comment);
    }

    // Reset flag after a delay
    setTimeout(() => {
      this.isNavigatingFromSidebar = false;
      (window as any).uicmIsNavigatingFromSidebar = false;
      console.log("🔧 CommentSDK: Navigation flag reset");
    }, 2000);
  }

  private highlightCommentOnPage(comment: Comment): void {
    console.log(
      "🔧 CommentSDK: highlightCommentOnPage called for comment:",
      comment.id
    );

    // Switch to comment mode
    this.setMode("comment");

    // Find the element by XPath
    const element = this.findElementByXPath(comment.xpath);
    if (element) {
      console.log(
        "🔧 CommentSDK: Element found, highlighting and scrolling to it"
      );

      // Scroll to element smoothly
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Highlight the element
      this.commentManager.highlightElement(element);

      // Wait a bit for scroll to complete, then show modal
      setTimeout(() => {
        // Show the comment modal
        const bubble = this.commentManager.getCommentBubble(comment.id);
        if (bubble) {
          console.log("🔧 CommentSDK: Found bubble, clicking to show modal");
          // Trigger click on bubble to show modal
          bubble.getElement().click();
        } else {
          console.warn(
            "🔧 CommentSDK: Bubble not found for comment:",
            comment.id
          );
          // Try to find and click the element directly
          (element as HTMLElement).click();
        }
      }, 800); // Wait for scroll animation
    } else {
      console.warn(
        "🔧 CommentSDK: Element not found for comment:",
        comment.xpath
      );
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
    } catch (error) {
      console.error("Error finding element by XPath:", error);
      return null;
    }
  }

  private checkForHighlightComment(): void {
    const commentId = sessionStorage.getItem("uicm-highlight-comment");
    if (commentId) {
      // Clear the session storage
      sessionStorage.removeItem("uicm-highlight-comment");

      // Find the comment
      const comment = this.commentManager
        .getComments()
        .find((c) => c.id === commentId);
      if (comment) {
        // Wait a bit for the page to fully load, then highlight
        setTimeout(() => {
          this.highlightCommentOnPage(comment);
        }, 500);
      }
    }
  }

  public getCommentsForElement(element: Element) {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }
    return this.commentManager.getCommentsForElement(element);
  }

  public highlightElement(element: Element): void {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }
    this.commentManager.highlightElement(element);
  }

  public setTheme(theme: "light" | "dark"): void {
    this.config.theme = theme;

    if (this.isInitialized) {
      this.root.className = `uicm-theme-${theme}`;
      this.debugIcon.updateTheme(theme);
    }
  }

  public getTheme(): "light" | "dark" {
    return this.config.theme!;
  }

  // Event system
  public on<T extends keyof SDKEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off<T extends keyof SDKEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit<T extends keyof SDKEvents>(event: T, data: SDKEvents[T]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `CommentSDK: Error in event listener for ${event}:`,
            error
          );
        }
      });
    }
  }

  public destroy(): void {
    if (!this.isInitialized) {
      console.warn("CommentSDK: Not initialized, nothing to destroy");
      return;
    }

    try {
      // Reset cursor
      document.body.style.cursor = "";

      // Clean up comment manager
      if (this.commentManager) {
        this.commentManager.destroy();
      }

      // Clean up debug icon
      if (this.debugIcon) {
        this.debugIcon.destroy();
      }

      // Clean up settings button
      if (this.settingsButton) {
        this.settingsButton.destroy();
      }

      // Clean up sidebar button
      if (this.sidebarButton) {
        this.sidebarButton.destroy();
      }

      // Clean up sidebar
      if (this.sidebar) {
        this.sidebar.destroy();
      }

      // Remove keyboard shortcuts
      document.removeEventListener("keydown", this.handleKeyboardShortcut);

      // Remove DOM elements
      removeSDKRoot();
      removeGlobalStyles();

      // Clear event listeners
      this.eventListeners.clear();

      this.isInitialized = false;

      console.log("CommentSDK: Destroyed successfully");
    } catch (error) {
      console.error("CommentSDK: Error during destruction", error);
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getVersion(): string {
    return "1.0.0";
  }

  public getConfig(): Readonly<CommentSDKConfig> {
    return { ...this.config };
  }

  public testBubbleClicks(): void {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }

    console.log("🧪 CommentSDK: Testing bubble clicks...");
    this.commentManager.testBubbleClicks();
  }

  public testSidebar(): void {
    if (!this.isInitialized) {
      throw new Error("CommentSDK: Not initialized. Call init() first.");
    }
    console.log("🧪 Testing sidebar...");
    this.openSidebar();
  }
}

// Global initialization function
// Chỉ cần nhúng script và gọi initCommentSDK, không cần tạo div hay gọi hàm prompt nào khác. SDK sẽ tự động inject toàn bộ UI.
export function initCommentSDK(config: CommentSDKConfig): CommentSDK {
  const sdk = new CommentSDK(config);

  // Auto-initialize if autoInject is true (default)
  if (config.autoInject !== false) {
    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        sdk.init().catch((error) => {
          console.error("CommentSDK: Auto-initialization failed", error);
        });
      });
    } else {
      // DOM is already ready
      sdk.init().catch((error) => {
        console.error("CommentSDK: Auto-initialization failed", error);
      });
    }
  }

  return sdk;
}
