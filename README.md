# UI Comment SDK

A modern, glassmorphism-styled comment system that allows developers to easily add collaborative feedback functionality to any web application. Similar to Figma's comment mode, but for regular DOM elements.

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

## 🚀 Quick Start

### Installation

```bash
npm install ui-comment-sdk
```

### Basic Usage

```javascript
import { initCommentSDK } from "ui-comment-sdk";

const sdk = initCommentSDK({
  projectId: "my-website",
  currentUser: {
    id: "user-123",
    name: "John Doe",
    avatar: "https://example.com/avatar.jpg", // optional
  },
  onLoadComments: async () => {
    // Load comments from your backend
    const response = await fetch("/api/comments");
    return await response.json();
  },
  onSaveComment: async (comment) => {
    // Save comment to your backend
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comment),
    });
    return await response.json();
  },
  theme: "glass-light", // or 'glass-dark'
});
```

## 📚 API Reference

### Configuration Options

```typescript
interface CommentSDKConfig {
  projectId: string; // Unique identifier for your project
  currentUser: User; // Current user information
  onLoadComments: () => Promise<Comment[]>; // Function to load existing comments
  onSaveComment: (
    comment: Omit<Comment, "id" | "createdAt">
  ) => Promise<Comment>; // Function to save new comments
  onUpdateComment?: (comment: Comment) => Promise<Comment>; // Optional: Update existing comments
  onDeleteComment?: (commentId: string) => Promise<void>; // Optional: Delete comments
  theme?: "glass-light" | "glass-dark"; // UI theme (default: 'glass-light')
  autoInject?: boolean; // Auto-initialize on DOM ready (default: true)
  debugMode?: boolean; // Enable debug logging (default: false)
}
```

### Data Structures

```typescript
interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string;
  xpath: string; // XPath selector for the target element
  content: string;
  createdAt: string; // ISO date string
  createdBy: User;
  resolved: boolean;
  replies?: Comment[]; // Nested replies
  position?: { x: number; y: number }; // Optional cached position
}
```

### SDK Methods

```javascript
// Initialize the SDK (if autoInject is false)
await sdk.init();

// Toggle comment mode programmatically
sdk.setMode("comment"); // or 'normal'

// Get current mode
const mode = sdk.getMode(); // 'comment' | 'normal'

// Switch themes
sdk.setTheme("glass-dark");

// Reload comments from data source
await sdk.reload();

// Get all current comments
const comments = sdk.getComments();

// Get comments for a specific element
const elementComments = sdk.getCommentsForElement(
  document.querySelector(".my-element")
);

// Highlight an element (useful for drawing attention)
sdk.highlightElement(document.querySelector(".important-element"));

// Clean up and remove SDK
sdk.destroy();
```

### Event System

```javascript
// Listen for mode changes
sdk.on("mode-changed", ({ mode }) => {
  console.log("Comment mode is now:", mode);
});

// Listen for comment events
sdk.on("comment-created", ({ comment }) => {
  console.log("New comment created:", comment);
});

sdk.on("comment-updated", ({ comment }) => {
  console.log("Comment updated:", comment);
});

sdk.on("comment-deleted", ({ commentId }) => {
  console.log("Comment deleted:", commentId);
});

// Remove event listeners
sdk.off("mode-changed", handler);
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

## 💡 Advanced Usage

### Custom Comment Positioning

```javascript
// Override default positioning logic
const sdk = initCommentSDK({
  // ... other config
  onSaveComment: async (comment) => {
    // Add custom position logic
    const element = document.evaluate(comment.xpath, document).singleNodeValue;
    if (element) {
      const rect = element.getBoundingClientRect();
      comment.position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    return await saveToBackend(comment);
  },
});
```

### Integration with Authentication

```javascript
// Update current user when authentication state changes
function updateUser(newUser) {
  sdk.destroy();
  const newSDK = initCommentSDK({
    ...originalConfig,
    currentUser: newUser,
  });
}
```

### Batch Operations

```javascript
// Bulk resolve comments
async function resolveAllComments() {
  const comments = sdk.getComments();
  const unresolvedComments = comments.filter((c) => !c.resolved);

  for (const comment of unresolvedComments) {
    comment.resolved = true;
    if (sdk.config.onUpdateComment) {
      await sdk.config.onUpdateComment(comment);
    }
  }

  await sdk.reload();
}
```

## 🚀 Demo

Visit the demo page to see the SDK in action:

1. Clone this repository
2. Open `demo/index.html` in your browser
3. Click the debug icon (⚙️) in the bottom-left corner
4. Click on any element to add a comment
5. Try different themes and interactions

## 🔧 Development

### Building from Source

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Start development server with demo
npm run dev

# Serve demo page
npm run serve
```

### Project Structure

```
ui-comment-sdk/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (XPath, DOM helpers)
│   ├── components/      # UI components (DebugIcon, CommentBubble, etc.)
│   ├── core/            # Core SDK logic (CommentSDK, CommentManager)
│   ├── styles/          # CSS styles with glassmorphism theme
│   └── index.ts         # Main entry point
├── demo/                # Demo page
├── dist/                # Built files
└── docs/                # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@ui-comment-sdk.com
- 💬 Discord: [Join our community](https://discord.gg/ui-comment-sdk)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/ui-comment-sdk/issues)
- 📖 Documentation: [Full API Documentation](https://docs.ui-comment-sdk.com)

## 🙏 Acknowledgments

- Inspired by Figma's commenting system
- Built with modern web technologies
- Glassmorphism design trend
- Community feedback and contributions
