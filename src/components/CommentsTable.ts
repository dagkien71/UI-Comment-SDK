import { Comment, User, CommentStatus } from "../types";
import { getRoleColor, getRoleDisplayName } from "../utils/roleColors";
import { ImageModal } from "./ImageModal";

interface SortConfig {
  key: keyof Comment | "author" | "statusText";
  direction: "asc" | "desc";
}

interface FilterConfig {
  status?: CommentStatus[];
  author?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  searchText?: string;
}

export interface CommentsTableProps {
  comments: Comment[];
  currentUser: User;
  onClose: () => void;
  onDeleteComments: (commentIds: string[]) => Promise<void>;
  onUpdateComment?: (comment: Comment) => Promise<void>;
}

export class CommentsTable {
  private props: CommentsTableProps;
  private element: HTMLElement;
  private selectedComments: Set<string> = new Set();
  private sortConfig: SortConfig = { key: "createdAt", direction: "desc" };
  private filterConfig: FilterConfig = {};
  private filteredComments: Comment[] = [];
  private destroyed = false;
  private imageModal: ImageModal | null = null; // <--- Thêm biến này

  constructor(props: CommentsTableProps) {
    this.props = props;
    this.element = this.createElement();
    this.updateFilteredComments();
    this.render();
    this.attachEventListeners();
  }

