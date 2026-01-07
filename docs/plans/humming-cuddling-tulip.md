# Tauri V2 桌面应用包装实施计划

## 方案概述

将现有 Vite + React + TypeScript 项目包装为 Tauri V2 跨平台桌面应用，支持用户自定义后端地址配置、本地文件操作和系统托盘功能。

**核心设计原则**：
- ✅ 最小化业务代码修改（仅修改 4 个现有文件）
- ✅ 通过环境检测保持 Web 版本兼容
- ✅ 基于 Tauri V2 ACL/Capability 系统实现细粒度权限控制
- ✅ 渐进式实施，每个阶段可独立验证

**技术决策**：
- **后端配置存储**: Tauri Store 插件（支持加密，比 localStorage 更安全）
- **文件操作**: Tauri Dialog + FS 插件
- **系统集成**: 托盘（Windows/Linux 最小化到托盘，macOS 遵循平台规范）+ 通知
- **IPC 架构**: Rust Commands（同步调用）
- **目标平台**: macOS (Intel + Apple Silicon)、Windows 64-bit、Linux (AppImage/deb)

---

## 分阶段实施计划（5 阶段，预计 15 工作日）

### 阶段 1：基础搭建（1-2 天）

**目标**: 完成 Tauri 项目初始化，能够启动桌面应用

#### 任务清单

1. **安装 Rust 工具链**（如果尚未安装）
   ```bash
   # macOS/Linux
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # Windows
   # 从 https://rustup.rs 下载安装器
   ```

2. **安装 Tauri CLI 和前端依赖**
   ```bash
   npm install --save-dev @tauri-apps/cli
   npm install @tauri-apps/api @tauri-apps/plugin-store @tauri-apps/plugin-dialog @tauri-apps/plugin-fs @tauri-apps/plugin-notification @tauri-apps/plugin-shell
   ```

3. **初始化 Tauri 项目**
   ```bash
   npm run tauri init
   ```

   初始化配置：
   - App name: `电厂智能问答系统`
   - Window title: `电厂智能问答系统`
   - Web assets location: `../dist`
   - Dev server URL: `http://localhost:3000`
   - Dev command: `npm run dev`
   - Build command: `npm run build`

4. **创建 `src-tauri/` 目录结构**
   ```
   src-tauri/
   ├── src/
   │   ├── main.rs
   │   ├── lib.rs
   │   ├── commands/
   │   │   ├── mod.rs
   │   │   ├── config.rs
   │   │   ├── file.rs
   │   │   └── system.rs
   │   ├── menu.rs
   │   └── utils.rs
   ├── Cargo.toml
   ├── tauri.conf.json
   ├── capabilities/
   │   └── main.json
   └── build.rs
   ```

5. **配置 `Cargo.toml`**（添加 Tauri 插件依赖）

6. **配置 `tauri.conf.json`**
   - 设置 `identifier`: `com.powerplant.qa-agent`
   - 配置 `build.devUrl`: `http://localhost:3000`
   - 配置 `build.frontendDist`: `../dist`
   - 配置 CSP 策略（允许连接后端服务器）
   - 启用托盘图标

7. **创建基础 `main.rs`**（最小化可运行版本）

8. **更新 `package.json` 脚本**
   ```json
   {
     "scripts": {
       "tauri": "tauri",
       "tauri:dev": "tauri dev",
       "tauri:build": "tauri build"
     }
   }
   ```

9. **运行开发模式验证**
   ```bash
   npm run tauri:dev
   ```

#### 验收标准
- [ ] 能够成功启动 Tauri 开发窗口
- [ ] 现有前端页面正常显示（聊天界面、会话列表等）
- [ ] 浏览器控制台无致命错误
- [ ] Rust 编译通过

#### 关键文件
- `/Users/zhengxu/Desktop/frontend/src-tauri/Cargo.toml`
- `/Users/zhengxu/Desktop/frontend/src-tauri/tauri.conf.json`
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/main.rs`
- `/Users/zhengxu/Desktop/frontend/package.json`

---

### 阶段 2：后端配置功能（2-3 天）

**目标**: 实现用户可配置后端地址，支持连接测试和持久化

#### 任务清单

1. **实现 Rust 配置管理命令**

   创建 `src-tauri/src/commands/config.rs`：
   - `get_backend_url()`: 从 Tauri Store 读取后端地址
   - `set_backend_url(url)`: 保存后端地址到 Tauri Store
   - `test_backend_connection(url)`: 测试后端健康检查（HTTP GET /health）

   默认后端地址: `http://192.168.50.50:5000`

