import { Comment } from "../types";

export interface GistStorageConfig {
  gistId: string;
  filename: string;
  githubToken?: string; // Optional: for private gists
}

export class GitHubGistStorage {
  private config: GistStorageConfig;
  private baseUrl = "https://api.github.com";

  constructor(config: GistStorageConfig) {
    this.config = config;
  }

  /**
   * Load comments from GitHub Gist
   */
  async loadComments(): Promise<Comment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/gists/${this.config.gistId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load gist: ${response.statusText}`);
      }

      const gist = await response.json();
      const file = gist.files[this.config.filename];

      if (!file) {
        throw new Error(`File ${this.config.filename} not found in gist`);
      }

      const content = file.content;
      const data = JSON.parse(content);

      return data.comments || [];
    } catch (error) {
      console.error("Failed to load from GitHub Gist:", error);
      return [];
    }
  }

  /**
   * Save comments to GitHub Gist
   */
  async saveComments(comments: Comment[]): Promise<void> {
    try {
      const content = JSON.stringify({ comments }, null, 2);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization if token is provided
      if (this.config.githubToken) {
        headers["Authorization"] = `token ${this.config.githubToken}`;
      }

      const response = await fetch(
        `${this.baseUrl}/gists/${this.config.gistId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            files: {
              [this.config.filename]: {
                content: content,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save gist: ${response.statusText}`);
      }

      console.log("✅ Comments saved to GitHub Gist successfully");
    } catch (error) {
      console.error("Failed to save to GitHub Gist:", error);
      throw error;
    }
  }

  /**
   * Create a new gist (one-time setup)
   */
  static async createGist(
    filename: string,
    initialContent: string,
    githubToken?: string,
    isPublic: boolean = true
  ): Promise<string> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (githubToken) {
        headers["Authorization"] = `token ${githubToken}`;
      }

      const response = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers,
        body: JSON.stringify({
          description: "UI Comment SDK Data",
          public: isPublic,
          files: {
            [filename]: {
              content: initialContent,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create gist: ${response.statusText}`);
      }

      const gist = await response.json();
      return gist.id;
    } catch (error) {
      console.error("Failed to create gist:", error);
      throw error;
    }
  }

  /**
   * Get gist URL for viewing
   */
  getGistUrl(): string {
    return `https://gist.github.com/${this.config.gistId}`;
  }

  /**
   * Get raw content URL
   */
  getRawUrl(): string {
    return `https://gist.githubusercontent.com/${this.config.gistId}/raw/${this.config.filename}`;
  }
}
