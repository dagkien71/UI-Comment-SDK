import { Comment, CommentSDKConfig, User } from "../types";
export declare class CommentSDK {
    private config;
    private commentManager;
    private debugIcon;
    private settingsButton;
    private sidebarButton;
    private sidebar;
    private root;
    private isInitialized;
    private comments;
    private currentUser;
    constructor(config: CommentSDKConfig);
    private validateConfig;
    init(): Promise<void>;
    private setupDOM;
    private loadCommentsFromUserFunction;
    private saveCommentsToJsonFile;
    private initializeUI;
    private toggleMode;
    setMode(mode: "normal" | "comment"): void;
    private openSidebar;
    private navigateToComment;
    private findElementByXPath;
    private generateId;
    destroy(): void;
    getComments(): Comment[];
    getCurrentUser(): User;
}
export declare function initCommentSDK(config: CommentSDKConfig): CommentSDK;
//# sourceMappingURL=CommentSDK.d.ts.map