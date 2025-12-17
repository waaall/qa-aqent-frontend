/**
 * 应用配置
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appTitle: import.meta.env.VITE_APP_TITLE || '电厂智能问答系统',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  chatEndpoint: import.meta.env.VITE_CHAT_ENDPOINT || '/chat',

  // 超时配置
  timeout: {
    default: 900000, // 15分钟
    upload: 900000,  // 15分钟
  },

  // 会话配置
  session: {
    maxHistoryLength: 50,
    storageKey: 'qa_agent_sessions',
  },

  // UI 配置
  ui: {
    sidebarWidth: 280,
    maxMessageLength: 10000,
  },

  // 思考流配置
  thinkingStream: {
    enabled: import.meta.env.VITE_ENABLE_THINKING_STREAM === 'true',
    endpoint: import.meta.env.VITE_STREAM_ENDPOINT || '/api/react_stream',
    fallbackEndpoint: import.meta.env.VITE_FALLBACK_ENDPOINT || '/chat',
    heartbeatTimeout: parseInt(import.meta.env.VITE_STREAM_HEARTBEAT_TIMEOUT || '30000'),
    previewMaxLength: parseInt(import.meta.env.VITE_THINKING_PREVIEW_MAX_LENGTH || '500'),
  },
} as const;

export default config;
