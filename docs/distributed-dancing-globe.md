# QA Agent Frontend 现代化重构计划（分阶段渐进式）

## 概述

本计划采用**分阶段渐进式策略**，优先修复关键Bug和安全漏洞，然后全面升级依赖到最新稳定版本。暂不实现暗色主题。

### 核心目标
1. 修复关键Bug和逻辑错误
2. 升级所有依赖到最新稳定版（React 19、Vite 7、Ant Design 6等）
3. 修复安全漏洞（XSS、Vite CVE）
4. 性能优化（防抖、memoization）
5. ⏸️ 暗色主题（暂不实现）

### 项目当前状态
- React 18.2.0（需升级至19.2.3）
- Vite 5.0.0（需升级至7.3.0，存在安全漏洞）
- Ant Design 5.12.0（需升级至6.1.0）
- Zustand 4.4.0（需升级至5.0.9）
- 无测试框架（需添加Vitest）
- 无代码格式化工具（需添加Prettier）

---

## 阶段1：关键Bug修复（第1-2天）

### 目标
修复已发现的逻辑错误和关键问题，确保项目基础功能稳定。

### 修复列表

#### 1.1 useChat.ts - 修复isFirstMessage逻辑错误
**位置**: `src/hooks/useChat.ts:77`

**问题分析**:
```typescript
// 当前代码（错误）
const isFirstMessage = messages.length === 1; // 只有用户消息
```
此时`messages`已包含用户消息，但判断条件错误。实际执行流程：
1. addMessage(userMessage) → messages.length = 1
2. addMessage(loadingMessage) → messages.length = 2
3. 此时判断`messages.length === 1`永远为false（除非在step 1和2之间判断）

**修复方案**:
```typescript
// 方案1：在发送前检查（推荐）
const isFirstMessage = messages.length === 0;

// 或方案2：基于currentSessionId判断（更可靠）
const isFirstMessage = !currentSessionId;
```

**影响**: 修复会话标题生成逻辑

---

#### 1.2 useSession.ts - 修复消息ID冲突风险
**位置**: `src/hooks/useSession.ts:73-74`

**问题分析**:
```typescript
// 当前代码
const messages: Message[] = response.history.map((item, index) => ({
  id: `${sessionId}-${index}`,  // 仅基于索引，会导致重复
```

如果重新加载会话历史，相同的index会产生相同的ID，导致React key警告和渲染问题。

**修复方案**:
```typescript
// 优先使用后端提供的message_id，否则生成唯一ID
const messages: Message[] = response.history.map((item, index) => ({
  id: item.message_id || `${sessionId}-${item.timestamp || Date.now()}-${index}`,
  // 包含时间戳确保唯一性
```

---

#### 1.3 Header.tsx - 统一日志记录
**位置**: `src/components/Layout/Header.tsx:29`

**问题**: 使用`console.error`而非统一的logger工具

**修复方案**:
```typescript
// 修改前
} catch (error) {
  console.error('Failed to check health', error);

// 修改后
} catch (error) {
  logger.error('Failed to check health', error);
```

---

#### 1.4 apiClient.ts - 避免错误提示重复显示
**位置**: `src/services/apiClient.ts:52-54`

**问题分析**:
响应拦截器中调用`handleError()`已显示Ant Design message，然后reject又被上层catch，导致重复显示。

**修复方案**:
```typescript
// 方案：移除拦截器中的自动提示，由各API层决定是否显示
private handleError(error: AxiosError) {
  logger.error('API Error', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    data: error.response?.data,
  });
  // 移除所有 message.error() 调用
}
```

然后在各个API调用处根据需要显示错误提示。

---

#### 1.5 sessionStore - 添加防抖保存
**位置**: `src/stores/sessionStore.ts`

**问题**: 每次updateSession都立即写localStorage，高频操作时性能差

**修复方案**:
1. 修改`utils/storage.ts`添加防抖函数：
```typescript
let saveTimeout: NodeJS.Timeout | null = null;

export const sessionStorage = {
  // 现有方法保持不变

  saveLater(sessions: Session[], delay = 1000): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      this.save(sessions);
    }, delay);
  },

  saveImmediate(sessions: Session[]): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    this.save(sessions);
  }
};
```

2. 修改sessionStore使用防抖保存：
```typescript
updateSession: (sessionId, updates) => {
  const sessions = get().sessions.map(...);
  set({ sessions });
  sessionStorage.saveLater(sessions, 1000); // 1秒防抖
},

removeSession: (sessionId) => {
  // 删除操作立即保存
  const sessions = get().sessions.filter(...);
  set({ sessions, currentSessionId: ... });
  sessionStorage.saveImmediate(sessions);
}
```

