# Tauri App 封装设计说明

本文档描述当前桌面端 Tauri 封装的整体设计、模块分工和关键配置，便于后续维护与迭代。

## 目标与原则

- 在不破坏 Web 版本的前提下，提供桌面端能力（配置、文件操作、通知、托盘）。
- 通过环境检测与降级逻辑，保证同一套前端代码可运行在 Web/Tauri。
- 依赖 Tauri v2 ACL/Capability 机制，明确命令授权边界。

## 项目结构

- 前端：`src/`（Vite + React + TypeScript）
- Tauri：`src-tauri/`
  - `src/commands/`：Rust 端命令实现（配置、文件、系统）
  - `capabilities/`：ACL capability 定义
  - `permissions/`：应用自定义命令权限定义
  - `tauri.conf.json`：应用与构建配置

## 运行模式与环境检测

- `src/lib/tauri/environment.ts` 使用 `@tauri-apps/api/core` 的 `isTauri()` 判断运行环境。
- Web 环境下自动回退到浏览器能力（下载、文件选择、通知）。

## Rust 端命令设计

所有命令通过 `tauri::command` 暴露，统一在 `src-tauri/src/main.rs` 注册：

- 配置类（`src-tauri/src/commands/config.rs`）
  - `get_backend_url`：从 Store 读取后端地址
  - `set_backend_url`：写入并持久化后端地址
  - `test_backend_connection`：请求 `/health` 检测连通性
- 文件类（`src-tauri/src/commands/file.rs`）
  - `select_file`：原生文件选择
  - `save_chat_history`：对话记录导出为 JSON
  - `export_to_json`：通用 JSON 导出
- 系统类（`src-tauri/src/commands/system.rs`）
  - `show_in_folder`：在系统文件管理器中定位文件

## ACL / Capability 设计

- `src-tauri/capabilities/main.json` 为主窗口启用能力集合。
- 核心插件采用 `core:default`、`dialog:default`、`notification:default`、
  `store:default`、`shell:default`。
- 自定义命令权限通过 `src-tauri/permissions/app-commands.toml` 定义，
  以 `allow-*` 形式绑定具体命令。

## 前端 Tauri 封装层

`src/lib/tauri/` 提供统一 API：

- `commands.ts`：封装 Rust 命令与 Web 端降级逻辑。
- `types.ts`：前后端命令返回值类型定义。
- `index.ts`：统一导出入口。

## 后端地址配置

- 前端设置面板 `src/components/Settings/BackendConfig.tsx` 提供查看、测试与保存。
- Tauri 环境下读写 Store（`config.json`），默认地址为 `http://192.168.50.50:5000`。
- 保存成功后调用 `apiClient.updateBaseURL()` 立刻更新请求基址。

## 文件操作

- Tauri 端使用 `tauri-plugin-dialog` + `tauri-plugin-fs` 处理选择/保存。
- Web 端使用 `<input type="file">` 与浏览器下载作为降级方案。

## 通知与系统托盘

- 通知：`tauri-plugin-notification`，在文档上传/向量更新完成后触发。
- 托盘：`src-tauri/src/menu.rs` 提供显示/隐藏/退出菜单。
- 关闭窗口行为：macOS 保持默认退出；Windows/Linux 隐藏到托盘。

## 构建与配置

- `src-tauri/tauri.conf.json`
  - `build.devUrl` 与 `build.frontendDist` 对应本地与生产资源。
  - CSP 放开 `connect-src` 以支持用户自定义后端地址。
  - `bundle` 定义多平台目标与图标。

## 已知限制与后续建议

- 若需更细粒度权限，应在 `permissions/` 中继续细化并收紧 scopes。
- 生产环境建议进一步收敛 CSP 与后端地址白名单策略。
- 多平台打包依赖需按平台补齐（如 Linux WebKit 依赖）。
