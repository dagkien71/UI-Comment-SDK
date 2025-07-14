import { User } from "../types";
export interface ProfileSettingsModalProps {
    currentUser: User;
    onSave: (user: User) => Promise<void>;
    onClose: () => void;
}
export declare class ProfileSettingsModal {
    private element;
    private props;
    constructor(props: ProfileSettingsModalProps);
    private createElement;
    private attachEventListeners;
    private handleSave;
    getElement(): HTMLElement;
    destroy(): void;
}
