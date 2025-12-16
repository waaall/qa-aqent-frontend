/**
 * 聊天核心逻辑 Hook
 */

import { useCallback } from 'react';
import { message as antdMessage } from 'antd';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { chatApi } from '@/services';
import { Message } from '@/types';
import { generateSessionTitle } from '@/utils/helpers';
import logger from '@/utils/logger';

export function useChat() {
  const { messages, addMessage, removeMessage, setLoading, isLoading } =
    useChatStore();
  const { currentSessionId, updateSession } = useSessionStore();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        antdMessage.warning('请输入消息内容');
        return;
      }

      if (isLoading) {
        antdMessage.warning('请等待当前消息处理完成');
        return;
      }

      // 1. 添加用户消息
      addMessage({
        role: 'user',
        content: content.trim(),
      });

      logger.info('User message sent', { content: content.trim() });

      // 2. 添加加载占位符
      const loadingMessage = addMessage({
        role: 'assistant',
        content: '',
        isLoading: true,
      });

      setLoading(true);

      try {
        // 3. 调用后端 API
        const response = await chatApi.sendMessage({
          query: content.trim(),
          session_id: currentSessionId || undefined,
          create_session: !currentSessionId,
        });

        logger.info('Chat response received', {
          query_type: response.query_type,
          engines_used: response.engines_used,
        });

        // 4. 移除加载消息，添加实际回答
        removeMessage(loadingMessage.id);

        const assistantMessage = addMessage({
          role: 'assistant',
          content: response.answer,
          metadata: {
            query_type: response.query_type,
            engines_used: response.engines_used,
            confidence: response.confidence,
            enhancement_applied: response.enhancement_applied,
          },
        });

        // 5. 更新会话信息
        if (response.session_id) {
          // 基于 currentSessionId 判断是否为首条消息（更可靠）
          const isFirstMessage = !currentSessionId;

          // 使用 getState() 获取当前消息数量，避免依赖 messages
          const currentMessages = useChatStore.getState().messages;

          updateSession(response.session_id, {
            last_accessed: Date.now(),
            message_count: currentMessages.length, // 当前消息总数
            ...(isFirstMessage && {
              title: generateSessionTitle(content.trim()),
            }),
          });
        }

        return assistantMessage;
      } catch (error) {
        logger.error('Failed to send message', error);

        // 移除加载消息，显示错误
        removeMessage(loadingMessage.id);

        addMessage({
          role: 'assistant',
          content: '抱歉，处理您的问题时出现错误，请稍后重试。',
          error: error instanceof Error ? error.message : '未知错误',
        });

        antdMessage.error('发送消息失败');
      } finally {
        setLoading(false);
      }
    },
    [
      currentSessionId,
      isLoading,
      addMessage,
      removeMessage,
      setLoading,
      updateSession,
    ]
  );

  const retryMessage = useCallback(
    async (message: Message) => {
      if (message.role === 'user') {
        await sendMessage(message.content);
      }
    },
    [sendMessage]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    retryMessage,
  };
}

export default useChat;
