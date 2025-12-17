/**
 * 消息相关类型定义
 */

export type MessageRole = 'user' | 'assistant';

export interface MessageMetadata {
  query_type?: string;
  engines_used?: string[];
  confidence?: number;
  enhancement_applied?: boolean;
  sources?: string[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
  isLoading?: boolean;
  error?: string;

  // 思考流相关字段
  traceId?: string;                    // 追踪ID（关联思考事件）
  streaming?: boolean;                 // 是否为流式消息
  route?: string;                      // 路由类型
  fallbackTriggered?: boolean;         // 是否触发兜底
}

export interface CreateMessageParams {
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
  isLoading?: boolean;
  error?: string;

  // 思考流相关字段
  traceId?: string;
  streaming?: boolean;
  route?: string;
  fallbackTriggered?: boolean;
}
