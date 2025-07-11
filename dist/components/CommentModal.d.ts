import { Comment, User, CommentStatus, CommentAttachment } from "../types";
export interface CommentModalProps {
    comments: Comment[];
    currentUser: User;
    position: {
        x: number;
        y: number;
    };
    onClose: () => void;
    onAddReply: (commentId: string, content: string, user?: User, attachments?: CommentAttachment[]) => Promise<void>;
    onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
}
export declare class CommentModal {
    private element;
    private props;
    private imageModal;
    constructor(props: CommentModalProps);
    private detectAndFormatUrls;
    private formatFileSize;
    private addFilePreview;
    private createElement;
    private createCommentItem;
    private createReplyForm;
    updateComments(comments: Comment[]): void;
    private refreshCommentsList;
    private formatTimeAgo;
    private attachEventListeners;
    private handleOutsideClick;
    getElement(): HTMLElement;
    reposition(): void;
    destroy(): void;
}
//# sourceMappingURL=CommentModal.d.ts.map