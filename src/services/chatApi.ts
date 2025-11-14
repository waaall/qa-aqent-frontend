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
import logger from '@/utils/logger';

export const chatApi = {
  /**
   * 发送聊天消息
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    logger.info('Sending chat message', { query: request.query });
    return apiClient.post<ChatResponse>('/chat', request);
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