2. **创建前端 Tauri 封装层**

   创建 `src/lib/tauri/` 目录：
   - `environment.ts`: 环境检测（`isTauriEnv()`, `getPlatform()`）
   - `commands.ts`: IPC 命令封装（调用 Rust Commands）
   - `types.ts`: TypeScript 类型定义
   - `index.ts`: 统一导出

3. **修改 `src/services/apiClient.ts`**

   关键改动：
   ```typescript
   // 在文件顶部添加
   import { isTauriEnv, getBackendUrl } from '@/lib/tauri';

   class ApiClient {
     private instance: AxiosInstance;
     private baseURL: string = config.apiBaseUrl;

     constructor() {
       this.init(); // 改为异步初始化
     }

     private async init() {
       // Tauri 环境下从 Store 加载配置
       if (isTauriEnv()) {
         this.baseURL = await getBackendUrl();
       }

       this.instance = axios.create({
         baseURL: this.baseURL,
         // ... 其他配置
       });

       this.setupInterceptors();
     }

     // 新增：运行时更新 baseURL
     public updateBaseURL(url: string) {
       this.baseURL = url;
       this.instance.defaults.baseURL = url;
     }
   }
   ```

4. **创建后端配置组件**

   创建 `src/components/Settings/BackendConfig.tsx`：
   - 输入框：输入后端地址
   - "测试连接"按钮：调用 `testBackendConnection()`
   - "保存"按钮：调用 `setBackendUrl()` 并更新 `apiClient.updateBaseURL()`
   - 连接状态显示：成功/失败图标

5. **集成到设置界面**

   修改 `src/components/Common/SettingsModal.tsx`（或类似文件）：
   - 仅在 Tauri 环境下显示"后端配置"选项卡
   - 使用条件渲染：
     ```typescript
     const tabItems = [
       ...(isTauriEnv() ? [{
         key: 'backend',
         label: '后端配置',
         children: <BackendConfig />
       }] : []),
       // ... 其他选项卡
     ];
     ```

6. **创建 `.env.tauri` 环境变量文件**（可选）
   ```bash
   VITE_API_BASE_URL=http://192.168.50.50:5000
   VITE_APP_TITLE=电厂智能问答系统 [桌面版]
   ```

#### 验收标准
- [ ] 设置界面能够显示当前后端地址（从 Tauri Store 读取）
- [ ] 可以修改后端地址并保存（持久化到 Tauri Store）
- [ ] "测试连接"功能正常工作（显示成功/失败状态）
- [ ] 重启应用后配置保持不变
- [ ] Web 版本不受影响（不显示后端配置选项卡）
- [ ] 修改后端地址后，API 请求使用新地址

#### 关键文件
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/commands/config.rs` (新建)
- `/Users/zhengxu/Desktop/frontend/src/lib/tauri/environment.ts` (新建)
- `/Users/zhengxu/Desktop/frontend/src/lib/tauri/commands.ts` (新建)
- `/Users/zhengxu/Desktop/frontend/src/components/Settings/BackendConfig.tsx` (新建)
- `/Users/zhengxu/Desktop/frontend/src/services/apiClient.ts` (修改)
- `/Users/zhengxu/Desktop/frontend/src/components/Common/SettingsModal.tsx` (修改，如果存在)

---

### 阶段 3：文件操作集成（1-2 天）

**目标**: 实现聊天记录导出和文档上传的原生文件选择器

#### 任务清单

1. **实现 Rust 文件操作命令**

   创建 `src-tauri/src/commands/file.rs`：
   - `save_chat_history(messages, filename)`: 打开保存对话框，导出聊天记录为 JSON
   - `select_file(filters)`: 打开文件选择对话框，返回文件路径
   - `export_to_json(data, filename)`: 通用 JSON 导出功能

2. **封装前端文件操作 API**

   在 `src/lib/tauri/commands.ts` 中添加：
   - `fileSaveDialog(messages, filename)`: 封装保存对话框（Web 环境回退到浏览器下载）
   - `fileOpenDialog(filters)`: 封装文件选择（Web 环境回退到 `<input type="file">`）

3. **在聊天界面添加导出功能**（可选）

   - 在消息列表右上角添加"导出记录"按钮
   - 点击后调用 `fileSaveDialog()` 导出当前会话的所有消息
   - 文件名格式: `chat_history_YYYYMMDD_HHMMSS.json`

4. **在文档上传界面集成原生选择器**（可选）

   - 替换 `<Upload>` 组件的文件选择为原生对话框
   - 在 Tauri 环境下调用 `fileOpenDialog(['.pdf', '.md'])`

#### 验收标准
- [ ] 聊天记录可以导出为 JSON 文件（使用原生保存对话框）
- [ ] 文件选择器使用原生对话框（Tauri 环境）
- [ ] Web 版本回退到浏览器下载和 `<input>` 上传
- [ ] 导出的 JSON 文件格式正确（包含所有消息字段）

#### 关键文件
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/commands/file.rs` (新建)
- `/Users/zhengxu/Desktop/frontend/src/lib/tauri/commands.ts` (修改，添加文件操作封装)

