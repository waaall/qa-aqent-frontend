/**
 * 会话管理 Hook
 */

import { useCallback, useEffect } from 'react';
import { message as antdMessage } from 'antd';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services';
import { Session, Message } from '@/types';
import logger from '@/utils/logger';

export function useSession() {
  const {
    sessions,
    currentSessionId,
    addSession,
    removeSession,
    setCurrentSession,
    loadSessions,
    updateSession,
  } = useSessionStore();

  const { setMessages, clearMessages } = useChatStore();

  // 初始化时加载会话列表
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /**
   * 创建新会话
   */
  const createSession = useCallback(async () => {
    try {
      const response = await chatApi.createSession();

      const newSession: Session = {
        session_id: response.session_id,
        title: '新对话',
        created_at: Date.now(),
        last_accessed: Date.now(),
        message_count: 0,
      };

      addSession(newSession);
      clearMessages();

      logger.info('New session created', { session_id: response.session_id });

      return newSession.session_id;
    } catch (error) {
      logger.error('Failed to create session', error);
      antdMessage.error('创建会话失败');
      return null;
    }
  }, [addSession, clearMessages]);

  /**
   * 切换会话
   */
  const switchSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === currentSessionId) return;

      try {
        setCurrentSession(sessionId);
        clearMessages();

        // 加载会话历史
        const response = await chatApi.getSessionHistory(sessionId);

        // 使用时间戳+索引生成唯一ID，避免重新加载时ID冲突
        const messages: Message[] = response.history.map((item, index) => ({
          id: `${sessionId}-${item.timestamp || Date.now()}-${index}`,
          role: item.role as 'user' | 'assistant',
          content: item.content,
          timestamp: item.timestamp,
          metadata: item.metadata as Message['metadata'],
        }));

        setMessages(messages);

        // 更新最后访问时间
        updateSession(sessionId, { last_accessed: Date.now() });

        logger.info('Session switched', { session_id: sessionId });
      } catch (error) {
        logger.error('Failed to switch session', error);
        antdMessage.error('加载会话失败');
      }
    },
    [currentSessionId, setCurrentSession, clearMessages, setMessages, updateSession]
  );

  /**
   * 删除会话
   */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await chatApi.deleteSession(sessionId);
        removeSession(sessionId);

        // 如果删除的是当前会话，清空消息
        if (sessionId === currentSessionId) {
          clearMessages();
        }

        logger.info('Session deleted', { session_id: sessionId });
        antdMessage.success('会话已删除');
      } catch (error) {
        logger.error('Failed to delete session', error);
        antdMessage.error('删除会话失败');
      }
    },
    [currentSessionId, removeSession, clearMessages]
  );

  /**
   * 开始新对话
   */
  const startNewChat = useCallback(() => {
    setCurrentSession(null);
    clearMessages();
  }, [setCurrentSession, clearMessages]);

  return {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    startNewChat,
  };
}

export default useSession;
