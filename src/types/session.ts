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
