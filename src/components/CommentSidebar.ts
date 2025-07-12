import { Comment, CommentStatus, User } from "../types";
import { getRoleColor, getRoleDisplayName } from "../utils/roleColors";
import "../styles/comment-sidebar.css";

export interface CommentSidebarProps {
  comments: Comment[];
  currentUser: User;
  onNavigateToComment: (comment: Comment) => void;
  onClose: () => void;
  onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
}

type SidebarTab = "active" | "archive";

export class CommentSidebar {
  private element: HTMLElement;
  private props: CommentSidebarProps;
  private isVisible: boolean = false;
  private currentTab: SidebarTab = "active";
  private currentStatusFilter: CommentStatus | "all" = "all";
  private isFilterOpen: boolean = false;
  private commentsList: HTMLElement | null = null;
  private statsContent: HTMLElement | null = null;
  private filterContainer: HTMLElement | null = null;
  private filterToggleBtn: HTMLElement | null = null;

  constructor(props: CommentSidebarProps) {
    console.log(
      "🔧 CommentSidebar: Constructor called with",
      props.comments.length,
      "comments"
    );
    this.props = props;
    this.element = this.createElement();
    console.log("🔧 CommentSidebar: Element created:", this.element);
    this.attachEventListeners();
  }

  private formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  private getStatusColor(status: CommentStatus): { bg: string; text: string } {
    switch (status) {
      case CommentStatus.BUG:
        return { bg: "#dc3545", text: "white" };
      case CommentStatus.FEATURE_REQUEST:
        return { bg: "#ffc107", text: "black" };
      case CommentStatus.DEV_COMPLETED:
        return { bg: "#3b82f6", text: "white" };
      case CommentStatus.DONE:
        return { bg: "#28a745", text: "white" };
      case CommentStatus.ARCHIVED:
        return { bg: "#6c757d", text: "white" };
      default:
        return { bg: "#007bff", text: "white" };
    }
  }

