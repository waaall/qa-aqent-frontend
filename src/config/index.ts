/**
 * 应用配置
 */

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appTitle: import.meta.env.VITE_APP_TITLE || '电厂智能问答系统',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  chatEndpoint: import.meta.env.VITE_CHAT_ENDPOINT || '/chat',

  // 超时配置
  timeout: {
    default: 120000, // 2分钟
    upload: 300000,  // 5分钟
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
} as const;

export default config;
