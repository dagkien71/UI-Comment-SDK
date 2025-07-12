export interface User {
  id: string;
  name: string;
  avatar?: string;
  role?:
    | "developer"
    | "designer"
    | "product-manager"
    | "qa"
    | "stakeholder"
    | "other";
}

export enum CommentStatus {
  BUG = "bug", // Màu đỏ - comment mới tạo
  FEATURE_REQUEST = "feature_request", // Màu vàng - yêu cầu tính năng mới
  DEV_COMPLETED = "dev_completed", // Màu xanh dương - dev đã fix
  DONE = "done", // Màu xanh - tester đã review
  ARCHIVED = "archived", // Màu xám - đã archive
}

export interface CommentAttachment {
  id: string;
  filename: string;
  url: string;
  type: "image" | "file";
  size: number;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  xpath: string;
  url: string;
  position: { x: number; y: number };
  relativePosition: { x: number; y: number };
  createdAt: string;
  createdBy: User;
  role: string; // Role of the comment creator
  replies: Comment[];
  status: CommentStatus;
  resolvedAt?: string; // Timestamp khi status changed to DONE
  archivedAt?: string; // Timestamp khi archived
  attachments?: CommentAttachment[]; // File/image attachments
}

export type CommentMode = "normal" | "comment";

export interface CommentSDKConfig {
  projectId: string;
  currentUser: User;
  theme?: "light" | "dark";
  autoInject?: boolean;
  debugMode?: boolean;
  onLoadComments: () => Promise<Comment[]>;
  onSaveComment: (
    comment: Omit<Comment, "id" | "createdAt">
  ) => Promise<Comment>;
  onUpdateComment?: (comment: Comment) => Promise<Comment>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export interface CommentSDKConfig {
  projectId: string;
  theme?: "light" | "dark";
  onFetchJsonFile: () => Promise<{ comments: Comment[] }>; // Function to fetch JSON data
  onUpdate: (comments: Comment[]) => Promise<void>; // Action to update JSON file
}

export interface CommentManagerConfig {
  projectId: string;
  currentUser: User;
  theme?: "light" | "dark";
  onLoadComments: () => Promise<Comment[]>;
  onSaveComment: (
    comment: Omit<Comment, "id" | "createdAt">
  ) => Promise<Comment>;
  onUpdateComment?: (comment: Comment) => Promise<Comment>;
  onDeleteComment?: (commentId: string) => Promise<void>;
}

export interface CommentBubbleProps {
  comment: Comment;
  position: { x: number; y: number };
  isActive?: boolean;
  onClick?: (comment: Comment) => void;
  currentUser: User;
  onReply?: (content: string) => void;
  onResolve?: () => void;
  onDelete?: () => void;
}

export interface CommentFormProps {
  position: { x: number; y: number };
  element: Element;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  currentUser: User;
}

export interface DebugIconProps {
  isActive: boolean;
  onClick: () => void;
  theme: "light" | "dark";
}

export interface CommentPopupProps {
  comment: Comment;
  position: { x: number; y: number };
  onClose: () => void;
  onReply?: (content: string) => void;
  onResolve?: () => void;
  onDelete?: () => void;
  currentUser: User;
}

export interface ElementHighlight {
  element: Element;
  bounds: DOMRect;
}

export interface SDKEvents {
  "mode-changed": { mode: CommentMode };
  "comment-created": { comment: Comment };
  "comment-updated": { comment: Comment };
  "comment-deleted": { commentId: string };
}

export type EventCallback<T extends keyof SDKEvents> = (
  event: SDKEvents[T]
) => void;
