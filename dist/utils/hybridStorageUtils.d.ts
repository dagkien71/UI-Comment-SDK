import { CommentSDKConfig } from "../types";
/**
 * Creates a hybrid storage config for demo/development purposes
 * Saves comments to localStorage + exports to JSON file
 */
export declare function createHybridStorageConfig(projectId?: string): CommentSDKConfig;
/**
 * Hybrid storage utilities for demo/development
 */
export declare const hybridStorageUtils: {
    /**
     * Load all comments from storage and show alert
     */
    loadAll: () => void;
    /**
     * Export comments to JSON file
     */
    syncToFile: () => void;
    /**
     * Clear all comments from storage
     */
    clearAll: () => void;
    /**
     * Show instructions in console
     */
    showInstructions: () => void;
};
//# sourceMappingURL=hybridStorageUtils.d.ts.map