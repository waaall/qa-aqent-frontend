# 项目文档

## 项目截图说明

### 访问地址
- 开发环境：http://localhost:3000
- 网络访问：http://21.0.0.160:3000

### 应用信息
- 项目名称：电厂智能问答系统 (QA Agent Frontend)
- 技术栈：React 19 + TypeScript + Vite 7 + Ant Design 6

### 如何截图

#### 方法一：手动截图
1. 启动开发服务器：`npm run dev`
2. 在浏览器中打开：http://localhost:3000
3. 使用浏览器截图工具或系统截图工具截取界面
4. 保存截图到 `docs/screenshots/` 文件夹

#### 方法二：使用自动截图脚本
1. 安装 puppeteer：`npm install -D puppeteer`
2. 运行截图脚本：`node docs/screenshot.js`
3. 截图将自动保存到 `docs/screenshots/` 文件夹

### 截图脚本说明
脚本会自动：
- 启动 headless 浏览器
- 访问本地开发服务器
- 捕获全页面截图
- 保存为 `app-screenshot-[timestamp].png`

---

## 技术栈详情

### 核心框架
- **React 19.0.0** - 最新版本的 UI 框架
- **TypeScript 5.7.2** - 静态类型检查
- **Vite 7.3.0** - 新一代构建工具

### UI 组件
- **Ant Design 6.1.0** - 企业级 UI 组件库
- **@ant-design/icons** - 图标库

### 状态管理
- **Zustand 5.0.2** - 轻量级状态管理
- **@tanstack/react-query 5.62.11** - 服务器状态管理

### 其他依赖
- **Axios 1.7.9** - HTTP 客户端
- **react-markdown 10.0.0** - Markdown 渲染
- **dayjs 1.11.13** - 日期处理

## 项目结构

```
qa-aqent-frontend/
├── src/
│   ├── components/      # React 组件
│   ├── stores/          # Zustand 状态管理
│   ├── services/        # API 服务
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   └── config/          # 配置文件
├── docs/                # 项目文档
│   ├── screenshots/     # 截图目录
│   ├── README.md        # 文档说明
│   └── screenshot.js    # 自动截图脚本
└── package.json
```

## 开发命令

```bash
npm install          # 安装依赖
npm run dev         # 启动开发服务器
npm run build       # 构建生产版本
npm run preview     # 预览生产构建
npm run lint        # 代码检查
npm run test        # 运行测试
```
