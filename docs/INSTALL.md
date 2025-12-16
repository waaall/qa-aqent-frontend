# 安装指南

## 前置要求

### 必需

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (或 yarn >= 1.22.0)

### 推荐

- **VS Code** + 以下扩展:
  - ESLint
  - TypeScript and JavaScript Language Features
  - Prettier

## 安装步骤

### 1. 检查 Node.js 版本

```bash
node --version  # 应该 >= v18.0.0
npm --version   # 应该 >= 9.0.0
```

如果版本过低，请先升级 Node.js：
- 官方下载: https://nodejs.org/
- 使用 nvm: `nvm install 18`

### 2. 进入前端目录

```bash
cd /Volumes/ll-data/qa-agent/frontend
```

### 3. 安装依赖

使用 npm（推荐）:
```bash
npm install
```

或使用 yarn:
```bash
yarn install
```

**预计时间**: 2-3 分钟（取决于网络速度）

### 4. 验证安装

```bash
npm run dev
```

如果看到以下输出，说明安装成功：

```
  VITE v5.0.0  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

按 `Ctrl+C` 停止开发服务器。

## 常见问题

### Q1: npm install 失败

**错误**: `EACCES` 权限错误

**解决**:
```bash
sudo chown -R $USER:$(id -gn $USER) ~/.npm
```

**错误**: `ERESOLVE` 依赖冲突

**解决**:
```bash
npm install --legacy-peer-deps
```

### Q2: Node.js 版本过低

**解决**: 使用 nvm 管理 Node.js 版本

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 18
nvm install 18
nvm use 18
```

### Q3: 端口 3000 被占用

**解决**: 修改 `vite.config.ts` 中的端口

```typescript
export default defineConfig({
  server: {
    port: 3001, // 改为其他端口
  },
});
```

### Q4: 网络慢，下载缓慢

**解决**: 使用国内镜像

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm install

# 恢复官方源（可选）
npm config set registry https://registry.npmjs.org
```

## 依赖说明

### 生产依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| react | ^18.2.0 | UI 框架 |
| react-dom | ^18.2.0 | React DOM 渲染 |
| antd | ^5.12.0 | UI 组件库 |
| axios | ^1.6.0 | HTTP 客户端 |
| zustand | ^4.4.0 | 状态管理 |
| @tanstack/react-query | ^5.12.0 | 数据获取 |
| react-markdown | ^9.0.0 | Markdown 渲染 |
| dayjs | ^1.11.0 | 时间处理 |

### 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| typescript | ^5.2.2 | TypeScript 编译器 |
| vite | ^5.0.0 | 构建工具 |
| @vitejs/plugin-react | ^4.2.0 | React 插件 |
| eslint | ^8.55.0 | 代码检查 |

## 验证清单

安装完成后，请验证以下内容：

- [ ] `node_modules/` 目录存在
- [ ] 所有依赖安装成功（无错误）
- [ ] `npm run dev` 可以启动开发服务器
- [ ] 浏览器访问 `http://localhost:3000` 显示页面
- [ ] 控制台无错误信息

## 下一步

1. **启动后端服务**
   ```bash
   cd ..
   python app.py
   ```

2. **启动前端开发服务器**
   ```bash
   cd frontend
   npm run dev
   ```

3. **开始开发**
   - 阅读 [README.md](./README.md) 了解项目功能
   - 阅读 [DEVELOPMENT.md](./DEVELOPMENT.md) 了解开发规范
   - 查看 [QUICKSTART.md](./QUICKSTART.md) 快速上手

## 卸载

如需完全卸载：

```bash
# 删除 node_modules
rm -rf node_modules

# 删除 package-lock.json
rm package-lock.json

# 删除构建产物
rm -rf dist
```

## 获取帮助

- 查看文档: [README.md](./README.md)
- 查看问题: 浏览器控制台
- 提交 Issue: GitHub Issues

---

祝您使用愉快！🎉
