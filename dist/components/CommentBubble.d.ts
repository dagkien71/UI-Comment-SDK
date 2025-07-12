import { Comment, User, CommentStatus, CommentAttachment } from "../types";
export interface CommentBubbleProps {
    comment: Comment;
    position: {
        x: number;
        y: number;
    };
    currentUser: User;
    onReply: (commentId: string, content: string, user?: User, attachments?: CommentAttachment[]) => Promise<void>;
    onResolve: (commentId: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    onStatusChange: (commentId: string, status: CommentStatus) => Promise<void>;
    onShowModal: (modal: any) => void;
}
export declare class CommentBubble {
    private element;
    private props;
    private modal;
    private imageModal;
    constructor(props: CommentBubbleProps);
    private checkBubbleVisibility;
    private testBubbleClickability;
    private getStatusColor;
    private createElement;
    private attachEventListeners;
    private handleClick;
    private showModal;
    updateComment(comment: Comment): void;
    updateUser(user: User): void;
    private updateBubbleAppearance;
    updatePosition(position: {
        x: number;
        y: number;
    }): void;
    getElement(): HTMLElement;
    destroy(): void;
    testClickability(): void;
}
//# sourceMappingURL=CommentBubble.d.ts.map