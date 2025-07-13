// Main SDK exports
import { initCommentSDK } from "./core/CommentSDK";
export { CommentSDK, initCommentSDK } from "./core/CommentSDK";
import "./styles/layers.css";
import "./styles/image-modal.css";
import "./styles/comment-modal.css";
import "./styles/comment-bubble.css";
import "./styles/comment-form.css";
import "./styles/profile-settings-modal.css";
import "./styles/settings-button.css";
import "./styles/sidebar-button.css";
import "./styles/comment-sidebar.css";

// Type exports for consumers
export * from "./types";

// Component exports
export { ProfileSettingsModal } from "./components/ProfileSettingsModal";
export { SettingsButton } from "./components/SettingsButton";

// Storage and utilities
export { CommentStorage } from "./storage/CommentStorage";
export { HybridCommentStorage } from "./storage/HybridCommentStorage";
export {
  createHybridStorageConfig,
  hybridStorageUtils,
} from "./utils/hybridStorageUtils";
export {
  userProfileStorage,
  LocalUserProfileStorage,
} from "./utils/userProfileStorage";
export {
  localStorageUtils,
  LocalStorageManager,
} from "./utils/localStorageUtils";

// GitHub Gist Storage
export { GitHubGistStorage } from "./utils/githubGistStorage";

// Storage optimization
export { StorageOptimizer } from "./utils/storageOptimizer";
export { ImageCompressor } from "./utils/imageCompression";
export { AdvancedImageCompressor } from "./utils/advancedImageCompression";

// Upload managers with different compression levels
export {
  base64UploadManager,
  advancedUploadManager,
  minimalUploadManager,
  createCustomUploadManager,
} from "./utils/base64Upload";

// Version information
export const VERSION = "1.0.0";

// Default export for UMD build
export default { initCommentSDK };
