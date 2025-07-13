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
    private currentStatusFilter;
    private isFilterOpen;
    private commentsList;
    private statsContent;
    private filterContainer;
    private filterToggleBtn;
    constructor(props: CommentSidebarProps);
    private formatTimeAgo;
    private getStatusColor;
    private getPageName;
    private getFilteredComments;
    private switchTab;
    private switchStatusFilter;
    private toggleFilter;
    private updateCommentsDisplay;
    private updateStats;
    private createCommentItem;
    private createElement;
    private attachEventListeners;
    show(): void;
    hide(): void;
    updateComments(comments: Comment[]): void;
    private updateTabStates;
    private updateFilterStates;
    getElement(): HTMLElement;
    destroy(): void;
}
