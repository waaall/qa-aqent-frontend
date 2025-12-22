# 开发指南

## 开发环境设置

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

### 3. 确保后端运行

前端需要后端 API 支持，确保后端服务运行在 `http://localhost:5000`

## 代码规范

### TypeScript

- 所有组件使用 TypeScript
- 定义清晰的接口和类型
- 避免使用 `any` 类型

### 组件结构

```typescript
// 推荐的组件结构
import React from 'react';
import styles from './Component.module.css';

interface ComponentProps {
  // 定义 props 类型
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // 组件逻辑
  return <div className={styles.container}>Content</div>;
};
```

### 命名约定

- 组件: PascalCase (`MessageItem`, `ChatContainer`)
- 文件: PascalCase (`MessageItem.tsx`)
- 样式: camelCase (`messageItem.module.css`)
- Hooks: camelCase, 以 `use` 开头 (`useChat`, `useSession`)
- 工具函数: camelCase (`formatTime`, `generateId`)

### CSS Modules

- 使用 CSS Modules 避免样式冲突
- 类名使用 camelCase
- 避免嵌套过深（最多 3 层）

## 状态管理

### Zustand Store

使用 Zustand 进行全局状态管理：

```typescript
import { create } from 'zustand';

interface MyState {
  data: string[];
  addData: (item: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  addData: (item) => set((state) => ({
    data: [...state.data, item]
  })),
}));
```

### 本地状态

简单的组件状态使用 `useState`：

```typescript
const [isOpen, setIsOpen] = useState(false);
```

## API 调用

注：后端多数接口(除了/health)统一以 `/api` 前缀暴露，请确保 `VITE_API_BASE_URL` 与 endpoint 拼接后不要出现重复的 `/api`。

### 使用 API Service

不要直接在组件中调用 axios，使用封装的 API service：

```typescript
// ❌ 不推荐
axios.post('/api/chat', data);

// 推荐
import { chatApi } from '@/services';
chatApi.sendMessage(data);
```

### 错误处理

所有 API 调用都应该处理错误：

```typescript
try {
  const response = await chatApi.sendMessage(data);
  // 处理成功
} catch (error) {
  logger.error('Failed to send message', error);
  message.error('发送失败');
}
```

## 日志记录

### 日志级别

- `debug`: 开发调试信息
- `info`: 关键操作（用户行为、API 调用）
- `warn`: 警告信息
- `error`: 错误信息

### 使用示例

```typescript
import logger from '@/utils/logger';

// 记录用户操作
logger.info('User sent message', { query: userInput });

// 记录 API 调用
logger.debug('API Request', { url, params });

// 记录错误
logger.error('API failed', error);
```

### 生产环境

生产环境只记录 `error` 级别日志（通过 `.env.production` 配置）

## 测试

### 运行测试（待实现）

```bash
npm run test
```

### 测试建议

- 单元测试: 工具函数、Hooks
- 集成测试: API 服务
- E2E 测试: 关键用户流程

## 性能优化

### React.memo

对频繁渲染的组件使用 `React.memo`：

```typescript
export const MessageItem = React.memo<MessageItemProps>(({ message }) => {
  // ...
});
```

### useCallback 和 useMemo

缓存函数和计算结果：

```typescript
const handleSend = useCallback(() => {
  sendMessage(input);
}, [input, sendMessage]);

const filteredMessages = useMemo(() => {
  return messages.filter(m => !m.isLoading);
}, [messages]);
```

### 代码分割

大型组件使用动态导入：

```typescript
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

## 调试技巧

### React DevTools

安装 React DevTools 浏览器扩展查看组件树和 props

### Zustand DevTools

在开发环境启用 Zustand DevTools：

```typescript
import { devtools } from 'zustand/middleware';

export const useStore = create(
  devtools((set) => ({
    // state
  }))
);
```

### 网络请求

使用浏览器 Network 面板查看 API 请求和响应

## 常见问题

### Q: 组件不更新

A: 检查：
1. 状态是否正确更新（不要直接修改对象/数组）
2. 依赖数组是否正确（useEffect, useCallback）
3. 是否需要使用 React.memo

### Q: 样式不生效

A: 检查：
1. CSS Module 导入是否正确
2. 类名是否拼写错误
3. 样式优先级

### Q: API 请求失败

A: 检查：
1. 后端服务是否运行
2. CORS 配置
3. 请求 URL 是否正确
4. 请求参数格式

## Git 工作流

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - bug 修复
- `refactor/xxx` - 重构
- `docs/xxx` - 文档

### Commit 消息

遵循 Conventional Commits：

```
feat: 添加文档上传功能
fix: 修复会话切换bug
refactor: 重构消息渲染逻辑
docs: 更新 README
```

### Pull Request

1. 创建分支
2. 开发功能
3. 自测通过
4. 创建 PR
5. Code Review
6. 合并到 main

## 发布流程

1. 更新版本号 (`package.json`)
2. 更新 CHANGELOG
3. 构建生产版本 (`npm run build`)
4. 测试生产构建
5. 创建 Git tag
6. 部署

## 资源链接

- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Ant Design 文档](https://ant.design/)
- [Vite 文档](https://vitejs.dev/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
