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
