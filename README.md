# QA Agent Frontend

智能问答系统 - 前端项目

基于 React + TypeScript + Ant Design 构建的现代化聊天界面。

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **UI 库**: Ant Design 6
- **状态管理**: Zustand 5
- **HTTP 客户端**: Axios + TanStack Query (React Query)
- **Markdown 渲染**: react-markdown + rehype-sanitize + rehype-highlight
- **测试框架**: Vitest + Testing Library
- **代码格式化**: Prettier + ESLint
- **样式方案**: CSS Modules

## 功能特性

- 现代化聊天界面（类似 ChatGPT）
- 会话管理（创建、切换、删除）
- 多轮对话支持
- Markdown 消息渲染（支持代码高亮、表格等）
- 数据源标签显示（知识库、SQL、API、对话）
- 实时加载状态和错误处理
- 自动滚动到最新消息
- 响应式布局（支持移动端）
- 主题系统：浅色/深色/跟随系统，CSS 变量驱动，所有组件完整适配
- 本地会话持久化（防抖优化）
- 生产级日志系统
- XSS 防护和输入验证
- 思考流（SSE）展示：路由决策、工具调用/结果、LLM 思考过程流式呈现
- 停止生成与降级：支持中断 SSE，失败自动回退到一次性响应
- React.memo 性能优化
- 文档管理：文档列表展示、上传（支持 PDF/Markdown）、标签分类、文件信息查看
- 系统信息监控：系统健康状态、LLM 提供商信息、向量库统计一体化展示
- 数据库查询工具：支持按数据库名称和来源查询数据库元信息

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
# 启动开发服务器（默认: http://localhost:3000）
# npm run dev #前台运行

# pm2后台运行  # npm i -g pm2 安装pm2
pm2 start ecosystem.config.cjs
pm2 logs qa-frontend-dev

# pm2 stop qa-frontend-dev
# pm2 delete qa-frontend-dev

# 运行 ESLint 检查
npm run lint

# 自动修复 ESLint 问题
npm run lint:fix

# 格式化代码
npm run format
```

开发服务器会自动代理 `/api` 请求到后端（配置在 `.env.development`）

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

构建产物位于 `dist/` 目录，代码自动分割为多个 chunks 以优化加载性能。

## 项目结构

```
frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── Chat/           # 聊天相关组件
│   │   │   ├── ChatContainer.tsx      # 聊天容器
│   │   │   ├── MessageList.tsx        # 消息列表
│   │   │   ├── MessageItem.tsx        # 消息项
│   │   │   └── InputBox.tsx           # 输入框
│   │   ├── Sidebar/        # 侧边栏组件
│   │   │   ├── SessionList.tsx        # 会话列表
│   │   │   └── SessionItem.tsx        # 会话项
│   │   ├── Layout/         # 布局组件
│   │   │   ├── AppLayout.tsx          # 主布局
│   │   │   └── Header.tsx             # 顶部栏
│   │   └── Common/         # 通用组件
│   │       ├── MarkdownRenderer.tsx   # Markdown 渲染
│   │       ├── SourceTag.tsx          # 数据源标签
│   │       ├── LoadingDots.tsx        # 加载动画
│   │       ├── ThemeToggle.tsx        # 主题切换器
│   │       ├── SettingsModal.tsx      # 设置弹窗
│   │       ├── DocumentManagement.tsx # 文档管理
│   │       ├── UploadDocumentModal.tsx # 文档上传
│   │       ├── DatabaseQuery.tsx      # 数据库查询
│   │       └── SystemInfoModal.tsx    # 系统信息
│   ├── services/           # API 服务
│   │   ├── apiClient.ts               # Axios 封装
│   │   ├── chatApi.ts                 # 聊天 API
│   │   ├── documentApi.ts             # 文档 API
│   │   └── systemApi.ts               # 系统 API
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useChat.ts                 # 聊天逻辑
│   │   ├── useSession.ts              # 会话管理
│   │   └── useAutoScroll.ts           # 自动滚动
│   ├── stores/             # Zustand 状态管理
│   │   ├── chatStore.ts               # 聊天状态
│   │   ├── sessionStore.ts            # 会话状态
│   │   └── themeStore.ts              # 主题状态
│   ├── theme/              # 主题配置
│   │   ├── darkTheme.ts               # 深色主题（AntD Token + CSS 变量）
│   │   ├── lightTheme.ts              # 浅色主题（AntD Token + CSS 变量）
│   │   ├── tokens.ts                  # 共享设计 Token
│   │   └── index.ts                   # 主题导出
│   ├── types/              # TypeScript 类型
│   │   ├── message.ts
│   │   ├── session.ts
│   │   └── api.ts
│   ├── utils/              # 工具函数
│   │   ├── logger.ts                  # 日志工具
│   │   ├── storage.ts                 # 本地存储（防抖优化）
│   │   ├── validation.ts              # 输入验证
│   │   └── helpers.ts                 # 辅助函数
│   ├── config/             # 配置
│   │   └── index.ts
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── public/                 # 静态资源
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 环境变量配置

