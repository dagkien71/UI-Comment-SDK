import { DebugIconProps } from "../types";
export declare class DebugIcon {
    private element;
    private props;
    constructor(props: DebugIconProps);
    private createElement;
    private getIconHTML;
    private attachEventListeners;
    private createTooltip;
    updateState(isActive: boolean): void;
    updateTheme(theme: "light" | "dark"): void;
    getElement(): HTMLElement;
    destroy(): void;
}
