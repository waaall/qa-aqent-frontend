/**
 * 思考流事件类型定义
 */

// 事件类型枚举
export type ThinkingEventType =
  | 'meta.start'        // 元数据：请求开始
  | 'router.decision'   // 路由决策
  | 'memory.inject'     // 记忆注入
  | 'thought'           // LLM思考过程
  | 'tool_call'         // 工具调用
  | 'tool_result'       // 工具结果
  | 'fallback'          // 兜底提示
  | 'final'             // 最终答案
  | 'error'             // 错误事件
  | 'heartbeat';        // 心跳

// 扩展字段（根据事件类型动态）
export interface ThinkingEventExtra {
  // meta.start
  query?: string;

  // router.decision
  query_type?: 'knowledge' | 'sql' | 'api' | 'general' | 'domain';
  confidence?: number;
  route?: string;

  // memory.inject
  memory_count?: number;

  // tool_call / tool_result
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  status?: 'ok' | 'failed';
  duration?: number;
  preview?: string;
  error_msg?: string;

  // fallback
  fallback_triggered?: boolean;
  fallback_reason?: string;

  // final
  engines_used?: string[];
  enhancement_applied?: boolean;

  // 通用扩展字段
  [key: string]: unknown;
}

// 核心事件接口
export interface ThinkingEvent {
  trace_id: string;           // 追踪ID
  turn_id?: string;           // 会话ID
  step: number;               // 步骤序号（自增）
  ts: number;                 // 时间戳
  type: ThinkingEventType;    // 事件类型
  content: string;            // 主要内容
  extra?: ThinkingEventExtra; // 扩展字段
}

// 流状态枚举
export type StreamStatus =
  | 'idle'          // 空闲
  | 'connecting'    // 连接中
  | 'streaming'     // 流式接收中
  | 'completed'     // 完成
  | 'error'         // 错误
  | 'aborted';      // 用户中断

// SSE响应封装（备用）
export interface StreamResponse {
  trace_id: string;
  events: ThinkingEvent[];
  final_answer?: string;
  error?: string;
}