注意：后端接口(除了/health)统一以 `/api` 前缀暴露，请确保 `VITE_API_BASE_URL` 与 endpoint 拼接后不要出现重复的 `/api`。

### 开发环境 (`.env.development`)

```env
# API配置
VITE_API_BASE_URL=http://192.168.50.11:8006/api/

# 对话接口路径（会与 base URL 拼接）
VITE_CHAT_ENDPOINT=/api/chat

# 应用配置
VITE_APP_TITLE=智能问答系统 [开发]

# 日志级别
VITE_LOG_LEVEL=debug

# 功能开关
VITE_ENABLE_MOCK=false

# 思考流配置
VITE_ENABLE_THINKING_STREAM=true
VITE_STREAM_ENDPOINT=/api/react_stream
VITE_STREAM_HEARTBEAT_TIMEOUT=30000
VITE_THINKING_PREVIEW_MAX_LENGTH=500
```

### 生产环境 (`.env.production`)

```env
# API配置 - 生产环境使用相对路径
VITE_API_BASE_URL=/api

# 对话接口路径（会与 base URL 拼接）
VITE_CHAT_ENDPOINT=/api/chat

# 应用配置
VITE_APP_TITLE=智能问答系统

# 日志级别
VITE_LOG_LEVEL=error

# 思考流配置
VITE_ENABLE_THINKING_STREAM=true
VITE_STREAM_ENDPOINT=/api/react_stream
VITE_STREAM_HEARTBEAT_TIMEOUT=30000
VITE_THINKING_PREVIEW_MAX_LENGTH=500
```

## 核心功能说明

### 1. 会话管理

- **创建会话**: 点击"新对话"按钮
- **切换会话**: 点击侧边栏中的会话项
- **删除会话**: 鼠标悬停在会话上，点击删除按钮
- **会话持久化**: 自动保存到浏览器 LocalStorage

### 2. 消息发送

- 输入框支持多行输入（自动调整高度）
- 快捷键: `Ctrl/Cmd + Enter` 发送消息
- 字符限制: 10,000 字符

### 3. 消息渲染

- 支持 Markdown 格式（GitHub Flavored Markdown）
- 代码高亮（使用 highlight.js）
- 表格渲染
- 链接自动在新窗口打开
- XSS 防护（使用 rehype-sanitize）
- 仅允许安全的 URL 协议（http/https/mailto）

### 4. 数据源显示

每条助手回答会显示数据来源标签：
- 📚 知识库 - RAG 引擎检索的文档
- 🗄️ 数据库 - SQL 查询结果
- 🔌 实时数据 - API 接口数据
- 💬 对话 - 通用对话

### 5. 系统信息监控

点击顶部的"系统状态"按钮可查看一体化系统信息：
- **系统状态**：Ollama 服务健康状态、当前模型信息
- **LLM 提供商**：配置的语言模型提供商详情
- **向量库状态**：向量数据库统计信息（文档数量、集合信息等）

### 6. 文档管理

在设置弹窗的"文档管理"标签页中，可以：
- **查看文档列表**：显示所有已上传的文档，包含文件名、标签、类型、大小、修改时间、存储位置
- **上传文档**：
  - 支持 PDF 和 Markdown 格式
  - 拖拽或点击上传
  - 选择文档标签分类（通用、技术、操作、维护、安全）
  - 实时显示上传进度和处理状态
  - 异步处理：上传后自动预处理和索引
- **文档信息**：查看文件详情（大小、修改时间、存储路径）
- **标签筛选**：按文档类型快速筛选
- **主题适配**：完整支持浅色/深色主题

### 7. 数据库查询工具

