/**
 * 聊天相关 API
 */

import apiClient from './apiClient';
import {
  ChatRequest,
  ChatResponse,
  CreateSessionResponse,
  SessionHistoryResponse,
} from '@/types';
import { ThinkingEvent } from '@/types/thinking';
import config from '@/config';
import logger from '@/utils/logger';
import { readSseStream } from '@/utils/sseParser';
import { joinUrl } from '@/utils/urlHelper';

export const chatApi = {
  /**
   * 发送聊天消息（一次性返回）
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    logger.info('Sending chat message', { query: request.query });
    return apiClient.post<ChatResponse>(config.chatEndpoint, request);
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
   * 创建新会话
   */
  async createSession(): Promise<CreateSessionResponse> {
    logger.info('Creating new session');
    return apiClient.post<CreateSessionResponse>('/session/create');
  },

  /**
   * 获取会话历史
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<SessionHistoryResponse> {
    logger.debug('Fetching session history', { sessionId, limit });
    return apiClient.get<SessionHistoryResponse>(`/session/${sessionId}/history`, {
      params: { limit },
    });
  },

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean }> {
    logger.info('Deleting session', { sessionId });
    return apiClient.delete<{ success: boolean }>(`/session/${sessionId}`);
  },

  /**
   * 刷新会话
   */
  async refreshSession(sessionId: string): Promise<{ success: boolean }> {
    logger.debug('Refreshing session', { sessionId });
    return apiClient.post<{ success: boolean }>(`/session/${sessionId}/refresh`);
  },
};

export default chatApi;
