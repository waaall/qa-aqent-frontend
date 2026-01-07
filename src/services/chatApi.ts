/**
 * 聊天相关 API
 */

import apiClient from './apiClient';
import {
  ChatRequest,
  ChatResponse,
  SessionHistoryResponse,
  ChatHistoryResponse,
  SuccessResponse,
} from '@/types';
import { ThinkingEvent } from '@/types/thinking';
import config from '@/config';
import logger from '@/utils/logger';
import { readSseStream } from '@/utils/sseParser';
import { joinUrl } from '@/utils/urlHelper';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isDisplayableRole = (role: unknown): role is 'user' | 'assistant' =>
  role === 'user' || role === 'assistant';

const toEpochMs = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

const extractMessageTimestamp = (metadata?: Record<string, unknown>): number => {
  if (!metadata) return Date.now();
  const candidate =
    toEpochMs(metadata.timestamp) ??
    toEpochMs(metadata.created_at) ??
    toEpochMs(metadata.createdAt);
  return candidate ?? Date.now();
};

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
   * 获取会话历史
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<SessionHistoryResponse> {
    logger.debug('Fetching chat history', { sessionId, limit });
    const response = await apiClient.get<ChatHistoryResponse>(
      `${config.endpoints.contextInfo}/${sessionId}/history`,
      {
        params: { limit },
      }
    );

    const fallbackTimestamp = Date.now();
    const messages = response.history
      .filter((item) => isDisplayableRole(item.role))
      .map((item) => {
        const metadata = isRecord(item.additional_kwargs) ? item.additional_kwargs : undefined;
        const content = typeof item.content === 'string' ? item.content : String(item.content ?? '');
        return {
          role: item.role,
          content,
          timestamp: metadata ? extractMessageTimestamp(metadata) : fallbackTimestamp,
          metadata,
        };
      })
      .filter((message) => message.content.trim() !== '');

    return {
      success: response.success,
      session_id: response.session_id,
      history: messages,
      count: typeof response.message_count === 'number' ? response.message_count : messages.length,
      message_count: response.message_count,
    };
  },

  /**
   * 清空会话历史
   */
  async deleteSession(sessionId: string): Promise<SuccessResponse> {
    logger.info('Clearing chat history', { sessionId });
    return apiClient.delete<SuccessResponse>(
      `${config.endpoints.contextDelete}/${sessionId}/history`
    );
  },

};

export default chatApi;
