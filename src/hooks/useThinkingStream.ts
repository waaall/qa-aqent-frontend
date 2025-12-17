/**
 * 思考流Hook - 处理SSE流式事件
 */

import { useCallback, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services';
import { ChatRequest } from '@/types';
import { ThinkingEvent } from '@/types/thinking';
import logger from '@/utils/logger';
import config from '@/config';

interface UseThinkingStreamOptions {
  onEvent?: (event: ThinkingEvent) => void;
  onFinal?: (finalContent: string, event: ThinkingEvent) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onComplete?: () => void;
}

export function useThinkingStream(options: UseThinkingStreamOptions = {}) {
  const { setStreamStatus, setAbortController, abortStream } = useChatStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortReasonRef = useRef<'user' | 'timeout' | null>(null);
  const getStreamStatus = useCallback(
    () => useChatStore.getState().streamStatus,
    []
  );

  // 重置心跳计时器
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setTimeout(() => {
      logger.warn('SSE heartbeat timeout');
      abortReasonRef.current = 'timeout';
      abortControllerRef.current?.abort();
    }, config.thinkingStream.heartbeatTimeout + 5000);
  }, []);

  // 清理心跳
  const clearHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // 启动流式请求
  const startStream = useCallback(
    async (request: ChatRequest) => {
      // 创建AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setAbortController(controller);
      abortReasonRef.current = null;
      setStreamStatus('connecting');

      try {
        // 启动心跳监控
        resetHeartbeat();

        await chatApi.streamMessage(
          request,
          controller.signal,
          (event) => {
            // 每次收到事件重置心跳（包括 heartbeat）
            resetHeartbeat();

            // 心跳事件只用于重置计时器，不传递给外部
            if (event.type === 'heartbeat') {
              return;
            }

            // 只要收到任意事件，认为已经建立流
            if (getStreamStatus() === 'connecting') {
              setStreamStatus('streaming');
            }

            // 触发回调
            options.onEvent?.(event);

            // 处理final事件
            if (event.type === 'final') {
              options.onFinal?.(event.content, event);
            }

            // 处理error事件
            if (event.type === 'error') {
              options.onError?.(new Error(event.content));
            }
          },
          () => {
            // fetch 已建立，提前进入 streaming 状态，避免长时间停留在 connecting
            setStreamStatus('streaming');
            options.onConnected?.();
          }
        );

        // 流完成
        setStreamStatus('completed');
        options.onComplete?.();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // 区分：心跳超时 vs 用户主动停止
          if (abortReasonRef.current === 'timeout') {
            const timeoutError = new Error('心跳超时，连接已断开');
            setStreamStatus('error');
            // 让上层走降级逻辑
            throw timeoutError;
          }

          setStreamStatus('aborted');
        } else {
          setStreamStatus('error');
          // 让上层判断是否降级
          throw error;
        }
      } finally {
        clearHeartbeat();
        setAbortController(null);
        abortControllerRef.current = null;
        abortReasonRef.current = null;
      }
    },
    [setStreamStatus, setAbortController, resetHeartbeat, clearHeartbeat, getStreamStatus, options]
  );

  // 停止流
  const stopStream = useCallback(() => {
    abortReasonRef.current = 'user';
    abortStream();
    clearHeartbeat();
  }, [abortStream, clearHeartbeat]);

  return {
    startStream,
    stopStream,
  };
}

export default useThinkingStream;
