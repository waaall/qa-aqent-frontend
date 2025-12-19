# 项目截图目录

## 说明

此目录用于存放项目运行时的页面截图。

## 自动生成截图

要生成项目截图，请按以下步骤操作：

### 步骤 1：启动开发服务器
```bash
npm run dev
```

### 步骤 2：运行截图脚本

#### 选项 A：使用 Puppeteer（推荐）
```bash
# 安装 Puppeteer
npm install -D puppeteer

# 运行截图脚本
node docs/screenshot.js
```

#### 选项 B：手动截图
1. 在浏览器中打开：http://localhost:3000
2. 使用浏览器开发者工具或截图工具截取页面
3. 保存到此目录

## 截图命名规范

- 自动生成的截图格式：`app-screenshot-YYYY-MM-DDTHH-MM-SS.png`
- 最新截图：`latest.png`
- 功能截图：可使用描述性名称，如 `chat-interface.png`、`sidebar.png` 等

## 项目信息

- **项目名称**：电厂智能问答系统 (QA Agent Frontend)
- **访问地址**：http://localhost:3000
- **技术栈**：React 19 + TypeScript + Vite 7 + Ant Design 6

## 当前状态

✅ 开发服务器运行正常
✅ 页面标题：电厂智能问答系统
✅ 端口：3000

---

**注意**：由于环境限制，自动截图需要在有图形界面的环境中运行。如果您在无头服务器上，请在本地开发环境中运行截图脚本。
