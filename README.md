# UI Comment SDK

A modern, glassmorphism-styled comment system that enables teams to add visual comments and feedback directly on any web page or app UI. It's designed for developers, designers, and QA teams who need to collaborate, review, and discuss UI elements in real time or asynchronously.

## ✨ Key Benefits

- **Easy integration:** Plug-and-play with any project, no backend required
- **Visual feedback:** Pin comments to specific UI elements for clear context
- **Collaboration:** Streamline design reviews, bug reporting, and team discussions
- **Hybrid storage:** Comments are saved locally and can be synced for version control and teamwork
- **Flexible:** Works with static sites, React, and more

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dagkien71/UI-Comment-SDK
cd UI-Comment-SDK
```

### 2. Try the Demo

Open `demo/index.html` in your browser to see the SDK in action.

### 3. Installation

```bash
npm install ui-comment-sdk
```

### 4. Basic Setup

```javascript
import { initCommentSDK } from "ui-comment-sdk";

const sdk = initCommentSDK({
  projectId: "my-website",
  theme: "light", // optional: "light" or "dark"
  onFetchJsonFile: async () => {
    // Fetch comments from your backend
    const response = await fetch("/api/comments.json");
    const data = await response.json();
    return { comments: data.comments || [] };
  },
  onUpdate: async (comments) => {
    // Save to your backend
    await fetch("/api/comments.json", {
      method: "POST",
      body: JSON.stringify({ comments }),
    });
  },
});

await sdk.init();
```

### 5. CDN Usage

```html
<script src="https://unpkg.com/ui-comment-sdk@latest/dist/ui-comment-sdk.min.js"></script>
<script>
  const sdk = UICommentSDK.initCommentSDK({
    projectId: "my-website",
    theme: "light",
    onFetchJsonFile: async () => {
      const response = await fetch("/api/comments.json");
      const data = await response.json();
      return { comments: data.comments || [] };
    },
    onUpdate: async (comments) => {
      await fetch("/api/comments.json", {
        method: "POST",
        body: JSON.stringify({ comments }),
      });
    },
  });

  sdk.init();
</script>
```

## 📋 What You Need to Prepare

- **Backend API:** Set up endpoints to load and save comments (JSON file, database, or cloud storage)
- **API Callbacks:** Provide `onFetchJsonFile` and `onUpload` functions
- **Project ID:** Choose a unique identifier for your project
- **Theme (Optional):** Select "light" or "dark" theme for the UI
- **File Upload (Optional):** Configure image/document upload endpoints if needed

## 🚀 How to Use

1. Press `Ctrl+E` or click the comment icon to toggle comment mode
2. Click on any element to add a comment → SDK shows the comment form
3. Click on existing comment bubbles to view and reply to comments
4. Use the sidebar to browse all comments and navigate between them

**✨ What the SDK handles:** All UI components (forms, bubbles, modals, sidebar) - you only need to provide API callbacks for data persistence!

## 📝 GitHub Gist Setup (Recommended for Demo)

Perfect for demos, prototypes, and small projects. No server needed!

### Quick Setup Steps

1. [📝 Create a new GitHub Gist](https://gist.github.com/) with a file named `comments.json` (or any name you prefer)
2. [🔑 Get your GitHub Personal Access Token](https://github.com/settings/tokens) (with gist permissions)
3. Replace `GIST_ID` and `GITHUB_TOKEN` in the code below
4. Use these functions as your `onFetchJsonFile` and `onUpdate` callbacks

### Code Example

```javascript
// 1. Create a GitHub Gist
const GIST_ID = "your-gist-id-here";
const FILENAME = "comments.json"; // or any filename you prefer
const GITHUB_TOKEN = "your-github-token";

// 2. Setup API functions
async function fetchFromGist() {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
  const gist = await response.json();
  const file = gist.files[FILENAME];
  return JSON.parse(file.content);
}

async function saveToGist(data) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: {
        [FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });
}
```

## 🔧 Backend Setup

### Express.js Example

```javascript
const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