---

## 阶段2：依赖升级（第3-5天）

### 目标
全面升级核心依赖到最新稳定版本，修复安全漏洞。

### 2.1 升级策略
采用**阶段化升级**避免一次性升级失败：

```bash
# Step 1: 创建重构分支
git checkout -b refactor/modernization-2025

# Step 2: 备份当前状态
git tag pre-refactor-2025
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Step 3: 升级工具链
npm install -D vite@7.3.0 @vitejs/plugin-react@5.1.2

# Step 4: 测试构建
npm run build
npm run dev  # 手动测试

# Step 5: 升级React生态
npm install react@19.2.3 react-dom@19.2.3
npm install -D @types/react@19.2.7 @types/react-dom@19.2.3

# Step 6: 运行React 19 codemod
npx codemod react/19/migration-recipe

# Step 7: 升级UI库
npm install antd@6.1.0 @ant-design/icons@6.1.0

# Step 8: 升级状态管理
npm install zustand@5.0.9

# Step 9: 修复安全问题
npm install axios@1.7.9
npm install react-markdown@10.1.0 rehype-sanitize@7.0.0
npm uninstall rehype-raw

# Step 10: 添加开发工具
npm install -D vitest@3.2.0 @vitest/ui@3.2.0
npm install -D @testing-library/react@16.3.0 @testing-library/jest-dom@7.0.0 jsdom@25.0.0
npm install -D prettier@3.5.0 eslint-config-prettier@10.0.0 eslint-plugin-prettier@5.2.0

# Step 11: 更新TypeScript
npm install -D typescript@5.7.0
```

### 2.2 package.json 目标版本

```json
{
  "dependencies": {
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "antd": "^6.1.0",
    "@ant-design/icons": "^6.1.0",
    "zustand": "^5.0.9",
    "react-markdown": "^10.1.0",
    "rehype-sanitize": "^7.0.0",
    "rehype-highlight": "^7.0.0",
    "remark-gfm": "^4.0.0",
    "axios": "^1.7.9",
    "@tanstack/react-query": "^5.90.12",
    "dayjs": "^1.11.13"
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "vite": "^7.3.0",
    "@vitejs/plugin-react": "^5.1.2",
    "typescript": "^5.7.0",
    "eslint": "^9.39.2",
    "typescript-eslint": "^8.49.0",
    "eslint-plugin-react-hooks": "^7.0.1",
    "vitest": "^3.2.0",
    "@vitest/ui": "^3.2.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^7.0.0",
    "jsdom": "^25.0.0",
    "prettier": "^3.5.0",
    "eslint-config-prettier": "^10.0.0",
    "eslint-plugin-prettier": "^5.2.0"
  }
}
```

### 2.3 关键配置文件更新

#### vite.config.ts
**位置**: `vite.config.ts`

**修改内容**:
1. 移除硬编码IP，使用环境变量
2. 添加构建优化配置
3. 配置代码分割

```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic', // React 19兼容
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development', // 仅开发环境生成sourcemap
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd', '@ant-design/icons'],
            markdown: ['react-markdown', 'rehype-highlight', 'rehype-sanitize'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      target: 'esnext',
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'antd',
        'zustand',
        '@tanstack/react-query',
      ],
    },
  };
});
```

#### 新建环境变量文件

**文件**: `.env.development`
```env
# API配置
VITE_API_BASE_URL=http://192.168.50.11:8006/api/

# 应用配置
VITE_APP_TITLE=智能问答系统 [开发]

# 日志级别
VITE_LOG_LEVEL=debug

# 功能开关
VITE_ENABLE_MOCK=false
```

**文件**: `.env.production`
```env
# API配置 - 生产环境使用相对路径
VITE_API_BASE_URL=/api

# 应用配置
VITE_APP_TITLE=智能问答系统

# 日志级别
VITE_LOG_LEVEL=error
```

---

## 阶段3：安全加固（第6天）

### 目标
修复XSS漏洞，添加输入验证。

### 3.1 MarkdownRenderer - 移除XSS风险
**位置**: `src/components/Common/MarkdownRenderer.tsx`

**问题**: 使用`rehype-raw`允许任意HTML，存在XSS风险

