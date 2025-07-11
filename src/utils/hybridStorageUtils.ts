import { CommentSDKConfig } from "../types";
import { HybridCommentStorage } from "../storage/HybridCommentStorage";

/**
 * Creates a hybrid storage config for demo/development purposes
 * Saves comments to localStorage + exports to JSON file
 */
export function createHybridStorageConfig(
  projectId: string = "demo-project"
): CommentSDKConfig {
  return {
    projectId,
    currentUser: {
      id: "user_demo",
      name: "Demo User",
      avatar: undefined,
    },
    theme: "light",
    onLoadComments: async () => {
      return await HybridCommentStorage.loadComments();
    },
    onSaveComment: async (comment) => {
      return await HybridCommentStorage.addComment(comment);
    },
    onDeleteComment: async (commentId) => {
      await HybridCommentStorage.deleteComment(commentId);
    },
    onUpdateComment: async (updatedComment) => {
      return await HybridCommentStorage.updateComment(updatedComment);
    },
  };
}

/**
 * Hybrid storage utilities for demo/development
 */
export const hybridStorageUtils = {
  /**
   * Load all comments from storage and show alert
   */
  loadAll: () => {
    HybridCommentStorage.loadComments().then((comments) => {
      console.log("Loaded comments:", comments);
      alert(`Loaded ${comments.length} comments from storage`);
    });
  },

  /**
   * Export comments to JSON file
   */
  syncToFile: () => {
    HybridCommentStorage.syncToFile();
  },

  /**
   * Clear all comments from storage
   */
  clearAll: () => {
    HybridCommentStorage.clearAllComments().then(() => {
      alert("All comments cleared!");
      location.reload();
    });
  },

  /**
   * Show instructions in console
   */
  showInstructions: () => {
    console.log("🔧 Hybrid Storage Instructions:");
    console.log("- Comments are saved to localStorage + exported to JSON file");
    console.log("- Use loadAll() to load comments from storage");
    console.log("- Use syncToFile() to download comments as JSON");
    console.log("- Use clearAll() to clear all comments");
  },
};