// Serve JSON file
app.get("/api/comments.json", (req, res) => {
  try {
    const data = fs.readFileSync("./comments.json", "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    // Return empty structure if file doesn't exist
    res.json({ comments: [] });
  }
});

// Update JSON file
app.post("/api/comments.json", (req, res) => {
  try {
    const data = {
      projectId: "my-project",
      comments: req.body,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync("./comments.json", JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## ✨ Features

- 🎯 **Click-to-Comment**: Click on any DOM element to add contextual comments
- 💬 **Rich Interactions**: Reply to comments, resolve discussions, and manage feedback
- ✨ **Glassmorphism UI**: Modern glass-effect design with blur backgrounds and smooth animations
- 🎨 **Dual Themes**: Built-in light and dark theme support
- 📱 **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- 🔧 **Easy Integration**: Simple API with callback-based data management
- 🛡️ **Conflict-Free**: All CSS classes prefixed with 'uicm-' to prevent style conflicts
- ⚡ **Performance Optimized**: Efficient XPath-based element tracking and debounced positioning
- ⌨️ **Keyboard Shortcuts**: Toggle comment mode with `Ctrl+E` (or `Cmd+E` on Mac)
- 📎 **File Attachments**: Support for images and documents in comments
- 🔗 **URL Detection**: Automatic detection and styling of URLs in comments

## 📚 API Reference

### Configuration

```typescript
interface CommentSDKConfig {
  projectId: string; // Required: Unique project identifier
  theme?: "light" | "dark"; // Optional: UI theme (default: 'light')
  onFetchJsonFile: () => Promise<{ comments: Comment[] }>; // Required: Fetch comments
  onUpdate: (comments: Comment[]) => Promise<void>; // Required: Save comments
  onUpload?: (file: File) => Promise<string>; // Optional: File upload handler
}
```

### Data Types

```typescript
interface Comment {
  id: string;
  content: string;
  xpath: string;
  url: string;
  position: { x: number; y: number };
  relativePosition: { x: number; y: number };
  createdAt: string;
  createdBy: User;
  role: string;
  replies: Comment[];
  status: CommentStatus;
  resolvedAt?: string;
  archivedAt?: string;
  attachments?: CommentAttachment[];
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  role?:
    | "developer"
    | "designer"
    | "product-manager"
    | "qa"
    | "stakeholder"
    | "other";
}

enum CommentStatus {
  BUG = "bug",
  FEATURE_REQUEST = "feature_request",
  DEV_COMPLETED = "dev_completed",
  DONE = "done",
  ARCHIVED = "archived",
}
```

### SDK Methods

```javascript
// Initialize SDK
await sdk.init();

// Toggle comment mode
sdk.setMode("comment"); // or 'normal'

// Get current comments
const comments = sdk.getComments();

// Reload comments
await sdk.reload();

// Clean up
sdk.destroy();
```

## 🎨 Customization

### CSS Custom Properties

The SDK uses CSS custom properties that you can override to match your brand:

```css
:root {
  --uicm-glass-blur: 12px;
  --uicm-glass-border-radius: 12px;
  --uicm-accent: rgba(99, 102, 241, 0.8);
  --uicm-accent-hover: rgba(79, 70, 229, 0.9);
  --uicm-success: rgba(16, 185, 129, 0.8);
  /* ... more variables */
}
```

### Theme Customization

```javascript
// You can also extend themes by modifying CSS variables after initialization
document.documentElement.style.setProperty(
  "--uicm-accent",
  "rgba(255, 0, 100, 0.8)"
);
```

## 🔌 Backend Examples

### JSONBin.io (Free)

```javascript
const sdk = initCommentSDK({
  projectId: "my-project",
  onFetchJsonFile: async () => {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      headers: { "X-Master-Key": MASTER_KEY },
    });
    const data = await response.json();
    return { comments: data.record?.comments || [] };
  },
  onUpdate: async (comments) => {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: { "X-Master-Key": MASTER_KEY },
      body: JSON.stringify({ comments }),
    });
  },
});
```

### Firebase

```javascript
const sdk = initCommentSDK({
  projectId: "my-project",
  onFetchJsonFile: async () => {
    const response = await fetch(
      "https://your-project.firebaseio.com/comments.json"
    );
    const data = await response.json();
    return { comments: data.comments || [] };
  },
  onUpdate: async (comments) => {
    await fetch("https://your-project.firebaseio.com/comments.json", {
      method: "PUT",
      body: JSON.stringify({ comments }),
    });
  },
});
```

## 🔧 Development

```bash
npm install
npm run build
npm run dev
```

## 📄 License

MIT License
