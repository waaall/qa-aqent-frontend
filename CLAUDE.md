# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QA Agent Frontend (电厂智能问答系统) - A modern ChatGPT-like interface for an intelligent power plant Q&A system built with React 18, TypeScript, Vite 5, and Ant Design 5.

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start dev server on http://localhost:3000
npm run build           # Build for production (runs tsc first, then vite build)
npm run preview         # Preview production build
npm run lint            # Run ESLint with TypeScript
```

### Backend Integration
- Dev server proxies `/api` requests to `http://localhost:5000`
- Backend must be running for full functionality
- Environment variables in `.env.development` and `.env.production`

## Architecture

### State Management Strategy
The app uses **Zustand** for global state with two main stores:

1. **chatStore** ([src/stores/chatStore.ts](src/stores/chatStore.ts))
   - Manages messages array and loading state
   - Messages are **NOT** persisted (session-scoped only)
   - Actions: addMessage, updateMessage, removeMessage, clearMessages, setMessages, setLoading

2. **sessionStore** ([src/stores/sessionStore.ts](src/stores/sessionStore.ts))
   - Manages sessions list and currentSessionId
   - Sessions **ARE** persisted to localStorage via `sessionStorage` utility
   - Auto-saves on every mutation
   - Actions: addSession, updateSession, removeSession, setCurrentSession, loadSessions

**Key Pattern**: Sessions persist across page reloads, but messages are loaded fresh from backend API when switching sessions.

### Data Flow

1. **User sends message** → `useChat` hook → `chatApi.sendMessage()`
2. **Backend responds** with `session_id` → Updates both stores
3. **Session switching** → Load history via `chatApi.getSessionHistory()` → Populate chatStore
4. **Session creation** → Backend creates → Stored locally in sessionStore

### API Integration

**apiClient** ([src/services/apiClient.ts](src/services/apiClient.ts)) is a singleton Axios wrapper with:
- Auto-configured baseURL from `config.apiBaseUrl`
- Request/response logging via `logger` utility
- Automatic error handling with user-friendly Ant Design messages
- HTTP status code translation to Chinese error messages
- Upload support with 5-minute timeout

**Key API patterns**:
```typescript
// Chat API (src/services/chatApi.ts)
chatApi.sendMessage({ query, session_id?, create_session? })
chatApi.getSessionHistory(sessionId)
chatApi.createSession()
chatApi.deleteSession(sessionId)

// Always use apiClient.get/post/put/delete for consistency
```

### Component Architecture

```
AppLayout (Layout/AppLayout.tsx)
├── Header (Layout/Header.tsx)
├── Sidebar (Sidebar/SessionList.tsx)
│   └── SessionItem (Sidebar/SessionItem.tsx)
└── ChatContainer (Chat/ChatContainer.tsx)
    ├── MessageList (Chat/MessageList.tsx)
    │   └── MessageItem (Chat/MessageItem.tsx)
    │       ├── MarkdownRenderer (Common/MarkdownRenderer.tsx)
    │       └── SourceTag (Common/SourceTag.tsx)
    └── InputBox (Chat/InputBox.tsx)
```

**Component Guidelines**:
- Each component has a `.module.css` file for scoped styling
- Export via `index.ts` barrel files
- Use `@/` alias for absolute imports (configured in vite.config.ts and tsconfig.json)

### Message Rendering

**MarkdownRenderer** component uses:
- `react-markdown` for parsing
- `remark-gfm` for GitHub-flavored markdown (tables, strikethrough, etc.)
- `rehype-highlight` for syntax highlighting
- `rehype-raw` to allow raw HTML in markdown

**SourceTag** displays data source badges based on `query_type`:
- 📚 knowledge - RAG knowledge base
- 🗄️ sql - SQL database queries
- 🔌 api - Real-time API data
- 💬 general - Generic conversation

### Logger Utility

**logger** ([src/utils/logger.ts](src/utils/logger.ts)) provides environment-aware logging:
- Controlled by `VITE_LOG_LEVEL` env variable
- Levels: debug, info, warn, error
- Production default: error-only
- Development default: debug
- Always use logger instead of console.log/error

## Type System

Core types in `src/types/`:

**message.ts**:
- `Message` - Has `id`, `role`, `content`, `timestamp`, optional `metadata` (query_type, engines_used, confidence)
- `isLoading` flag for loading states
- `error` field for failed messages

**session.ts**:
- `Session` - Has `session_id`, `title`, `created_at`, `last_accessed`, `message_count`

**api.ts**:
- `ChatRequest/ChatResponse` - Primary chat interface types
- `QueryType` - Union type: 'knowledge' | 'sql' | 'api' | 'general'

## Key Patterns

### Creating a New Session
```typescript
// In useSession hook or component
const { addSession } = useSessionStore();
const newSession = await chatApi.createSession();
addSession(newSession); // Auto-persists to localStorage
```

### Sending Messages
Always use `useChat` hook, never call API directly:
```typescript
const { sendMessage, isLoading } = useChat();
await sendMessage(content); // Handles all state updates
```

### Loading Session History
```typescript
const { currentSessionId } = useSessionStore();
const { setMessages } = useChatStore();

const history = await chatApi.getSessionHistory(currentSessionId);
const messages = history.history.map(transformToMessage);
setMessages(messages);
```

## Styling

- **CSS Modules** for all component styles (`.module.css`)
- **Ant Design** theme customization in App.tsx via ConfigProvider
- **Primary color**: #1890ff (Ant Design default blue)
- **Responsive breakpoints**:
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `> 1024px`

## Important Files

- [vite.config.ts](vite.config.ts) - Dev proxy, build config, path aliases
- [src/config/index.ts](src/config/index.ts) - Centralized app configuration (API URLs, timeouts, storage keys)
- [src/App.tsx](src/App.tsx) - Root component with TanStack Query provider
- [src/main.tsx](src/main.tsx) - Entry point, renders App with React 18 createRoot

## Common Pitfalls

1. **Don't persist messages in localStorage** - Only sessions are persisted. Messages are session-scoped and loaded from backend.

2. **Always use logger utility** - Never use console.log directly. Production logs are filtered by VITE_LOG_LEVEL.

3. **Session ID handling** - First message creates session if `create_session: true`. Subsequent messages must include `session_id`.

4. **Markdown security** - MarkdownRenderer uses `rehype-raw` which allows HTML. Backend should sanitize responses.

5. **Loading states** - Always check `isLoading` from `useChat` before allowing new messages. Loading placeholder message is added/removed automatically.

6. **Path aliases** - Use `@/` for imports, not relative paths like `../../../`. Configured in both tsconfig.json and vite.config.ts.