**修复方案**:
```typescript
// 移除
import rehypeRaw from 'rehype-raw';

// 添加
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

// 自定义清理schema
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: ['className'], // 允许代码高亮class
    a: ['href', 'target', 'rel'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'], // 禁止javascript:协议
  },
};

export const MarkdownRenderer = React.memo<MarkdownRendererProps>(
  ({ content, className }) => {
    return (
      <div className={`${styles.markdown} ${className || ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeHighlight,
            [rehypeSanitize, sanitizeSchema], // 替换rehype-raw
          ]}
          components={{
            a: ({ href, children }) => {
              const isValidUrl = /^https?:\/\//i.test(href || '');
              if (!isValidUrl) return <span>{children}</span>;

              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);
```

### 3.2 添加输入验证工具
**新建文件**: `src/utils/validation.ts`

```typescript
/**
 * 验证和清理用户输入
 */
export const validateUserInput = (input: string): string => {
  let cleaned = input.trim();

  // 限制长度
  const MAX_LENGTH = 10000;
  if (cleaned.length > MAX_LENGTH) {
    cleaned = cleaned.substring(0, MAX_LENGTH);
  }

  return cleaned;
};

/**
 * 验证URL是否安全
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
```

### 3.3 InputBox - 应用输入验证
**位置**: `src/components/Chat/InputBox.tsx`

```typescript
import { validateUserInput } from '@/utils/validation';

const handleSend = () => {
  const cleanedValue = validateUserInput(value);

  if (!cleanedValue) {
    message.warning('请输入有效内容');
    return;
  }

  onSend(cleanedValue);
  setValue('');
};
```

---

## 阶段4：性能优化（第7-8天）

### 目标
添加组件memoization，优化渲染性能。

### 4.1 MarkdownRenderer - 添加React.memo
**位置**: `src/components/Common/MarkdownRenderer.tsx`

```typescript
export const MarkdownRenderer = React.memo<MarkdownRendererProps>(
  ({ content, className }) => {
    return <div>...</div>;
  },
  (prev, next) =>
    prev.content === next.content &&
    prev.className === next.className
);
```

### 4.2 MessageItem - 细粒度优化
**位置**: `src/components/Chat/MessageItem.tsx`

```typescript
const MessageItem = React.memo<MessageItemProps>(
  ({ message }) => {
    // 使用useMemo缓存格式化时间
    const formattedTime = useMemo(
      () => timeAgo(message.timestamp),
      [message.timestamp]
    );

    return (
      <div className={styles.container}>
        <span className={styles.time}>{formattedTime}</span>
        <MarkdownRenderer content={message.content} />
      </div>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.isLoading === next.message.isLoading
);
```

### 4.3 useChat - 优化依赖数组
**位置**: `src/hooks/useChat.ts:106-115`

**问题**: 包含`messages`作为依赖会导致每次消息更新时重新创建`sendMessage`

**修复方案**:
```typescript
// 移除messages依赖，使用store的getState()
const sendMessage = useCallback(
  async (content: string) => {
    // 使用 useChatStore.getState().messages 而非依赖数组中的messages
    const currentMessages = useChatStore.getState().messages;
    const isFirstMessage = currentMessages.length === 0;

    // ... 其余逻辑
  },
  [currentSessionId, isLoading, addMessage, removeMessage, setLoading, updateSession]
  // 移除messages依赖
);
```

---

## 阶段5：测试框架配置（第9-10天）

### 目标
添加Vitest测试框架，建立基础测试。

### 5.1 Vitest配置
**新建文件**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 5.2 测试环境设置
**新建文件**: `src/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as any;
```

### 5.3 关键测试用例（示例）
**新建文件**: `src/stores/__tests__/chatStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false });
  });

  it('should add message correctly', () => {
    const store = useChatStore.getState();
    const message = store.addMessage({
      role: 'user',
      content: 'Hello',
    });

    expect(message.id).toBeTruthy();
    expect(message.role).toBe('user');
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('should clear all messages', () => {
    const store = useChatStore.getState();
    store.addMessage({ role: 'user', content: '1' });
    store.addMessage({ role: 'assistant', content: '2' });

    store.clearMessages();

    expect(useChatStore.getState().messages).toHaveLength(0);
  });
});
```

---

## 阶段6：代码格式化和工具链（第11天）

### 目标
添加Prettier统一代码风格，配置ESLint集成。

### 6.1 Prettier配置
**新建文件**: `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "jsxSingleQuote": false
}
```

**新建文件**: `.prettierignore`
```
node_modules
dist
build
coverage
*.min.js
*.min.css
package-lock.json
```

### 6.2 ESLint整合Prettier
**修改**: `eslint.config.js`

```javascript
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  // ... 现有配置
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  prettierConfig // 必须放在最后
);
```

### 6.3 更新package.json脚本
**修改**: `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "ci": "npm run format:check && npm run lint && npm run type-check && npm run test:run && npm run build"
  }
}
```

---

## 关键文件清单

### 需要修改的文件

#### 高优先级（阶段1-3）
1. `src/hooks/useChat.ts` - 修复isFirstMessage逻辑、优化依赖数组
2. `src/hooks/useSession.ts` - 修复消息ID冲突
3. `src/components/Layout/Header.tsx` - 统一日志记录
4. `src/services/apiClient.ts` - 避免错误提示重复
5. `src/stores/sessionStore.ts` - 添加防抖保存
6. `src/utils/storage.ts` - 添加防抖函数
7. `src/components/Common/MarkdownRenderer.tsx` - 移除XSS风险
8. `vite.config.ts` - 更新配置、移除硬编码IP
9. `package.json` - 升级所有依赖

#### 中优先级（阶段4-5）
10. `src/components/Chat/MessageItem.tsx` - 添加React.memo
11. `src/components/Chat/InputBox.tsx` - 应用输入验证
12. `src/utils/validation.ts` - 新建输入验证工具

#### 低优先级（阶段6）
13. `eslint.config.js` - 整合Prettier
14. `.prettierrc.json` - 新建配置
15. `vitest.config.ts` - 新建测试配置
16. `src/tests/setup.ts` - 新建测试环境设置

### 需要新建的文件
- `.env.development` - 开发环境变量
- `.env.production` - 生产环境变量
- `src/utils/validation.ts` - 输入验证工具
- `vitest.config.ts` - 测试配置
- `src/tests/setup.ts` - 测试环境设置
- `.prettierrc.json` - Prettier配置
- `.prettierignore` - Prettier忽略文件

---

## 验证和测试清单

### 每个阶段完成后
- [ ] 运行 `npm run lint` 无错误
- [ ] 运行 `npm run type-check` 无错误
- [ ] 运行 `npm run build` 成功
- [ ] 运行 `npm run dev` 手动测试核心功能
- [ ] Git提交当前阶段变更

### 核心功能测试（手动）
- [ ] 创建新会话
- [ ] 发送消息并接收回复
- [ ] 切换会话并加载历史
- [ ] 删除会话
- [ ] 系统状态检查
- [ ] Markdown渲染（包括代码块、表格、链接）
- [ ] 错误处理（网络错误、后端错误）

### 性能测试
- [ ] 打开包含50+消息的会话，检查渲染性能
- [ ] 快速连续发送多条消息，检查防抖效果
- [ ] 检查生产构建体积（应 < 1MB gzipped）

---

## 风险和回滚策略

### 主要风险
1. **React 19兼容性问题** - 中等风险
   - 缓解：先升级到React 18.3检查警告，使用官方codemod

2. **Ant Design 6破坏性变更** - 低风险
   - 缓解：官方文档称平滑升级，提前测试所有组件

3. **Zustand 5 persist中间件** - 低风险
   - 缓解：详细阅读迁移文档，测试localStorage逻辑

### 回滚策略
```bash
# 如果某个阶段失败，回滚到前一个阶段
git log --oneline  # 查看提交历史
git reset --hard <commit-hash>  # 回滚到特定提交

# 完全回滚到重构前
git checkout main
git branch -D refactor/modernization-2025
git checkout pre-refactor-2025

# 恢复依赖
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json
npm install
```

---

## 预估时间线

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 阶段1 | 关键Bug修复 | 1-2天 |
| 阶段2 | 依赖升级 | 2-3天 |
| 阶段3 | 安全加固 | 1天 |
| 阶段4 | 性能优化 | 1-2天 |
| 阶段5 | 测试框架 | 1-2天 |
| 阶段6 | 代码格式化 | 1天 |
| **总计** | **渐进式重构** | **7-11天** |

---

## 执行顺序建议

1. **第一步**：创建重构分支和备份
   ```bash
   git checkout -b refactor/modernization-2025
   git tag pre-refactor-2025
   ```

2. **第二步**：按阶段顺序执行，每个阶段完成后提交
   ```bash
   git add .
   git commit -m "阶段1: 修复关键Bug"
   ```

3. **第三步**：每个阶段完成后进行验证测试

4. **第四步**：全部完成后合并到主分支
   ```bash
   git checkout main
   git merge refactor/modernization-2025
   ```

---

## 参考资源

- [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Ant Design 6 迁移文档](https://ant.design/docs/react/migration-v6/)
- [Zustand v5 迁移指南](https://zustand.docs.pmnd.rs/migrations/migrating-to-v5)
- [Vite 7 发布说明](https://vite.dev/releases)
- [Vitest 文档](https://vitest.dev/)
- [Prettier 文档](https://prettier.io/docs/)
