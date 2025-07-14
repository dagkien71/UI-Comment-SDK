import { User, CommentAttachment } from "../types";
export interface CommentFormProps {
    onSubmit: (content: string, userName?: string, attachments?: CommentAttachment[]) => Promise<void>;
    onCancel: () => void;
    position: {
        x: number;
        y: number;
    };
    element: Element;
    currentUser: User;
}
export declare class CommentForm {
    private element;
    private props;
    private textarea;
    private nameInput;
    private submitButton;
    private isSubmitting;
    private selectedAttachments;
    private charCounter;
    private avatar;
    private imageModal;
    constructor(props: CommentFormProps);
    private addFilePreview;
    private formatFileSize;
    private createElement;
    private setupEventListeners;
    private updateCharCounter;
    private updateSubmitButton;
    private handleSubmit;
    private showError;
    getElement(): HTMLElement;
    reposition(): void;
    destroy(): void;
}
