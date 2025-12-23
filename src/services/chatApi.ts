/**
 * 聊天相关 API
 */

import apiClient from './apiClient';
import {
  ChatRequest,
  ChatResponse,
  SessionHistoryResponse,
  ContextInfoResponse,
  SuccessResponse,
} from '@/types';
import { ThinkingEvent } from '@/types/thinking';
import config from '@/config';
import logger from '@/utils/logger';
import { readSseStream } from '@/utils/sseParser';
import { joinUrl } from '@/utils/urlHelper';

const parseJsonString = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractBlockText = (block: unknown): string => {
  if (isRecord(block) && typeof block.text === 'string') return block.text;
  return '';
};

const extractMessageContent = (item: unknown): string => {
  if (!isRecord(item) || !Array.isArray(item.blocks)) return '';
  return item.blocks
    .map(extractBlockText)
    .filter((text) => text.trim() !== '')
    .join('\n');
};

const extractMessageRole = (item: unknown): 'user' | 'assistant' => {
  if (isRecord(item) && item.role === 'user') return 'user';
  if (isRecord(item) && item.role === 'assistant') return 'assistant';
  return 'assistant';
};

const isDisplayableRole = (item: unknown): item is { role: 'user' | 'assistant' } =>
  isRecord(item) && (item.role === 'user' || item.role === 'assistant');

const extractMessageTimestamp = (item: unknown): number => {
  if (isRecord(item) && isRecord(item.additional_kwargs)) {
    const extra = item.additional_kwargs;
    if (typeof extra.timestamp === 'number') return extra.timestamp;
  }
  return Date.now();
};

const extractMessageMetadata = (item: unknown): Record<string, unknown> | undefined => {
  if (!isRecord(item)) return undefined;
  if (isRecord(item.additional_kwargs)) return item.additional_kwargs;
  return undefined;
};

const extractChatHistoryFromMemory = (memory: unknown): unknown[] | null => {
  const parsed = parseJsonString(memory);
  if (!isRecord(parsed) || !isRecord(parsed.value)) return null;

  const value = parsed.value;
  const chatStoreKey =
    typeof value.chat_store_key === 'string' ? value.chat_store_key : 'chat_history';
  if (isRecord(value.chat_store) && isRecord(value.chat_store.store)) {
    const history = value.chat_store.store[chatStoreKey];
    if (Array.isArray(history)) return history;
  }

  return null;
};

const extractContextHistory = (ctx: unknown): unknown[] | null => {
  if (
    isRecord(ctx) &&
    isRecord(ctx.state) &&
    isRecord(ctx.state.state_data) &&
    isRecord(ctx.state.state_data._data)
  ) {
    return extractChatHistoryFromMemory(ctx.state.state_data._data.memory);
  }

  return null;
};

const mapContextMessages = (
  items: unknown[]
): Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}> =>
  items
    .filter(isDisplayableRole)
    .map((item) => {
      const content = extractMessageContent(item);
      return {
        role: extractMessageRole(item),
        content,
        timestamp: extractMessageTimestamp(item),
        metadata: extractMessageMetadata(item),
      };
    })
    .filter((message) => message.content.trim() !== '');

export const chatApi = {
  /**
   * 发送聊天消息（一次性返回）
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    logger.info('Sending chat message', { query: request.query });
    return apiClient.post<ChatResponse>(config.endpoints.chat, request);
  },

  /**
   * 流式发送消息（SSE）
   * @param request 聊天请求
   * @param abortSignal 中断信号
   * @param onEvent 事件回调
   */
  async streamMessage(
    request: ChatRequest,
    abortSignal?: AbortSignal,
    onEvent?: (event: ThinkingEvent) => void,
    onConnected?: () => void
  ): Promise<void> {
    logger.info('Starting SSE stream', { query: request.query });

    // 强制启用思考流
    const streamRequest = { ...request, stream_thoughts: true };

    try {
      const url = joinUrl(config.apiBaseUrl, config.thinkingStream.endpoint);
      const response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(streamRequest),
          cache: 'no-store',
          signal: abortSignal,
        }
      );

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      // 已建立连接，通知上层更新状态
      onConnected?.();

      let eventCount = 0;

      // 读取 SSE 流
      for await (const event of readSseStream(response)) {
        eventCount += 1;
        onEvent?.(event);
      }

      // 没有任何事件，视为异常
      if (eventCount === 0) {
        throw new Error('No SSE events received');
      }

      logger.info('SSE stream completed');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('SSE stream aborted by user');
        throw error; // 重新抛出以便上层处理
      }

      logger.error('SSE stream failed', error);
      throw error;
    }
  },

  /**
   * 获取会话历史（已改为 Context 接口）
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<SessionHistoryResponse> {
    logger.debug('Fetching context info', { sessionId, limit });
    // 调用新的 /context/{sessionId}/info 接口
    const response = await apiClient.get<ContextInfoResponse>(
      `${config.endpoints.contextInfo}/${sessionId}/info`,
      {
        params: { limit },
      }
    );

    let messages: Array<{
      role: string;
      content: string;
      timestamp: number;
      metadata?: Record<string, unknown>;
    }> = [];

    // 解析 ctx_json 字段获取历史消息
    if (response.context.ctx_json) {
      try {
        const ctxJson = response.context.ctx_json as unknown;
        const ctx = parseJsonString(ctxJson);
        const history = extractContextHistory(ctx);

        if (history) {
          messages = mapContextMessages(history);
        } else {
          logger.warn('ctx_json does not contain recognizable message format', { ctx });
        }
      } catch (error) {
        logger.error('Failed to parse ctx_json', error);
      }
    }

    // 转换为 SessionHistoryResponse 格式以保持向后兼容
    return {
      success: response.success,
      session_id: response.context.session_id,
      history: messages,
      count: messages.length,
    };
  },

  /**
   * 删除会话（已改为 Context 接口）
   */
  async deleteSession(sessionId: string): Promise<SuccessResponse> {
    logger.info('Deleting session context', { sessionId });
    return apiClient.delete<SuccessResponse>(`${config.endpoints.contextDelete}/${sessionId}`);
  },

  /**
   * 刷新会话（已改为 Context 接口）
   */
  async refreshSession(sessionId: string): Promise<SuccessResponse> {
    logger.debug('Refreshing session context', { sessionId });
    return apiClient.post<SuccessResponse>(`${config.endpoints.contextRefresh}/${sessionId}/refresh`);
  },

};

export default chatApi;
