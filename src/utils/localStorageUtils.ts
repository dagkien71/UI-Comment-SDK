export interface LocalStorageUtils {
  getCommentsData(): any;
  getAllUICMData(): Record<string, any>;
  clearCommentsData(): void;
  exportCommentsData(): string;
  importCommentsData(data: string): boolean;
}

export class LocalStorageManager implements LocalStorageUtils {
  private commentsKey = "uicm-comments";
  private userProfileKey = "uicm-user-profile";
  private projectKey = "uicm-demo-project";

  public getCommentsData(): any {
    try {
      const data = localStorage.getItem(this.commentsKey);
      if (!data) {
        return null;
      }

      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (error) {
      return null;
    }
  }

  public getAllUICMData(): Record<string, any> {
    const allData: Record<string, any> = {};

    try {
      // Get all localStorage keys that start with 'uicm-'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("uicm-")) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              allData[key] = JSON.parse(value);
            }
          } catch (error) {
            allData[key] = localStorage.getItem(key); // Store as string if JSON parse fails
          }
        }
      }

      return allData;
    } catch (error) {
      return {};
    }
  }

  public clearCommentsData(): void {
    try {
      localStorage.removeItem(this.commentsKey);
    } catch (error) {}
  }

  public exportCommentsData(): string {
    try {
      const data = this.getCommentsData();
      if (!data) {
        return "";
      }

      const exportData = {
        timestamp: new Date().toISOString(),
        data: data,
        version: "1.0.0",
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return jsonString;
    } catch (error) {
      return "";
    }
  }

  public importCommentsData(data: string): boolean {
    try {
      const parsedData = JSON.parse(data);

      // Handle both direct data and wrapped export format
      const commentsData = parsedData.data || parsedData;

      localStorage.setItem(this.commentsKey, JSON.stringify(commentsData));
      return true;
    } catch (error) {
      return false;
    }
  }

  public getProjectData(projectId: string): any {
    try {
      const key = `uicm-${projectId}`;
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }

      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (error) {
      return null;
    }
  }

  public getUserProfileData(): any {
    try {
      const data = localStorage.getItem(this.userProfileKey);
      if (!data) {
        return null;
      }

      const parsedData = JSON.parse(data);
      return parsedData;
    } catch (error) {
      return null;
    }
  }

  public displayAllData(): void {
    const allData = this.getAllUICMData();

    console.group("🔍 UICM LocalStorage Data");
    console.log("Total UICM keys found:", Object.keys(allData).length);

    Object.keys(allData).forEach((key) => {
      const value = allData[key];
      console.group(`📁 ${key}`);
      console.log("Type:", typeof value);
      console.log("Size:", JSON.stringify(value).length, "characters");
      console.log("Data:", value);
      console.groupEnd();
    });

    console.groupEnd();
  }
}

// Default instance
export const localStorageUtils = new LocalStorageManager();
