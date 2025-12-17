/**
 * 聊天核心逻辑 Hook
 */

import { useCallback, useState } from 'react';
import { message as antdMessage } from 'antd';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { chatApi } from '@/services';
import { Message } from '@/types';
import { generateSessionTitle, generateId } from '@/utils/helpers';
import logger from '@/utils/logger';
import config from '@/config';
import { useThinkingStream } from './useThinkingStream';
import { isStreamSupported } from '@/utils/sseParser';

export function useChat() {
  const {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    setLoading,
    isLoading,
    streamStatus,
    setStreamingMessage,
    appendThinkingEvent,
    clearThinkingEvents,
  } = useChatStore();
  const { currentSessionId, updateSession } = useSessionStore();

  // 降级标志（会话级）
  const [isFallbackMode, setIsFallbackMode] = useState(() => {
    const fallback = sessionStorage.getItem('thinking_stream_fallback');
    return fallback === 'true' || !config.thinkingStream.enabled || !isStreamSupported();
  });

  // 流式Hook配置
  const { startStream, stopStream } = useThinkingStream({
    onEvent: (event) => {
      const { streamingMessageId: msgId, messages } = useChatStore.getState();
      if (!msgId || !event.trace_id) return;

      // 同步前端和后端的 traceId（首次收到事件时）
      const currentMessage = messages.find(m => m.id === msgId);
      if (currentMessage && currentMessage.traceId !== event.trace_id) {
        updateMessage(msgId, { traceId: event.trace_id });
      }

      // 追加思考事件
      appendThinkingEvent(event.trace_id, event);

      // thought类型实时显示
      if (event.type === 'thought') {
        updateMessage(msgId, {
          content: event.content,
        });
      }
    },

    onFinal: (finalContent, event) => {
      const { streamingMessageId: msgId } = useChatStore.getState();
      if (!msgId) return;

      // 更新最终答案
      updateMessage(msgId, {
        content: finalContent,
        streaming: false,
        isLoading: false,
        metadata: {
          query_type: event.extra?.query_type,
          engines_used: event.extra?.engines_used,
          confidence: event.extra?.confidence,
          enhancement_applied: event.extra?.enhancement_applied,
        },
        route: event.extra?.route,
        fallbackTriggered: event.extra?.fallback_triggered,
      });

      setStreamingMessage(null);
      setLoading(false);

      // 更新会话信息
      const currentMessages = useChatStore.getState().messages;
      const sessionId = (event.extra?.turn_id as string | undefined) || event.turn_id || currentSessionId;

      if (sessionId) {
        updateSession(sessionId, {
          last_accessed: Date.now(),
          message_count: currentMessages.length,
        });
      }
    },

    onError: (error) => {
      logger.error('Stream error', error);

      const { streamingMessageId: msgId } = useChatStore.getState();
      if (msgId) {
        // 用户主动中止，显示不同的消息
        if (error.message.includes('中止') || error.message.includes('abort')) {
          updateMessage(msgId, {
            content: '已停止生成',
            streaming: false,
            isLoading: false,
          });
        } else {
          updateMessage(msgId, {
            content: '抱歉，处理您的问题时出现错误。',
            error: error.message,
            streaming: false,
            isLoading: false,
          });
        }
      }

      setStreamingMessage(null);
      setLoading(false);
    },
  });

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

      // 2. 创建助手占位消息
      const traceId = generateId('trace');
      const assistantMessage = addMessage({
        role: 'assistant',
        content: '',
        isLoading: true,
        streaming: true,
        traceId,
      });

      setLoading(true);
      setStreamingMessage(assistantMessage.id, traceId);

      const request = {
        query: content.trim(),
        session_id: currentSessionId || undefined,
        create_session: !currentSessionId,
      };

      try {
        // 3. 判断使用流式还是降级
        const shouldUseStream = config.thinkingStream.enabled && !isFallbackMode;

        if (shouldUseStream) {
          logger.info('Using streaming mode');

          try {
            await startStream(request);

            // 流式成功，更新会话标题（仅首次）
            if (!currentSessionId) {
              // session_id从final事件的回调中已经更新
              // 这里不需要再次更新
            }
          } catch (streamError) {
            // SSE失败，降级
            logger.warn('Stream failed, falling back to standard mode', streamError);
            setIsFallbackMode(true);
            sessionStorage.setItem('thinking_stream_fallback', 'true');
            antdMessage.warning('思考流连接失败，已切换为标准模式', 5);

            // 清理流式状态
            clearThinkingEvents(traceId);
            setStreamingMessage(null);

            // 直接使用降级模式，避免递归重复添加用户消息
            try {
              const response = await chatApi.sendMessage(request);

              logger.info('Fallback chat response received', {
                query_type: response.query_type,
                engines_used: response.engines_used,
              });

              // 移除占位消息
              removeMessage(assistantMessage.id);

              // 添加最终答案
              addMessage({
                role: 'assistant',
                content: response.answer,
                metadata: {
                  query_type: response.query_type,
                  engines_used: response.engines_used,
                  confidence: response.confidence,
                  enhancement_applied: response.enhancement_applied,
                },
              });

              // 更新会话信息
              if (response.session_id) {
                const isFirstMessage = !currentSessionId;
                const currentMessages = useChatStore.getState().messages;

                updateSession(response.session_id, {
                  last_accessed: Date.now(),
                  message_count: currentMessages.length,
                  ...(isFirstMessage && {
                    title: generateSessionTitle(content.trim()),
                  }),
                });
              }

              setLoading(false);
            } catch (fallbackError) {
              logger.error('Fallback mode also failed', fallbackError);
              removeMessage(assistantMessage.id);

              addMessage({
                role: 'assistant',
                content: '抱歉，处理您的问题时出现错误，请稍后重试。',
                error: fallbackError instanceof Error ? fallbackError.message : '未知错误',
              });

              antdMessage.error('发送消息失败');
              setLoading(false);
            }

            return;
          }
        } else {
          // 降级模式：使用原有一次性接口
          logger.info('Using fallback mode (standard)');

          const response = await chatApi.sendMessage(request);

          logger.info('Chat response received', {
            query_type: response.query_type,
            engines_used: response.engines_used,
          });

          // 移除占位消息
          removeMessage(assistantMessage.id);

          // 添加最终答案
          const finalMessage = addMessage({
            role: 'assistant',
            content: response.answer,
            metadata: {
              query_type: response.query_type,
              engines_used: response.engines_used,
              confidence: response.confidence,
              enhancement_applied: response.enhancement_applied,
            },
          });

          // 更新会话信息
          if (response.session_id) {
            const isFirstMessage = !currentSessionId;
            const currentMessages = useChatStore.getState().messages;

            updateSession(response.session_id, {
              last_accessed: Date.now(),
              message_count: currentMessages.length,
              ...(isFirstMessage && {
                title: generateSessionTitle(content.trim()),
              }),
            });
          }

          setLoading(false);
          return finalMessage;
        }
      } catch (error) {
        logger.error('Failed to send message', error);

        removeMessage(assistantMessage.id);

        addMessage({
          role: 'assistant',
          content: '抱歉，处理您的问题时出现错误，请稍后重试。',
          error: error instanceof Error ? error.message : '未知错误',
        });

        antdMessage.error('发送消息失败');
        setLoading(false);
      }
    },
    [
      currentSessionId,
      isLoading,
      isFallbackMode,
      addMessage,
      updateMessage,
      removeMessage,
      setLoading,
      setStreamingMessage,
      appendThinkingEvent,
      clearThinkingEvents,
      updateSession,
      startStream,
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
    streamStatus,
    sendMessage,
    retryMessage,
    stopStream,
  };
}

export default useChat;