  private createElement(): HTMLElement {
    const modal = document.createElement("div");
    modal.className = "uicm-comments-table-modal";
    modal.innerHTML = `
      <div class="uicm-comments-table-overlay"></div>
      <div class="uicm-comments-table-container">
        <div class="uicm-comments-table-header">
          <h2>Comments Management</h2>
          <button class="uicm-comments-table-close" aria-label="Close">×</button>
        </div>
        
        <div class="uicm-comments-table-toolbar">
          <div class="uicm-comments-table-filters">
            <input type="text" class="uicm-search-input" placeholder="Search comments...">
            
            <select class="uicm-status-filter">
              <option value="">All Status</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="dev_completed">Dev Completed</option>
              <option value="done">Done</option>
              <option value="archived">Archived</option>
            </select>
            
            <input type="date" class="uicm-date-start" placeholder="Start Date">
            <input type="date" class="uicm-date-end" placeholder="End Date">
            
            <button class="uicm-clear-filters uicm-allow-bubble">Clear Filters</button>
          </div>
          
          <div class="uicm-comments-table-actions">
            <button class="uicm-delete-selected uicm-allow-bubble" disabled>Delete Selected</button>
            <button class="uicm-export-excel uicm-allow-bubble">Export CSV</button>
          </div>
        </div>
        
        <div class="uicm-comments-table-wrapper">
          <table class="uicm-comments-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" class="uicm-select-all">
                </th>
                <th class="sortable" data-key="createdAt">
                  Date Created
                  <span class="sort-indicator">↓</span>
                </th>
                <th class="sortable" data-key="role">
                  Role
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="author">
                  Name
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="status">
                  Status
                  <span class="sort-indicator"></span>
                </th>
                <th class="sortable" data-key="content">
                  Content
                  <span class="sort-indicator"></span>
                </th>
                <th>Attachments</th>
                <th>URL</th>
                <th>Replies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody class="uicm-comments-table-body">
            </tbody>
          </table>
        </div>
        
        <div class="uicm-comments-table-footer">
          <div class="uicm-comments-count">
            Total: <span class="total-count">0</span> comments
            (<span class="selected-count">0</span> selected)
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  private updateFilteredComments(): void {
    console.log("🔄 Updating filtered comments...");
    console.log("📊 Total source comments:", this.props.comments.length);
    console.log("🔍 Current filter config:", this.filterConfig);

    let filtered = [...this.props.comments];

    // Apply search filter
    if (this.filterConfig.searchText?.trim()) {
      const searchText = this.filterConfig.searchText.toLowerCase();
      filtered = filtered.filter(
        (comment) =>
          comment.content.toLowerCase().includes(searchText) ||
          comment.createdBy.name.toLowerCase().includes(searchText)
      );
    }

    // Apply status filter
    if (this.filterConfig.status?.length) {
      filtered = filtered.filter((comment) =>
        this.filterConfig.status!.includes(comment.status)
      );
    }

    // Apply author filter
    if (this.filterConfig.author?.length) {
      filtered = filtered.filter((comment) =>
        this.filterConfig.author!.includes(comment.createdBy.name)
      );
    }

    // Apply date range filter
    if (
      this.filterConfig.dateRange?.start ||
      this.filterConfig.dateRange?.end
    ) {
      filtered = filtered.filter((comment) => {
        const commentDate = new Date(comment.createdAt);
        const start = this.filterConfig.dateRange?.start
          ? new Date(this.filterConfig.dateRange.start)
          : null;
        const end = this.filterConfig.dateRange?.end
          ? new Date(this.filterConfig.dateRange.end)
          : null;

        if (start && commentDate < start) return false;
        if (end && commentDate > end) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortConfig.key) {
        case "author":
          aValue = a.createdBy.name;
          bValue = b.createdBy.name;
          break;
        case "role":
          aValue = a.createdBy.role || "other";
          bValue = b.createdBy.role || "other";
          break;
        case "statusText":
          aValue = this.getStatusDisplayName(a.status);
          bValue = this.getStatusDisplayName(b.status);
          break;
        default:
          aValue = a[this.sortConfig.key as keyof Comment];
          bValue = b[this.sortConfig.key as keyof Comment];
      }

      if (aValue < bValue) return this.sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return this.sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    this.filteredComments = filtered;
    console.log("✅ Filtered comments updated:", this.filteredComments.length);
  }

  private render(): void {
    const tbody = this.element.querySelector(
      ".uicm-comments-table-body"
    ) as HTMLElement;
    const totalCount = this.element.querySelector(
      ".total-count"
    ) as HTMLElement;
    const selectedCount = this.element.querySelector(
      ".selected-count"
    ) as HTMLElement;

    tbody.innerHTML = "";

    this.filteredComments.forEach((comment) => {
      const row = this.createCommentRow(comment);
      tbody.appendChild(row);
    });

    totalCount.textContent = this.filteredComments.length.toString();
    selectedCount.textContent = this.selectedComments.size.toString();

    // Update delete button state
    const deleteButton = this.element.querySelector(
      ".uicm-delete-selected"
    ) as HTMLButtonElement;
    deleteButton.disabled = this.selectedComments.size === 0;

    // Update select all checkbox
    const selectAllCheckbox = this.element.querySelector(
      ".uicm-select-all"
    ) as HTMLInputElement;
    if (this.filteredComments.length === 0) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    } else if (this.selectedComments.size === this.filteredComments.length) {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = true;
    } else if (this.selectedComments.size > 0) {
      selectAllCheckbox.indeterminate = true;
      selectAllCheckbox.checked = false;
    } else {
      selectAllCheckbox.indeterminate = false;
      selectAllCheckbox.checked = false;
    }
  }

  private createCommentRow(comment: Comment): HTMLElement {
    const row = document.createElement("tr");
    row.className = "uicm-comment-row";
    row.dataset.commentId = comment.id;

    const isSelected = this.selectedComments.has(comment.id);
    const statusColor = this.getStatusColor(comment.status);
    const statusName = this.getStatusDisplayName(comment.status);
    const roleColor = getRoleColor(comment.createdBy.role || "other");
    const formattedDate = new Date(comment.createdAt).toLocaleString();

    const attachmentsCell = document.createElement("td");
    attachmentsCell.className = "attachments-cell";
    if (comment.attachments && comment.attachments.length > 0) {
      comment.attachments.forEach((att) => {
        if (att.type === "image") {
          const thumb = document.createElement("img");
          thumb.src = att.url;
          thumb.alt = att.filename;
          thumb.className = "uicm-attachment-thumb";
          thumb.style.width = "36px";
          thumb.style.height = "36px";
          thumb.style.objectFit = "cover";
          thumb.style.borderRadius = "6px";
          thumb.style.marginRight = "4px";
          thumb.style.cursor = "pointer";
          thumb.title = att.filename;
          thumb.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.imageModal) {
              this.imageModal.destroy();
              this.imageModal = null;
            }
            this.imageModal = new ImageModal(att.url);
            this.imageModal.show();
          });
          attachmentsCell.appendChild(thumb);
        } else {
          const fileIcon = document.createElement("span");
          fileIcon.innerHTML = "📎";
          fileIcon.style.fontSize = "18px";
          fileIcon.style.marginRight = "2px";
          fileIcon.title = att.filename;
          attachmentsCell.appendChild(fileIcon);
          const fileName = document.createElement("span");
          fileName.textContent = att.filename;
          fileName.style.fontSize = "12px";
          fileName.style.marginRight = "6px";
          attachmentsCell.appendChild(fileName);
        }
      });
    } else {
      attachmentsCell.textContent = "-";
    }

    row.innerHTML = `
      <td>
        <input type="checkbox" class="uicm-comment-select" ${
          isSelected ? "checked" : ""
        }>
      </td>
      <td class="date-cell">${formattedDate}</td>
      <td class="role-cell">
        <span class="author-role" style="color: ${roleColor}">${getRoleDisplayName(
      comment.createdBy.role || "other"
    )}</span>
      </td>
      <td class="author-cell">
        <span class="author-name">${comment.createdBy.name}</span>
      </td>
      <td class="status-cell">
        <span class="status-badge" style="background-color: ${statusColor}">${statusName}</span>
      </td>
      <td class="content-cell">
        <div class="comment-content">${this.truncateText(
          comment.content,
          100
        )}</div>
      </td>
    `;
    row.appendChild(attachmentsCell);
    row.innerHTML += `
      <td class="url-cell">
        <span class="url-text" title="${comment.url}" style="display:inline-block; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle;">${comment.url}</span>
      </td>
      <td class="replies-cell">
        <span class="replies-count">${comment.replies.length}</span>
      </td>
      <td class="actions-cell">
        <button class="uicm-edit-comment" data-comment-id="${comment.id}" style="display: none;" disabled>Edit</button>
        <button class="uicm-delete-comment uicm-allow-bubble" data-comment-id="${comment.id}" title="Delete">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;"><path d="M6 8V15M10 8V15M14 8V15M3 5H17M8 5V3.5C8 2.67157 8.67157 2 9.5 2H10.5C11.3284 2 12 2.67157 12 3.5V5M4 5V16.5C4 17.3284 4.67157 18 5.5 18H14.5C15.3284 18 16 17.3284 16 16.5V5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    `;

    return row;
  }

  private attachEventListeners(): void {
    // Close button
    const closeButton = this.element.querySelector(
      ".uicm-comments-table-close"
    ) as HTMLElement;
    closeButton.addEventListener(
      "click",
      (e) => {
        console.log("❌ Close button clicked");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.closeModal();
      },
      true
    );

    // Overlay click to close
    const overlay = this.element.querySelector(
      ".uicm-comments-table-overlay"
    ) as HTMLElement;
    overlay.addEventListener(
      "click",
      (e) => {
        console.log("🖱️ Overlay clicked, target:", e.target);
        // Only close if clicking directly on overlay, not on child elements
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.closeModal();
        }
      },
      true
    );

    // Search input with debounce
    const searchInput = this.element.querySelector(
      ".uicm-search-input"
    ) as HTMLInputElement;
    let searchDebounce: ReturnType<typeof setTimeout> | null = null;
    searchInput.addEventListener("input", (e) => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.filterConfig.searchText = (e.target as HTMLInputElement).value;
        this.updateFilteredComments();
        this.render();
      }, 300);
    });

    // Status filter (single select)
    const statusFilter = this.element.querySelector(
      ".uicm-status-filter"
    ) as HTMLSelectElement;
    statusFilter.addEventListener("change", () => {
      const value = statusFilter.value;
      this.filterConfig.status = value ? [value as any] : undefined;
      this.updateFilteredComments();
      this.render();
    });

    // Date filters
    const dateStart = this.element.querySelector(
      ".uicm-date-start"
    ) as HTMLInputElement;
    const dateEnd = this.element.querySelector(
      ".uicm-date-end"
    ) as HTMLInputElement;

    dateStart.addEventListener("change", (e) => {
      if (!this.filterConfig.dateRange) this.filterConfig.dateRange = {};
      this.filterConfig.dateRange.start = (e.target as HTMLInputElement).value;
      this.updateFilteredComments();
      this.render();
    });

    dateEnd.addEventListener("change", (e) => {
      if (!this.filterConfig.dateRange) this.filterConfig.dateRange = {};
      this.filterConfig.dateRange.end = (e.target as HTMLInputElement).value;
      this.updateFilteredComments();
      this.render();
    });

    // Clear filters
    const clearFilters = this.element.querySelector(
      ".uicm-clear-filters"
    ) as HTMLElement;
    clearFilters.addEventListener("click", () => {
      console.log("🔄 Clearing all filters...");
      console.log(
        "📊 Before clear - filtered comments:",
        this.filteredComments.length
      );
      console.log(
        "📊 Before clear - total comments:",
        this.props.comments.length
      );

      // Clear any pending debounce
      if (searchDebounce) {
        clearTimeout(searchDebounce);
        searchDebounce = null;
      }

      // Reset filter config completely
      this.filterConfig = {
        status: undefined,
        author: undefined,
        dateRange: undefined,
        searchText: undefined,
      };

      // Reset form values
      searchInput.value = "";
      statusFilter.value = "";
      dateStart.value = "";
      dateEnd.value = "";

      // Force re-filter and render immediately
      this.updateFilteredComments();
      this.render();

      console.log(
        "📊 After clear - filtered comments:",
        this.filteredComments.length
      );
      console.log("✅ All filters cleared and UI updated");

      // Optional: Force trigger events for any external listeners
      setTimeout(() => {
        const inputEvent = new Event("input", { bubbles: true });
        const changeEvent = new Event("change", { bubbles: true });

        searchInput.dispatchEvent(inputEvent);
        statusFilter.dispatchEvent(changeEvent);
        dateStart.dispatchEvent(changeEvent);
        dateEnd.dispatchEvent(changeEvent);
      }, 0);
    });

    // Sort headers
    const sortableHeaders = this.element.querySelectorAll(".sortable");
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const key = header.getAttribute("data-key") as any;
        if (this.sortConfig.key === key) {
          this.sortConfig.direction =
            this.sortConfig.direction === "asc" ? "desc" : "asc";
        } else {
          this.sortConfig.key = key;
          this.sortConfig.direction = "asc";
        }
        this.updateSortIndicators();
        this.updateFilteredComments();
        this.render();
      });
    });

    // Select all checkbox
    const selectAllCheckbox = this.element.querySelector(
      ".uicm-select-all"
    ) as HTMLInputElement;
    selectAllCheckbox.addEventListener("change", () => {
      if (selectAllCheckbox.checked) {
        this.filteredComments.forEach((comment) =>
          this.selectedComments.add(comment.id)
        );
      } else {
        this.selectedComments.clear();
      }
      this.render();
    });

    // Table event delegation
    const table = this.element.querySelector(
      ".uicm-comments-table"
    ) as HTMLElement;
    table.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Comment selection
      if (target.classList.contains("uicm-comment-select")) {
        const checkbox = target as HTMLInputElement;
        const row = checkbox.closest(".uicm-comment-row") as HTMLElement;
        const commentId = row.dataset.commentId!;

        if (checkbox.checked) {
          this.selectedComments.add(commentId);
        } else {
          this.selectedComments.delete(commentId);
        }
        this.render();
      }

      // Delete single comment
      if (target.classList.contains("uicm-delete-comment")) {
        const commentId = target.dataset.commentId!;
        this.deleteComment(commentId);
      }
    });

    // Delete selected
    const deleteSelected = this.element.querySelector(
      ".uicm-delete-selected"
    ) as HTMLElement;
    deleteSelected.addEventListener("click", () => {
      this.deleteSelectedComments();
    });

    // Export CSV
    const exportExcel = this.element.querySelector(
      ".uicm-export-excel"
    ) as HTMLElement;
    exportExcel.addEventListener("click", (e) => {
      console.log("🔄 Export button clicked");
      e.preventDefault();
      e.stopPropagation();

      console.log("📊 Filtered comments count:", this.filteredComments.length);
      console.log("📊 Sample comment:", this.filteredComments[0]);

      exportCommentsToCSV(
        this.filteredComments,
        "comments_export.csv",
        { separator: ";" },
        (error) => {
          console.error("❌ Export error:", error);
          alert("Export failed: " + error);
        }
      );
    });

    // ESC key to close
    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("🔑 ESC key pressed, closing modal...");
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
      }
    };
    document.addEventListener("keydown", this.escHandler, true);

    // Prevent event propagation outside modal (but allow close buttons to work)
    this.element.addEventListener(
      "mousedown",
      (e) => {
        const target = e.target as HTMLElement;
        // Allow close button and overlay clicks to bubble
        if (
          !target.classList.contains("uicm-comments-table-overlay") &&
          !target.classList.contains("uicm-comments-table-close") &&
          !target.classList.contains("uicm-allow-bubble")
        ) {
          e.stopPropagation();
        }
      },
      true
    );
    this.element.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement;
        // Allow close button and overlay clicks to bubble
        if (
          !target.classList.contains("uicm-comments-table-overlay") &&
          !target.classList.contains("uicm-comments-table-close") &&
          !target.classList.contains("uicm-allow-bubble")
        ) {
          e.stopPropagation();
        }
      },
      true
    );
    this.element.addEventListener(
      "keydown",
      (e) => {
        // Allow ESC to bubble for closing, block others
        if (e.key !== "Escape") {
          e.stopPropagation();
        }
      },
      true
    );
  }

  private handleEscKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      this.props.onClose();
    }
  };

  private updateSortIndicators(): void {
    const headers = this.element.querySelectorAll(".sortable");
    headers.forEach((header) => {
      const indicator = header.querySelector(".sort-indicator") as HTMLElement;
      const key = header.getAttribute("data-key");

      if (key === this.sortConfig.key) {
        indicator.textContent = this.sortConfig.direction === "asc" ? "↑" : "↓";
      } else {
        indicator.textContent = "";
      }
    });
  }

  private async deleteComment(commentId: string): Promise<void> {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      // Gọi callback để xóa ở API/localStorage nếu có
      if (this.props.onDeleteComments) {
        await this.props.onDeleteComments([commentId]);
      }
      // Xóa khỏi UI sau khi API thành công hoặc nếu không có callback
      this.props.comments = this.props.comments.filter(
        (c) => c.id !== commentId
      );
      this.filteredComments = this.filteredComments.filter(
        (c) => c.id !== commentId
      );
      this.selectedComments.delete(commentId);
      this.render();
    } catch (error) {
      alert("Failed to delete comment from server/localStorage!");
      console.error(error);
    }
  }

  private async deleteSelectedComments(): Promise<void> {
    if (this.selectedComments.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${this.selectedComments.size} selected comments?`
      )
    ) {
      await this.props.onDeleteComments(Array.from(this.selectedComments));
      this.selectedComments.clear();
      this.updateFilteredComments();
      this.render();
    }
  }

  private getStatusColor(status: CommentStatus): string {
    switch (status) {
      case CommentStatus.BUG:
        return "#ef4444";
      case CommentStatus.FEATURE_REQUEST:
        return "#f59e0b";
      case CommentStatus.DEV_COMPLETED:
        return "#3b82f6";
      case CommentStatus.DONE:
        return "#10b981";
      case CommentStatus.ARCHIVED:
        return "#6b7280";
      default:
        return "#6b7280";
    }
  }

  private getStatusDisplayName(status: CommentStatus): string {
    switch (status) {
      case CommentStatus.BUG:
        return "Bug";
      case CommentStatus.FEATURE_REQUEST:
        return "Feature Request";
      case CommentStatus.DEV_COMPLETED:
        return "Dev Completed";
      case CommentStatus.DONE:
        return "Done";
      case CommentStatus.ARCHIVED:
        return "Archived";
      default:
        return "Unknown";
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  private closeModal(): void {
    console.log(
      "🔄 CommentsTable closeModal called, destroyed:",
      this.destroyed
    );
    if (this.destroyed) {
      console.log("⚠️ Modal already destroyed, ignoring close request");
      return;
    }

    this.destroyed = true;
    console.log("✅ Destroying CommentsTable modal...");

    // Clean up event listeners first
    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler);
      this.escHandler = null;
    }

    // Remove from DOM
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log("✅ Modal removed from DOM");
    }

    // Call onClose callback
    try {
      this.props.onClose();
      console.log("✅ onClose callback executed");
    } catch (error) {
      console.error("❌ Error in onClose callback:", error);
    }
  }

  private escHandler: ((e: KeyboardEvent) => void) | null = null;

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    console.log("🔄 CommentsTable destroy() called");
    if (this.destroyed) {
      console.log("⚠️ Already destroyed, skipping");
      return;
    }

    this.destroyed = true;

    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler);
      this.escHandler = null;
      console.log("✅ Event listeners removed");
    }

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log("✅ Element removed from DOM");
    }

    if (this.imageModal) {
      this.imageModal.destroy();
      this.imageModal = null;
    }
  }
}

