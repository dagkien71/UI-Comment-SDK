import { User } from "../types";
export interface SettingsButtonProps {
    currentUser: User;
    onUserUpdate: (user: User) => Promise<void>;
    isVisible?: boolean;
}
export declare class SettingsButton {
    private element;
    private props;
    private profileModal;
    constructor(props: SettingsButtonProps);
    private createElement;
    private attachEventListeners;
    private openProfileSettings;
    getElement(): HTMLElement;
    setVisible(visible: boolean): void;
    destroy(): void;
}
