/**
 * 应用配置
 */

export const config = {
  // 后端接口(除了/health) 统一以 /api 为前缀，避免重复 /api
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appTitle: import.meta.env.VITE_APP_TITLE || '电厂智能问答系统',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',

  // API 端点配置
  endpoints: {
    // 聊天相关
    chat: import.meta.env.VITE_CHAT_ENDPOINT || '/api/chat',

    // Context 管理
    contextInfo: import.meta.env.VITE_CONTEXT_INFO_ENDPOINT || '/context',  // 会拼接 /{sessionId}/info
    contextDelete: import.meta.env.VITE_CONTEXT_DELETE_ENDPOINT || '/context',  // 会拼接 /{sessionId}
    contextRefresh: import.meta.env.VITE_CONTEXT_REFRESH_ENDPOINT || '/context',  // 会拼接 /{sessionId}/refresh

    // 文档相关
    documentUpload: import.meta.env.VITE_DOCUMENT_UPLOAD_ENDPOINT || '/upload',
    documentList: import.meta.env.VITE_DOCUMENT_LIST_ENDPOINT || '/documents',
    uploadStatus: import.meta.env.VITE_UPLOAD_STATUS_ENDPOINT || '/upload/status',  // 会拼接 /{taskId}

    // 向量库更新相关
    updateIndex: import.meta.env.VITE_UPDATE_INDEX_ENDPOINT || '/api/update_index',
    updateIndexStatus: import.meta.env.VITE_UPDATE_INDEX_STATUS_ENDPOINT || '/api/update_index/status',  // 会拼接 /{taskId}

    // 系统相关
    health: import.meta.env.VITE_HEALTH_ENDPOINT || '/health',
    stats: import.meta.env.VITE_STATS_ENDPOINT || '/stats',

    // 数据库相关
    databaseInfo: import.meta.env.VITE_DATABASE_INFO_ENDPOINT || '/database/info',
  },

  // 超时配置
  timeout: {
    default: 300000, // 5分钟
    upload: 300000,  // 5分钟
  },

  // 会话配置
  session: {
    storageKey: 'qa_agent_sessions',
  },

  // UI 配置
  ui: {
    sidebarWidth: 280,
    maxMessageLength: 10000,
    storageKey: 'qa_agent_ui_preferences', // UI 偏好存储键
    // 响应式断点配置（单位：px）
    breakpoints: {
      mobile: 768,      // 移动端阈值：< 768px
      desktop: 992,     // 桌面端阈值：>= 992px
      // 768-992px 为中间态（平板）
    },
    // 容器最大宽度配置
    containerMaxWidth: {
      message: 900,      // 消息容器最大宽度
      narrow: 560,       // 窄容器（小型 Modal）
      medium: 720,       // 中等容器（中型 Modal）
      wide: 960,         // 宽容器（大型 Modal）
    },
    // 滚动容器最大高度
    scrollMaxHeight: {
      panel: 400,        // 面板组件（TaskQueuePanel、DatabaseQuery）
    },
    // Header 高度配置
    headerHeight: {
      normal: 64,        // 正常模式
      landscape: 48,     // 横屏模式
    },
    // 表格配置
    table: {
      minColumnWidth: {
        desktop: 80,     // 桌面端最小列宽
        mobile: 60,      // 移动端最小列宽
      },
      minTotalWidth: 800,  // 表格最小总宽度（用于 scroll.x）
    },
  },

  // 应用信息配置
  app: {
    version: import.meta.env.VITE_APP_VERSION || 'v1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || '基于智能问答技术的电厂运维辅助系统',
    author: import.meta.env.VITE_APP_AUTHOR || '',
    repository: import.meta.env.VITE_APP_REPOSITORY || '',
  },

  // 主题配置
  theme: {
    storageKey: 'qa_agent_theme_mode',
    defaultMode: 'auto' as const,
  },

  // 思考流配置
  thinkingStream: {
    enabled: import.meta.env.VITE_ENABLE_THINKING_STREAM === 'true',
    endpoint: import.meta.env.VITE_STREAM_ENDPOINT || '/api/react_stream',
    heartbeatTimeout: parseInt(import.meta.env.VITE_STREAM_HEARTBEAT_TIMEOUT || '30000'),
    previewMaxLength: parseInt(import.meta.env.VITE_THINKING_PREVIEW_MAX_LENGTH || '500'),
  },

  // 文档管理配置
  documents: {
    // 文档标签选项（对应后端的 label 参数）
    labels: [
      { value: 'general', label: '通用文档', color: 'blue' },
      { value: 'procedure', label: '操作规程', color: 'orange' },
      { value: 'incident_case', label: '事故案例', color: 'red' },
    ],
    // 支持的文件类型
    supportedExtensions: ['.pdf', '.md'],
    // 文件大小限制（字节）
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
} as const;

export default config;
