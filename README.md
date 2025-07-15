# UI Comment SDK

[🌐 Live Demo](https://ui-comment-sdk.vercel.app/)

Easily add visual comments and feedback to any web page or app UI. **A backend is required** for saving and loading comments.

---

## 🚀 Quick Setup

### 1. Backend API Required

Set up API endpoints to load and save comments (e.g., REST API, JSON file, or cloud storage).

- **GET** `/api/comments.json` → returns `{ comments: [...] }`
- **POST** `/api/comments.json` → accepts updated comments array

### 2. CDN Usage

```html
<!-- Include SDK from CDN -->
<script src="https://cdn.jsdelivr.net/npm/ui-comment-sdk@latest/dist/ui-comment-sdk.min.js"></script>
<script>
  const sdk = UICommentSDK.initCommentSDK({
    projectId: "my-project",
    onFetchJsonFile: async () => {
      return await fetch("/api/comments.json").then(r => r.json());
    },
    onUpdate: async (comments) => {
      await fetch("/api/comments.json", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comments)
      });
    }
  });
  await sdk.init();
</script>
```

### 3. React / NPM Usage

```bash
npm install ui-comment-sdk
```

```jsx
import { useEffect } from "react";
import { initCommentSDK } from "ui-comment-sdk";

function CommentSDKWrapper() {
  useEffect(() => {
    const sdk = initCommentSDK({
      projectId: "my-react-project",
      onFetchJsonFile: async () => {
        return await fetch("/api/comments.json").then((r) => r.json());
      },
      onUpdate: async (comments) => {
        await fetch("/api/comments.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comments),
        });
      },
    });
    sdk.init();
    return () => sdk.destroy();
  }, []);
  return null;
}
```

---

## 🔗 Demo & Documentation

- [Live Demo & Docs](https://ui-comment-sdk.vercel.app/)

---

**Note:** This SDK requires you to provide API callbacks for comment persistence. Local storage is not used in production. For a quick backend, see the [demo site](https://ui-comment-sdk.vercel.app/) for Express.js or JSONBin.io examples.
