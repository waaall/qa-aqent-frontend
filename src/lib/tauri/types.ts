/**
 * HTTP 状态码类型（100-599）
 */
export type HttpStatusCode = number;

/**
 * 后端连接测试结果
 */
export interface BackendTestResult {
  /** 连接是否成功 */
  ok: boolean;
  /** HTTP 状态码（如 200, 404, 500 等） */
  status?: HttpStatusCode;
  /** 错误或状态消息 */
  message?: string;
}

/**
 * 文件对话框过滤器配置
 */
export interface FileDialogFilter {
  /** 过滤器显示名称（如 "文档文件"） */
  name: string;
  /** 允许的文件扩展名列表（如 ["pdf", "md"]） */
  extensions: string[];
}

/**
 * 文件选择结果
 * - Tauri 环境返回文件路径 (path)
 * - Web 环境返回 File 对象 (file)
 */
export interface FileSelectionResult {
  /** 文件绝对路径（Tauri 环境） */
  path?: string;
  /** File 对象（Web 环境） */
  file?: File;
}