---

### 阶段 4：系统集成功能（2-3 天）

**目标**: 实现系统托盘和通知功能

#### 任务清单

1. **实现系统托盘菜单**

   创建 `src-tauri/src/menu.rs`：
   - 托盘图标：使用 `icons/icon.png`
   - 菜单项：
     - "显示窗口"：调用 `window.show()` + `window.set_focus()`
     - "隐藏窗口"：调用 `window.hide()`
     - 分隔线
     - "退出"：调用 `std::process::exit(0)`
   - 左键点击托盘图标：显示窗口

2. **配置窗口关闭行为**

   在 `main.rs` 中监听 `WindowEvent::CloseRequested`：
   - **Windows/Linux**: 最小化到托盘（`window.hide()` + `api.prevent_close()`）
   - **macOS**: 退出应用（遵循平台规范，不阻止关闭）

3. **实现系统通知**

   在 `src/lib/tauri/commands.ts` 中添加：
   - `showNotification(title, body)`: 封装系统通知（Web 环境回退到浏览器通知 API）
   - 请求通知权限（如果未授权）

4. **集成通知到业务逻辑**

   在 `src/services/documentApi.ts` 中：
   - 文档上传完成后调用 `showNotification('文档上传成功', '文件已处理完成')`
   - 向量库更新完成后调用通知

5. **创建应用图标**

   在 `src-tauri/icons/` 目录准备多平台图标：
   - `32x32.png`, `128x128.png`: 标准尺寸
   - `icon.icns`: macOS
   - `icon.ico`: Windows
   - `icon.png`: Linux

   可使用 `npm run tauri:icon` 自动生成（需要提供 1024x1024 的源图标）

6. **实现系统功能命令**（可选）

   创建 `src-tauri/src/commands/system.rs`：
   - `show_in_folder(path)`: 在文件管理器中显示文件
     - Windows: `explorer /select,`
     - macOS: `open -R`
     - Linux: `xdg-open`

#### 验收标准
- [ ] 关闭窗口时应用最小化到托盘（Windows/Linux）
- [ ] 托盘菜单可以显示/隐藏窗口
- [ ] 托盘菜单可以退出应用
- [ ] 文档处理完成后显示系统通知
- [ ] macOS 遵循平台规范（关闭窗口退出应用，可选择是否显示托盘）
- [ ] 应用图标在各平台正确显示

#### 关键文件
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/menu.rs` (新建)
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/commands/system.rs` (新建)
- `/Users/zhengxu/Desktop/frontend/src-tauri/src/main.rs` (修改，添加托盘和窗口事件监听)
- `/Users/zhengxu/Desktop/frontend/src/services/documentApi.ts` (修改，添加通知调用)

---

### 阶段 5：打包和分发（2-3 天）

**目标**: 生成可分发的安装包

#### 任务清单

1. **配置 ACL Capabilities**

   创建 `src-tauri/capabilities/main.json`：
   ```json
   {
     "identifier": "main-capability",
     "windows": ["main"],
     "permissions": [
       "core:default",
       "core:window:allow-*",
       "dialog:allow-*",
       "fs:allow-read-file",
       "fs:allow-write-file",
       "fs:scope-appdata-recursive",
       "fs:scope-home-downloads",
       "notification:allow-*",
       "shell:allow-open",
       "store:allow-*"
     ]
   }
   ```

   参考: https://v2.tauri.app/reference/acl/capability/

2. **完善 `tauri.conf.json` 配置**

   - 配置 `bundle` 部分：
     - `identifier`: `com.powerplant.qa-agent`
     - `targets`: `["dmg", "app", "msi", "appimage", "deb"]`
     - `icon`: 指向 `icons/` 目录
     - `publisher`: 公司名称
     - `category`: `Productivity`

   - 配置 CSP（Content Security Policy）：
     ```json
     "security": {
       "csp": {
         "default-src": "'self' tauri:",
         "connect-src": "'self' tauri: http://* https:// ws://* wss://*",
         "script-src": "'self' 'unsafe-inline' 'unsafe-eval'",
         "style-src": "'self' 'unsafe-inline'",
         "img-src": "'self' data: blob: https:",
         "font-src": "'self' data:"
       }
     }
     ```

     注意: `'unsafe-inline'` 和 `'unsafe-eval'` 是为了兼容 `rehype-raw`，确保后端返回的 Markdown 已清洗