在设置弹窗的"数据库"标签页中，可以：
- **查询数据库信息**：输入数据库名称和数据源进行查询
- **查看元信息**：以 JSON 格式展示数据库结构和元数据
- **实时查询**：点击查询按钮即时获取最新信息
- **主题适配**：查询结果展示适配浅色/深色主题，确保可读性

## API 集成

前端通过 Axios 与后端通信，主要接口：

### 聊天接口

使用 `VITE_CHAT_ENDPOINT` 配置（与 `VITE_API_BASE_URL` 拼接）。

```typescript
POST /api/chat
{
  "query": "用户问题",
  "session_id": "会话ID（可选）",
  "reset": true
}
```

### 会话管理

```typescript
POST /api/chat (reset=true)       # 创建会话（不传 session_id）
GET /api/context/{session_id}/info    # 获取历史
DELETE /api/context/{session_id}      # 删除会话
POST /api/context/{session_id}/refresh # 刷新会话
```

#### 历史对话解析（Context）

入口：`GET /api/context/{session_id}/info`（`VITE_CONTEXT_INFO_ENDPOINT`）。

解析流程：
1. `context.ctx_json` 为 JSON 字符串，先反序列化为对象。
2. 读取 `ctx.state.state_data._data.memory`（字符串），再次反序列化。
3. 从 `value.chat_store.store[chat_store_key]` 取出历史数组（`chat_store_key` 缺省为 `chat_history`）。

消息结构与展示规则（见 `src/services/chatApi.ts`）：
1. 消息结构：`{ role, additional_kwargs, blocks: [{ block_type: "text", text }] }`
2. 仅展示 `role` 为 `user` / `assistant` 的消息，忽略 `tool`。
3. `content` 取 `blocks[].text` 并用 `\n` 连接。
4. 用户消息若包含 `[用户查询]`，仅展示该标记后的内容；否则原样展示。
5. 时间戳取 `additional_kwargs.timestamp`（number），缺失则用当前时间兜底。

### 思考流（SSE）

- 端点：默认 `VITE_STREAM_ENDPOINT=/api/react_stream`，与 `VITE_API_BASE_URL` 拼接。
- 请求体：与 `/api/chat` 相同，额外支持 `stream_thoughts=true`。
- 事件类型：`meta.start`、`router.decision`、`memory.inject`、`thought`、`tool_call`、`tool_result`、`fallback`、`final`、`error`、`heartbeat`。
- 前端行为：实时展示思考轨迹，超时/错误自动降级到一次性响应；"停止"按钮通过 AbortController 终止流。
- 长内容截断：工具结果 `preview` 按 `VITE_THINKING_PREVIEW_MAX_LENGTH` 截断，避免撑爆 UI。

### 文档管理

```typescript
GET /api/documents                    # 获取文档列表
POST /api/documents/upload            # 上传文档（multipart/form-data）
  - file: File                        # 文件对象
  - label: string                     # 文档标签（general/technical/operation/maintenance/safety）
GET /api/documents/upload_status/{task_id}  # 查询上传状态
DELETE /api/documents/{filename}      # 删除文档
```

文档上传流程：
1. 客户端通过 POST `/api/documents/upload` 上传文件和标签
2. 服务器返回 `task_id`
3. 客户端轮询 GET `/api/documents/upload_status/{task_id}` 查询处理进度
4. 状态包括：`pending`（等待）、`preprocessing`（预处理中）、`indexing`（索引中）、`completed`（完成）、`failed`（失败）

### 系统信息

```typescript
GET /health                          # 系统健康检查（不带 /api 前缀）
  - 返回：系统状态、Ollama 连接、模型信息

GET /api/stats                       # 系统统计信息
  - 返回：LLM 提供商、向量库统计、系统配置
```

### 数据库查询

```typescript
GET /api/database/info?db_name={name}&db_source={source}  # 查询数据库信息
  - 参数：
    - db_name: 数据库名称（可选）
    - db_source: 数据源标识（可选）
  - 返回：数据库元信息（表结构、统计信息等）
```

## 开发指南

### 添加新组件

1. 在 `src/components/` 下创建组件文件夹
2. 创建 `.tsx` 和 `.module.css` 文件
3. 在 `index.ts` 中导出组件

示例：

```typescript
// src/components/MyComponent/MyComponent.tsx
import React from 'react';
import styles from './MyComponent.module.css';

export const MyComponent: React.FC = () => {
  return <div className={styles.container}>Hello</div>;
};

// src/components/MyComponent/index.ts
export { MyComponent } from './MyComponent';
```

