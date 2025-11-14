/**
 * 会话相关类型定义
 */

export interface Session {
  session_id: string;
  title: string;
  created_at: number;
  last_accessed: number;
  message_count: number;
}

export interface SessionInfo {
  session_id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
  created_at: number;
  last_accessed: number;
}

export interface CreateSessionResponse {
  success: boolean;
  session_id: string;
  message: string;
}