3. **本地构建测试**

   ```bash
   # 构建生产版本
   npm run tauri:build

   # 输出位置：
   # macOS: src-tauri/target/release/bundle/dmg/
   # Windows: src-tauri/target/release/bundle/msi/
   # Linux: src-tauri/target/release/bundle/appimage/
   ```

4. **配置 GitHub Actions 自动构建**（可选）

   创建 `.github/workflows/release.yml`：
   - 多平台矩阵构建（macOS、Windows、Linux）
   - 使用 `tauri-apps/tauri-action@v0`
   - 自动创建 GitHub Release
   - 上传构建产物

5. **代码签名配置**（可选，推荐生产环境）

   - **macOS**:
     - 申请 Apple Developer 证书
     - 配置 `tauri.conf.json` 中的 `signingIdentity`
     - 配置公证（Notarization）

   - **Windows**:
     - 申请代码签名证书
     - 配置 `certificateThumbprint`

6. **测试安装包**

   在各平台分别测试：
   - 安装流程是否顺畅
   - 应用是否正常启动
   - 后端配置是否持久化
   - 文件操作是否正常
   - 系统托盘和通知是否工作

#### 验收标准
- [ ] macOS 生成 `.dmg` 和 `.app`
- [ ] Windows 生成 `.msi` 安装包
- [ ] Linux 生成 `.AppImage` 和 `.deb`
- [ ] 安装包可以正常安装和卸载
- [ ] 应用在各平台正常运行（聊天、文档上传、后端配置等）
- [ ] 重启应用后配置和状态保持不变
- [ ] （可选）代码签名生效，无安全警告

#### 关键文件
- `/Users/zhengxu/Desktop/frontend/src-tauri/capabilities/main.json` (新建)
- `/Users/zhengxu/Desktop/frontend/src-tauri/tauri.conf.json` (修改，完善 bundle 配置)
- `/Users/zhengxu/Desktop/frontend/.github/workflows/release.yml` (新建，可选)

---

## 文件清单总览

### 需要创建的文件（22 个）

#### Rust 后端（11 个）
1. `src-tauri/Cargo.toml` - Rust 依赖配置
2. `src-tauri/src/main.rs` - 主进程入口
3. `src-tauri/src/lib.rs` - 模块导出
4. `src-tauri/src/commands/mod.rs` - 命令模块导出
5. `src-tauri/src/commands/config.rs` - 配置管理命令
6. `src-tauri/src/commands/file.rs` - 文件操作命令
7. `src-tauri/src/commands/system.rs` - 系统功能命令
8. `src-tauri/src/menu.rs` - 系统托盘菜单
9. `src-tauri/tauri.conf.json` - Tauri 主配置
10. `src-tauri/capabilities/main.json` - ACL 权限配置
11. `src-tauri/build.rs` - 构建脚本（通常由 `tauri init` 自动生成）

#### 前端集成（7 个）
12. `src/lib/tauri/index.ts` - 统一导出
13. `src/lib/tauri/environment.ts` - 环境检测
14. `src/lib/tauri/commands.ts` - IPC 命令封装
15. `src/lib/tauri/events.ts` - 事件监听（可选）
16. `src/lib/tauri/types.ts` - TypeScript 类型
17. `src/components/Settings/BackendConfig.tsx` - 后端配置组件
18. `src/components/Settings/BackendConfig.module.css` - 样式文件

#### 配置文件（4 个）
19. `.env.tauri` - Tauri 环境变量（可选）
20. `.github/workflows/release.yml` - GitHub Actions 构建（可选）
21. `src-tauri/icons/*` - 应用图标（多个尺寸）
22. `TAURI_README.md` - Tauri 集成文档（可选）

### 需要修改的文件（4 个）

1. **`src/services/apiClient.ts`**
   - 添加异步初始化方法 `init()`
   - 添加 `updateBaseURL(url)` 方法
   - 在 Tauri 环境下从 Store 加载后端地址

2. **`src/components/Common/SettingsModal.tsx`**（或类似的设置界面组件）
   - 导入 `isTauriEnv` 和 `BackendConfig`
   - 添加"后端配置"选项卡（条件渲染）

3. **`package.json`**
   - 添加 `tauri:*` 脚本
   - 添加 `@tauri-apps/*` 依赖

4. **`src/services/documentApi.ts`**（可选）
   - 在上传完成回调中调用 `showNotification()`

---

## 关键技术配置

### Tauri Store 配置示例

