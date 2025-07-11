export interface LocalStorageUtils {
    getCommentsData(): any;
    getAllUICMData(): Record<string, any>;
    clearCommentsData(): void;
    exportCommentsData(): string;
    importCommentsData(data: string): boolean;
}
export declare class LocalStorageManager implements LocalStorageUtils {
    private commentsKey;
    private userProfileKey;
    private projectKey;
    getCommentsData(): any;
    getAllUICMData(): Record<string, any>;
    clearCommentsData(): void;
    exportCommentsData(): string;
    importCommentsData(data: string): boolean;
    getProjectData(projectId: string): any;
    getUserProfileData(): any;
    displayAllData(): void;
}
export declare const localStorageUtils: LocalStorageManager;
//# sourceMappingURL=localStorageUtils.d.ts.map