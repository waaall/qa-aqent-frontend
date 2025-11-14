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
}

export interface CreateMessageParams {
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
  isLoading?: boolean;
  error?: string;
}