后端地址存储在 Tauri Store（文件路径: `~/.config/com.powerplant.qa-agent/config.json`）：

```json
{
  "backend_url": "http://192.168.50.50:5000"
}
```

### CSP 策略说明

- `connect-src`: 允许连接所有 HTTP/HTTPS/WS 地址（支持用户自定义后端）
- `script-src 'unsafe-inline' 'unsafe-eval'`: 兼容 `rehype-raw` 和 Vite 开发模式
- **安全缓解措施**:
  1. 后端必须对 Markdown 内容进行 HTML 清洗
  2. 前端使用 `rehype-sanitize` 二次过滤（已配置）
  3. 生产环境考虑替换 `rehype-raw` 为更安全方案

### 窗口关闭行为（平台差异）

```rust
// src-tauri/src/main.rs
window.on_window_event(|event| {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        // Windows/Linux: 最小化到托盘
        #[cfg(not(target_os = "macos"))]
        {
            window.hide().unwrap();
            api.prevent_close();
        }

        // macOS: 退出应用（遵循平台规范）
        #[cfg(target_os = "macos")]
        {
            // 默认行为：退出应用
        }
    }
});
```

---

## 风险点和注意事项

### 1. API 地址动态配置风险
- **风险**: 用户可能配置恶意后端地址
- **缓解**:
  - URL 格式验证（仅允许 `http://` 和 `https://`）
  - 连接测试时显示警告
  - （可选）维护可信后端白名单

### 2. CSP 与 rehype-raw 冲突
- **风险**: `unsafe-inline` 和 `unsafe-eval` 降低安全性
- **缓解**:
  - 后端必须对 Markdown 内容进行 HTML 清洗
  - 前端使用 `rehype-sanitize` 二次过滤
  - 定期审计后端返回内容

### 3. 跨平台兼容性
- **Windows**: 需要 Visual Studio Build Tools 或 MSVC
- **macOS**: 需要 Xcode Command Line Tools
- **Linux**: 需要安装 `webkit2gtk` 等依赖
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libwebkit2gtk-4.0-dev libgtk-3-dev librsvg2-dev
  ```

### 4. 首次构建时间
- **问题**: Rust 编译较慢（首次约 5-10 分钟）
- **优化**: 使用 `--release` 模式预编译一次

### 5. 包体积优化
- **当前估算**:
  - macOS `.dmg`: 约 10-15 MB
  - Windows `.msi`: 约 8-12 MB
  - Linux `.AppImage`: 约 12-18 MB
- **优化措施**: 已在 `vite.config.ts` 中配置代码分割和压缩

---

## 开发工作流

### 日常开发
```bash
# 启动 Tauri 开发模式（自动启动前端 dev server + Tauri 窗口）
npm run tauri:dev
```

### 构建生产版本
```bash
# 构建所有平台（在对应平台上运行）
npm run tauri:build

# 调试构建（保留符号表）
npm run tauri:build:debug
```

### 生成应用图标
```bash
# 从 1024x1024 源图标生成所有平台图标
npm run tauri:icon path/to/icon.png
```

---

## 预估工作量

| 阶段 | 工作量 | 风险缓冲 | 小计 |
|------|--------|---------|------|
| 阶段 1：基础搭建 | 1-2 天 | 0.5 天 | 2.5 天 |
| 阶段 2：后端配置功能 | 2-3 天 | 1 天 | 4 天 |
| 阶段 3：文件操作集成 | 1-2 天 | 0.5 天 | 2.5 天 |
| 阶段 4：系统集成功能 | 2-3 天 | 1 天 | 4 天 |
| 阶段 5：打包和分发 | 2-3 天 | 1 天 | 4 天 |
| **总计** | **8-13 天** | **4 天** | **17 天** |

**推荐工期**: 15 个工作日（3 周），单人完成

---

## 后续扩展方向

1. **自动更新**: 集成 `tauri-plugin-updater`
2. **数据库集成**: 使用 `tauri-plugin-sql` 本地存储会话
3. **全局快捷键**: 使用 `tauri-plugin-global-shortcut`
4. **剪贴板增强**: 使用 `tauri-plugin-clipboard`
5. **深色模式优化**: 跟随系统主题自动切换
6. **多窗口支持**: 独立的文档管理窗口
7. **性能监控**: 集成 `tauri-plugin-log` 收集错误日志

---

## 参考资源

- Tauri V2 官方文档: https://v2.tauri.app/
- ACL Capability 参考: https://v2.tauri.app/reference/acl/capability/
- Tauri Plugins: https://v2.tauri.app/plugin/
- GitHub Actions 构建: https://github.com/tauri-apps/tauri-action

---

**最后更新**: 2026-01-06