function exportCommentsToCSV(
  comments: any[],
  filename: string = "comments_export.csv",
  options: {
    separator?: string;
  } = { separator: "," },
  onError?: (message: string) => void
): void {
  try {
    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      const msg = "Không có dữ liệu hợp lệ để xuất!";
      onError?.(msg);
      alert(msg);
      return;
    }

    // Only export the required fields in the specified order
    const data = comments.map((c) => ({
      "Created Date": c?.createdAt
        ? (() => {
            const d = new Date(c.createdAt);
            const pad = (n: number) => n.toString().padStart(2, "0");
            return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(
              d.getDate()
            )} ${pad(d.getMonth() + 1)} ${d.getFullYear()}`;
          })()
        : "",
      Content: c?.content ?? "",
      Name: c?.createdBy?.name ?? "",
      Role:
        typeof getRoleDisplayName === "function"
          ? getRoleDisplayName(c?.createdBy?.role || "other")
          : c?.createdBy?.role || "",
      Status: c?.status ?? "",
      Attachments: Array.isArray(c?.attachments)
        ? c.attachments.map((a: any) => a.filename).join("; ")
        : "",
      URL: c?.url ?? "",
    }));

    if (!data.length) {
      const msg = "Không có dữ liệu hợp lệ để xuất!";
      onError?.(msg);
      alert(msg);
      return;
    }

    const escapeCsvValue = (value: any): string => {
      if (value == null) return "";
      const str = String(value)
        .replace(/"/g, '""')
        .replace(/^([=+\-@])/g, "'$1");
      return `"${str.replace(/\n/g, " ")}"`;
    };

    const separator = options.separator || ",";
    const headers = [
      "Created Date",
      "Content",
      "Name",
      "Role",
      "Status",
      "Attachments",
      "URL",
    ];
    const csvRows = [headers.join(separator)];
    for (const row of data as Record<string, any>[]) {
      const values = headers.map((h) => escapeCsvValue(row[h]));
      csvRows.push(values.join(separator));
    }

    const BOM = "\uFEFF";
    const csvString = BOM + csvRows.join("\n");
    console.log("Nội dung CSV:", csvString);

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const blobUrl = URL.createObjectURL(blob);
    console.log("URL Blob:", blobUrl);

    const safeFilename = filename.endsWith(".csv")
      ? filename
      : `${filename}.csv`;

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 5000);

    console.log("✅ Tải file CSV thành công");
  } catch (error) {
    const msg =
      "Lỗi khi xuất CSV: " +
      (error instanceof Error ? error.message : "Lỗi không xác định");
    onError?.(msg);
    alert(msg);
    console.error(error);
  }
}
