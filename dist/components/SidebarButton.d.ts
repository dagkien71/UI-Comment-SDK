import { User } from "../types";
export interface SidebarButtonProps {
    currentUser: User;
    onClick: () => void;
    isVisible?: boolean;
}
export declare class SidebarButton {
    private element;
    private props;
    constructor(props: SidebarButtonProps);
    private createElement;
    private attachEventListeners;
    getElement(): HTMLElement;
    setVisible(visible: boolean): void;
    updateUser(user: User): void;
    destroy(): void;
}
//# sourceMappingURL=SidebarButton.d.ts.map