### 添加新的 API 接口

1. 在 `src/types/api.ts` 中定义类型
2. 在 `src/services/` 中创建 API 函数
3. 在组件中使用

示例：

```typescript
// src/services/myApi.ts
import apiClient from './apiClient';

export const myApi = {
  async getData(): Promise<DataResponse> {
    return apiClient.get<DataResponse>('/my-endpoint');
  }
};
```

### 日志记录

使用 `logger` 工具记录关键操作：

```typescript
import logger from '@/utils/logger';

logger.info('User action', { userId: 123 });
logger.error('API failed', error);
```

日志级别：
- `debug` - 开发调试信息
- `info` - 一般信息
- `warn` - 警告
- `error` - 错误

## 代码规范

- **命名规范**: PascalCase (组件), camelCase (函数/变量)
- **代码风格**: ESLint + TypeScript 严格模式
- **组件模式**: 函数式组件 + Hooks
- **导出方式**: 通过 `index.ts` 统一导出
- **路径引用**: 使用 `@/` 别名代替相对路径

## 样式指南

- 使用 CSS Modules 避免样式冲突
- 遵循 Ant Design 设计规范
- 主题色由 `src/theme/lightTheme.ts` 与 `src/theme/darkTheme.ts` 中的 `colorPrimary` 控制
- 响应式断点:
  - 移动端: `< 768px`
  - 平板: `768px - 1024px`
  - 桌面: `> 1024px`

### 主题与 CSS 变量

- 主题 Token：`src/theme/*Theme.ts`，在 `App.tsx` 中由 `ConfigProvider` 注入
- CSS 变量：`lightCSSVars`/`darkCSSVars` 会写入到 `:root`，并设置 `data-theme` 用于主题特定样式
- 发送按钮背景色：通过 `--btn-send-bg`、`--btn-send-hover-bg`、`--btn-send-active-bg` 单独配置（默认继承 `--btn-primary-*`）

## 性能优化

- 使用 React.memo 优化核心组件渲染（MessageItem、MarkdownRenderer）
- 防抖优化 sessionStore 本地存储写入
- 优化 useCallback 依赖数组，避免不必要的重渲染
- 代码分割（vendor、antd、markdown 独立 chunks）
- 生产构建体积优化（gzip 后总计约 327 KB）

## 部署

### 1. 独立部署

```bash
# 构建
npm run build

# 部署 dist/ 目录到静态服务器（Nginx、Vercel 等）
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 集成到 Flask

将构建产物复制到 Flask 静态目录：

```bash
npm run build
cp -r dist/* ../static/
```

## 故障排查

### 问题: 无法连接到后端

检查：
1. 后端服务是否启动（`http://localhost:5000`）
2. CORS 配置是否正确
3. 环境变量 `VITE_API_BASE_URL` 是否正确

### 问题: 会话丢失

会话保存在 LocalStorage 中，检查：
1. 浏览器是否禁用了 LocalStorage
2. 隐私模式/无痕模式会清除数据

### 问题: Markdown 渲染错误

确保安装了依赖：
```bash
npm install react-markdown rehype-highlight rehype-sanitize remark-gfm
```

### 问题: 构建失败

尝试以下步骤：
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 如果是 macOS arm64 架构的 rollup 问题
rm -rf node_modules package-lock.json
npm install
```

## 已知问题

1. **会话标题生成**: 当前使用首条消息前30个字符，可以优化为 LLM 生成更友好的标题
2. **消息重发**: 暂未实现重新生成功能
3. **部分浏览器兼容**: 老旧浏览器或特定代理环境下 SSE 可能被拦截，无法展示思考流，会自动降级为一次性响应
4. **文档删除**: 文档列表暂未提供删除功能入口（API 已支持）

## 安全性

- XSS 防护：使用 `rehype-sanitize` 过滤恶意 HTML
- URL 验证：仅允许 http/https/mailto 协议
- 输入验证：限制输入长度（10,000 字符）
- 依赖安全：定期更新依赖，无已知漏洞
- 错误处理：避免敏感信息泄露

## 测试

```bash
# 运行所有测试
npm run test

# 交互式测试 UI
npm run test:ui

# 单次运行测试
npm run test:run

# 测试覆盖率
npm run test:coverage
```

测试文件位于 `src/**/__tests__/` 目录。