  private getPageName(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Extract page name from path
      if (path === "/" || path === "") return "Home";

      const segments = path.split("/").filter(Boolean);
      if (segments.length === 0) return "Home";

      // Convert path to readable name
      const pageName = segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return pageName || "Unknown Page";
    } catch {
      return "Unknown Page";
    }
  }

  private getFilteredComments(): Comment[] {
    let filteredComments: Comment[];

    if (this.currentTab === "active") {
      filteredComments = this.props.comments.filter(
        (c) => c.status !== "archived"
      );
    } else {
      filteredComments = this.props.comments.filter(
        (c) => c.status === "archived"
      );
    }

    // Apply status filter if not "all"
    if (this.currentStatusFilter !== "all") {
      filteredComments = filteredComments.filter(
        (c) => c.status === this.currentStatusFilter
      );
    }

    return filteredComments;
  }

  private switchTab(tab: SidebarTab): void {
    this.currentTab = tab;
    this.updateCommentsDisplay();
    this.updateStats();
    this.updateTabStates();
  }

  private switchStatusFilter(status: CommentStatus | "all"): void {
    this.currentStatusFilter = status;
    this.updateCommentsDisplay();
    this.updateStats();
    this.updateFilterStates();
  }

  private toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;

    if (this.filterContainer) {
      if (this.isFilterOpen) {
        this.filterContainer.classList.remove("uicm-sidebar-filters-closed");
        this.filterContainer.classList.add("uicm-sidebar-filters-open");
      } else {
        this.filterContainer.classList.remove("uicm-sidebar-filters-open");
        this.filterContainer.classList.add("uicm-sidebar-filters-closed");
      }
    }

    if (this.filterToggleBtn) {
      const arrow = this.filterToggleBtn.querySelector(
        ".uicm-filter-toggle-arrow"
      );
      if (arrow) {
        arrow.textContent = this.isFilterOpen ? "▲" : "▼";
      }
    }
  }

  private updateCommentsDisplay(): void {
    if (!this.commentsList) return;

    this.commentsList.innerHTML = "";
    const filteredComments = this.getFilteredComments();

    if (filteredComments.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "uicm-sidebar-empty";
      const emptyText =
        this.currentTab === "active"
          ? "No active comments yet"
          : "No archived comments";
      const emptySubtext =
        this.currentTab === "active"
          ? "Start commenting on any element to see them here"
          : "Archived comments will appear here";

      emptyState.innerHTML = `
        <div class="uicm-sidebar-empty-icon">��</div>
        <div class="uicm-sidebar-empty-title">${emptyText}</div>
        <div class="uicm-sidebar-empty-subtitle">${emptySubtext}</div>
      `;
      this.commentsList.appendChild(emptyState);
    } else {
      filteredComments.forEach((comment) => {
        const commentItem = this.createCommentItem(comment);
        this.commentsList!.appendChild(commentItem);
      });
    }
  }

  private updateStats(): void {
    if (!this.statsContent) return;

    const activeComments = this.props.comments.filter(
      (c) => c.status !== "archived"
    ).length;
    const archivedComments = this.props.comments.filter(
      (c) => c.status === "archived"
    ).length;
    const totalReplies = this.props.comments.reduce(
      (sum, comment) => sum + comment.replies.length,
      0
    );

    this.statsContent.innerHTML = `
      <span>📝 ${
        this.currentTab === "active" ? activeComments : archivedComments
      } ${this.currentTab === "active" ? "active" : "archived"}</span>
      <span>💬 ${totalReplies} replies</span>
      <span>📊 ${activeComments + archivedComments} total</span>
    `;
  }

  private createCommentItem(comment: Comment): HTMLElement {
    const item = document.createElement("div");
    item.className = "uicm-sidebar-comment-item";

    // Click to navigate
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🔧 Sidebar: Comment item clicked:", comment.id);
      this.props.onNavigateToComment(comment);
    });

    // Header with avatar, name, role, and time
    const header = document.createElement("div");
    header.className = "uicm-sidebar-comment-header";

    // Avatar
    const avatar = document.createElement("div");
    avatar.className = "uicm-sidebar-comment-avatar";
    let avatarChar = "?";
    if (
      comment &&
      comment.createdBy &&
      typeof comment.createdBy.name === "string" &&
      comment.createdBy.name.length > 0
    ) {
      avatarChar = comment.createdBy.name.charAt(0).toUpperCase();
    } else {
      console.warn("Sidebar: Comment missing createdBy or name", comment);
    }
    avatar.textContent = avatarChar;

    // User info container
    const userInfo = document.createElement("div");
    userInfo.className = "uicm-sidebar-comment-user-info";

    // Name and role row
    const nameRow = document.createElement("div");
    nameRow.className = "uicm-sidebar-comment-name-row";

    const name = document.createElement("span");
    name.className = "uicm-sidebar-comment-name";
    name.textContent = comment.createdBy.name;

    // Role badge
    const roleBadge = document.createElement("span");
    roleBadge.className = "uicm-sidebar-comment-role";
    const roleColors = getRoleColor(comment.role);
    roleBadge.style.backgroundColor = roleColors.bg;
    roleBadge.style.color = roleColors.text;
    roleBadge.style.borderColor = roleColors.border;
    roleBadge.textContent = getRoleDisplayName(comment.role);

    // Time
    const time = document.createElement("span");
    time.className = "uicm-sidebar-comment-time";
    time.textContent = this.formatTimeAgo(comment.createdAt);

    nameRow.appendChild(name);
    nameRow.appendChild(roleBadge);
    nameRow.appendChild(time);

    // Page name
    const pageName = document.createElement("div");
    pageName.className = "uicm-sidebar-comment-page";
    pageName.textContent = this.getPageName(comment.url);

    userInfo.appendChild(nameRow);
    userInfo.appendChild(pageName);

    header.appendChild(avatar);
    header.appendChild(userInfo);

    // Content
    const content = document.createElement("div");
    content.className = "uicm-sidebar-comment-content";
    content.textContent = comment.content;

    // Footer with status and reply count
    const footer = document.createElement("div");
    footer.className = "uicm-sidebar-comment-footer";

    // Status badge
    const statusBadge = document.createElement("span");
    statusBadge.className = "uicm-sidebar-comment-status";
    const statusColors = this.getStatusColor(comment.status);
    statusBadge.style.backgroundColor = statusColors.bg;
    statusBadge.style.color = statusColors.text;
    statusBadge.textContent = comment?.status?.toUpperCase();

    // Reply count
    const replyCount = document.createElement("span");
    replyCount.className = "uicm-sidebar-comment-replies";
    const replyIcon = document.createElement("span");
    replyIcon.className = "uicm-sidebar-comment-replies-icon";
    replyIcon.textContent = "💬";
    replyCount.appendChild(replyIcon);
    replyCount.appendChild(
      document.createTextNode(`${comment.replies.length}`)
    );

    footer.appendChild(statusBadge);
    footer.appendChild(replyCount);

    item.appendChild(header);
    item.appendChild(content);
    item.appendChild(footer);

    return item;
  }

  private createElement(): HTMLElement {
    const sidebar = document.createElement("div");
    sidebar.className = "uicm-comment-sidebar";

    // Header
    const header = document.createElement("div");
    header.className = "uicm-sidebar-header";

    const title = document.createElement("h3");
    title.className = "uicm-sidebar-title";
    title.textContent = "All Comments";

    const closeButton = document.createElement("button");
    closeButton.className = "uicm-sidebar-close";
    closeButton.innerHTML = "×";
    closeButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.props.onClose();
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    // Tabs
    const tabsContainer = document.createElement("div");
    tabsContainer.className = "uicm-sidebar-tabs";

    const activeTab = document.createElement("button");
    activeTab.className = "uicm-sidebar-tab uicm-sidebar-tab-active";
    activeTab.textContent = "Active";
    activeTab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.switchTab("active");
    });

    const archiveTab = document.createElement("button");
    archiveTab.className = "uicm-sidebar-tab";
    archiveTab.textContent = "Archive";
    archiveTab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.switchTab("archive");
    });

    tabsContainer.appendChild(activeTab);
    tabsContainer.appendChild(archiveTab);

    // Filter Toggle Button
    this.filterToggleBtn = document.createElement("button");
    this.filterToggleBtn.className = "uicm-sidebar-filter-toggle";
    this.filterToggleBtn.innerHTML = `
      <span class="uicm-filter-toggle-icon">🔍</span>
      <span class="uicm-filter-toggle-text">Filter</span>
      <span class="uicm-filter-toggle-arrow">▼</span>
    `;
    this.filterToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFilter();
    });

    // Status Filters
    this.filterContainer = document.createElement("div");
    this.filterContainer.className =
      "uicm-sidebar-filters uicm-sidebar-filters-closed";

    const filterHeader = document.createElement("div");
    filterHeader.className = "uicm-sidebar-filter-header";

    const filterIcon = document.createElement("span");
    filterIcon.className = "uicm-sidebar-filter-icon";
    filterIcon.innerHTML = "🔍";

    const filterTitle = document.createElement("div");
    filterTitle.className = "uicm-sidebar-filter-title";
    filterTitle.textContent = "Filter by Status";

    filterHeader.appendChild(filterIcon);
    filterHeader.appendChild(filterTitle);

    const filterButtons = document.createElement("div");
    filterButtons.className = "uicm-sidebar-filter-buttons";

    // All filter button
    const allFilterBtn = document.createElement("button");
    allFilterBtn.className = "uicm-status-filter-btn active";
    allFilterBtn.setAttribute("data-status", "all");
    allFilterBtn.innerHTML = `
      <span class="uicm-filter-btn-icon">📋</span>
      <span class="uicm-filter-btn-text">All</span>
    `;
    allFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.switchStatusFilter("all");
    });

    // Status filter buttons
    const statusFilters = [
      {
        status: CommentStatus.BUG,
        label: "Bug",
        icon: "🐛",
        color: "#dc3545",
        colorDark: "#c82333",
        colorDarker: "#a71e2a",
        colorRgb: "220, 53, 69",
      },
      {
        status: CommentStatus.FEATURE_REQUEST,
        label: "Feature",
        icon: "💡",
        color: "#ffc107",
        colorDark: "#e0a800",
        colorDarker: "#d39e00",
        colorRgb: "255, 193, 7",
      },
      {
        status: CommentStatus.DEV_COMPLETED,
        label: "Dev Done",
        icon: "✅",
        color: "#3b82f6",
        colorDark: "#2563eb",
        colorDarker: "#1d4ed8",
        colorRgb: "59, 130, 246",
      },
      {
        status: CommentStatus.DONE,
        label: "Done",
        icon: "🎉",
        color: "#28a745",
        colorDark: "#218838",
        colorDarker: "#1e7e34",
        colorRgb: "40, 167, 69",
      },
    ];

    statusFilters.forEach(
      ({ status, label, icon, color, colorDark, colorDarker, colorRgb }) => {
        const filterBtn = document.createElement("button");
        filterBtn.className = "uicm-status-filter-btn";
        filterBtn.setAttribute("data-status", status);
        filterBtn.setAttribute("data-color", color);
        filterBtn.innerHTML = `
        <span class="uicm-filter-btn-icon">${icon}</span>
        <span class="uicm-filter-btn-text">${label}</span>
      `;

        // Set CSS custom properties for color coding
        (filterBtn as HTMLElement).style.setProperty("--status-color", color);
        (filterBtn as HTMLElement).style.setProperty(
          "--status-color-dark",
          colorDark
        );
        (filterBtn as HTMLElement).style.setProperty(
          "--status-color-darker",
          colorDarker
        );
        (filterBtn as HTMLElement).style.setProperty(
          "--status-color-rgb",
          colorRgb
        );

        filterBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.switchStatusFilter(status);
        });
        filterButtons.appendChild(filterBtn);
      }
    );

    this.filterContainer.appendChild(filterHeader);
    this.filterContainer.appendChild(filterButtons);

    // Stats
    const stats = document.createElement("div");
    stats.className = "uicm-sidebar-stats";

    const activeComments = this.props.comments.filter(
      (c) => c.status !== "archived"
    ).length;
    const archivedComments = this.props.comments.filter(
      (c) => c.status === "archived"
    ).length;
    const totalReplies = this.props.comments.reduce(
      (sum, comment) => sum + comment.replies.length,
      0
    );

    this.statsContent = document.createElement("div");
    this.statsContent.className = "uicm-sidebar-stats-content";
    this.statsContent.innerHTML = `
      <span>📝 ${activeComments} active</span>
      <span>💬 ${totalReplies} replies</span>
      <span>📊 ${activeComments + archivedComments} total</span>
    `;
    stats.appendChild(this.statsContent);

    // Comments list
    this.commentsList = document.createElement("div");
    this.commentsList.className = "uicm-sidebar-comments-list";

    // Populate comments based on current tab
    this.updateCommentsDisplay();

    sidebar.appendChild(header);
    sidebar.appendChild(tabsContainer);
    sidebar.appendChild(this.filterToggleBtn);
    sidebar.appendChild(this.filterContainer);
    sidebar.appendChild(stats);
    sidebar.appendChild(this.commentsList);

    return sidebar;
  }

  private attachEventListeners(): void {
    // ESC key to close
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.isVisible) {
        this.props.onClose();
      }
    };
    document.addEventListener("keydown", escHandler);

    // Clean up on destroy
    this.element.addEventListener("destroy", () => {
      document.removeEventListener("keydown", escHandler);
    });
  }

  public show(): void {
    this.isVisible = true;

    document.body.appendChild(this.element);

    this.element.offsetHeight;

    this.element.classList.add("show");
  }

  public hide(): void {
    console.log("🔧 CommentSidebar: hide() called");
    this.isVisible = false;

    // Remove show class to trigger slide out animation
    this.element.classList.remove("show");

    // Remove from DOM after animation
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
        console.log("🔧 CommentSidebar: Element removed from DOM");
      }
    }, 300);
  }

  public updateComments(comments: Comment[]): void {
    this.props.comments = comments;
    this.updateCommentsDisplay();
    this.updateStats();
    this.updateTabStates();
    this.updateFilterStates();
  }

  private updateTabStates(): void {
    const activeTab = this.element.querySelector(".uicm-sidebar-tab.active");
    const archiveTab = this.element.querySelector(".uicm-sidebar-tab.archive");

    if (activeTab) {
      activeTab.classList.toggle("active", this.currentTab === "active");
    }
    if (archiveTab) {
      archiveTab.classList.toggle("active", this.currentTab === "archive");
    }
  }

  private updateFilterStates(): void {
    if (!this.filterContainer) return;

    const filterButtons = this.filterContainer.querySelectorAll(
      ".uicm-status-filter-btn"
    );
    filterButtons.forEach((btn) => {
      const status = btn.getAttribute("data-status");

      if (
        status === this.currentStatusFilter ||
        (status === "all" && this.currentStatusFilter === "all")
      ) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.hide();
    this.element.dispatchEvent(new Event("destroy"));
  }
}
