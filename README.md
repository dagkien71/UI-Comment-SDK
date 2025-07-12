# UI Comment SDK

A modern, glassmorphism-styled comment system that allows developers to easily add collaborative feedback functionality to any web application. Similar to Figma's comment mode, but for regular DOM elements.

## 🚀 Quick Start

### Installation

```bash
npm install ui-comment-sdk
```

### Simple Setup

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

### CDN Usage

```html
<script src="https://cdn.jsdelivr.net/npm/ui-comment-sdk@1.1.0/dist/ui-comment-sdk.min.js"></script>
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

## ✨ Features

- 🎯 **Click-to-Comment**: Click on any DOM element to add contextual comments
- 💬 **Rich Interactions**: Reply to comments, resolve discussions, and manage feedback
- ✨ **Glassmorphism UI**: Modern glass-effect design with blur backgrounds and smooth animations
- 🎨 **Dual Themes**: Built-in light and dark theme support
- 📱 **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- 🔧 **Easy Integration**: Simple API with callback-based data management
- 🛡️ **Conflict-Free**: All CSS classes prefixed with 'uicm-' to prevent style conflicts
- ⚡ **Performance Optimized**: Efficient XPath-based element tracking and debounced positioning
- ⌨️ **Keyboard Shortcuts**: Toggle comment mode with `Ctrl+Alt+C` (or `Cmd+Alt+C` on Mac)

## 📚 API Reference

### Configuration

```typescript
interface CommentSDKConfig {
  projectId: string; // Required: Unique project identifier
  theme?: "light" | "dark"; // Optional: UI theme (default: 'light')
  onFetchJsonFile: () => Promise<{ comments: Comment[] }>; // Required: Fetch comments
  onUpdate: (comments: Comment[]) => Promise<void>; // Required: Save comments
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

### Local API

```javascript
const sdk = initCommentSDK({
  projectId: "my-project",
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
```

## 🚀 Demo

Try the demo to see the SDK in action:

1. Clone this repository
2. Open `demo/index.html` in your browser
3. Click the debug icon (🔧) to enable comment mode
4. Click on any element to add comments

## 🔧 Development

```bash
npm install
npm run build
npm run dev
```

## 📄 License

MIT License
