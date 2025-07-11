import { Comment, CommentStatus, User } from "../types";
import "../styles/comment-sidebar.css";
export interface CommentSidebarProps {
    comments: Comment[];
    currentUser: User;
    onNavigateToComment: (comment: Comment) => void;
    onClose: () => void;
    onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
}
export declare class CommentSidebar {
    private element;
    private props;
    private isVisible;
    private currentTab;
    private commentsList;
    private statsContent;
    constructor(props: CommentSidebarProps);
    private formatTimeAgo;
    private getStatusColor;
    private getPageName;
    private getFilteredComments;
    private switchTab;
    private updateCommentsDisplay;
    private updateStats;
    private createCommentItem;
    private createElement;
    private attachEventListeners;
    show(): void;
    hide(): void;
    updateComments(comments: Comment[]): void;
    private updateTabStates;
    getElement(): HTMLElement;
    destroy(): void;
}
//# sourceMappingURL=CommentSidebar.d.ts.map