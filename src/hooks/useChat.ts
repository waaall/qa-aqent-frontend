/**
 * 聊天核心逻辑 Hook
 */

import { useCallback, useRef, useState } from 'react';
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

const STREAM_FALLBACK_STORAGE_KEY = 'thinking_stream_fallback';
const STREAM_FALLBACK_TTL_MS = 60_000;

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
  const { currentSessionId } = useSessionStore();
  const pendingSessionTitleRef = useRef<string | null>(null);

  const syncSessionAfterResponse = useCallback((sessionId: string) => {
    const sessionState = useSessionStore.getState();
    const currentMessages = useChatStore.getState().messages;
    const messageCount = currentMessages.length;
    const hasSession = sessionState.sessions.some((session) => session.session_id === sessionId);

    if (hasSession) {
      sessionState.updateSession(sessionId, {
        last_accessed: Date.now(),
        message_count: messageCount,
      });

      if (sessionState.currentSessionId !== sessionId) {
        sessionState.setCurrentSession(sessionId);
      }
    } else {
      const title = pendingSessionTitleRef.current || '新对话';
      sessionState.addSession({
        session_id: sessionId,
        title,
        created_at: Date.now(),
        last_accessed: Date.now(),
        message_count: messageCount,
      });
    }

    pendingSessionTitleRef.current = null;
  }, []);

  // 降级标志（会话级）
  const [isFallbackMode, setIsFallbackMode] = useState(() => {
    if (!config.thinkingStream.enabled || !isStreamSupported()) return true;

    const fallback = sessionStorage.getItem(STREAM_FALLBACK_STORAGE_KEY);
    if (!fallback) return false;

    // 兼容旧值：'true' -> 迁移为时间戳（避免永久锁死降级模式）
    if (fallback === 'true') {
      sessionStorage.setItem(STREAM_FALLBACK_STORAGE_KEY, String(Date.now()));
      return true;
    }

    const ts = Number(fallback);
    if (Number.isFinite(ts) && Date.now() - ts < STREAM_FALLBACK_TTL_MS) {
      return true;
    }

    sessionStorage.removeItem(STREAM_FALLBACK_STORAGE_KEY);
    return false;
  });

  // 流式Hook配置
  const { startStream, stopStream } = useThinkingStream({
    onConnected: () => {
      const { streamingMessageId: msgId, messages } = useChatStore.getState();
      if (!msgId) return;

      const currentMessage = messages.find(m => m.id === msgId);
      if (currentMessage?.isLoading) {
        updateMessage(msgId, { isLoading: false });
      }
    },

    onEvent: (event) => {
      const { streamingMessageId: msgId, messages } = useChatStore.getState();
      if (!msgId || !event.trace_id) return;

      // 同步前端和后端的 traceId（首次收到事件时）
      const currentMessage = messages.find(m => m.id === msgId);
      if (currentMessage) {
        const updates: Partial<Message> = {};

        // 流开始后允许渲染中间内容/思考轨迹
        if (currentMessage.isLoading) {
          updates.isLoading = false;
        }

        if (currentMessage.traceId !== event.trace_id) {
          updates.traceId = event.trace_id;
        }

        // 如果后端不输出 thought，至少展示一个“进度文本”
        if (!currentMessage.content?.trim()) {
          const progressTypeSet = new Set([
            'meta.start',
            'router.decision',
            'memory.inject',
            'tool_call',
            'tool_result',
            'fallback',
          ]);

          if (progressTypeSet.has(event.type) && event.content?.trim()) {
            updates.content = event.content;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateMessage(msgId, updates);
        }
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
      const sessionId = (event.extra?.turn_id as string | undefined) || event.turn_id || currentSessionId;

      if (sessionId) {
        syncSessionAfterResponse(sessionId);
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

      const shouldResetSession = !currentSessionId;
      if (shouldResetSession) {
        pendingSessionTitleRef.current = generateSessionTitle(content.trim());
      }

      const request = {
        query: content.trim(),
        session_id: currentSessionId || undefined,
        reset: shouldResetSession,
      };

      try {
        // 3. 判断使用流式还是降级
        let fallbackActive = isFallbackMode;
        if (fallbackActive && config.thinkingStream.enabled && isStreamSupported()) {
          const fallback = sessionStorage.getItem(STREAM_FALLBACK_STORAGE_KEY);
          const ts = fallback && fallback !== 'true' ? Number(fallback) : Number.NaN;
          if (Number.isFinite(ts) && Date.now() - ts >= STREAM_FALLBACK_TTL_MS) {
            sessionStorage.removeItem(STREAM_FALLBACK_STORAGE_KEY);
            setIsFallbackMode(false);
            fallbackActive = false;
          }
        }

        const shouldUseStream = config.thinkingStream.enabled && !fallbackActive;

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
            sessionStorage.setItem(STREAM_FALLBACK_STORAGE_KEY, String(Date.now()));
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
                syncSessionAfterResponse(response.session_id);
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
            syncSessionAfterResponse(response.session_id);
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
      removeMessage,
      setLoading,
      setStreamingMessage,
      clearThinkingEvents,
      syncSessionAfterResponse,
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
