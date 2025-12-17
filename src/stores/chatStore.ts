/**
 * 聊天状态管理 - Zustand Store
 */

import { create } from 'zustand';
import { Message, CreateMessageParams } from '@/types';
import { ThinkingEvent, StreamStatus } from '@/types/thinking';
import { generateId } from '@/utils/helpers';

interface ChatState {
  messages: Message[];
  isLoading: boolean;

  // 流式状态
  streamingMessageId: string | null;          // 当前流式消息ID
  streamStatus: StreamStatus;                 // 流状态
  thinkingEventsMap: Map<string, ThinkingEvent[]>; // traceId -> events
  currentAbortController: AbortController | null;  // 当前中断控制器

  // Actions
  addMessage: (params: CreateMessageParams) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;

  // 流式方法
  setStreamStatus: (status: StreamStatus) => void;
  setStreamingMessage: (messageId: string | null, traceId?: string) => void;
  appendThinkingEvent: (traceId: string, event: ThinkingEvent) => void;
  clearThinkingEvents: (traceId: string) => void;
  setAbortController: (controller: AbortController | null) => void;
  abortStream: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  // 流式状态初始化
  streamingMessageId: null,
  streamStatus: 'idle',
  thinkingEventsMap: new Map(),
  currentAbortController: null,

  addMessage: (params) => {
    const message: Message = {
      id: generateId('msg'),
      timestamp: Date.now(),
      ...params,
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return message;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  removeMessage: (id) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setMessages: (messages) => {
    set({ messages });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // 流式方法实现
  setStreamStatus: (status) => {
    set({ streamStatus: status });
  },

  setStreamingMessage: (messageId, traceId) => {
    set({ streamingMessageId: messageId });

    // 如果有traceId，初始化事件列表
    if (traceId) {
      const map = get().thinkingEventsMap;
      if (!map.has(traceId)) {
        map.set(traceId, []);
      }
    }
  },

  appendThinkingEvent: (traceId, event) => {
    set((state) => {
      const map = new Map(state.thinkingEventsMap);
      const events = map.get(traceId) || [];

      // 按step排序插入（保证顺序）
      const newEvents = [...events, event].sort((a, b) => a.step - b.step);
      map.set(traceId, newEvents);

      return { thinkingEventsMap: map };
    });
  },

  clearThinkingEvents: (traceId) => {
    set((state) => {
      const map = new Map(state.thinkingEventsMap);
      map.delete(traceId);
      return { thinkingEventsMap: map };
    });
  },

  setAbortController: (controller) => {
    set({ currentAbortController: controller });
  },

  abortStream: () => {
    const { currentAbortController, streamingMessageId, updateMessage } = get();
    if (currentAbortController) {
      currentAbortController.abort();

      // 清理流式消息的加载状态
      if (streamingMessageId) {
        updateMessage(streamingMessageId, {
          content: '已停止生成',
          streaming: false,
          isLoading: false,
        });
      }

      set({
        currentAbortController: null,
        streamStatus: 'aborted',
        isLoading: false,
        streamingMessageId: null,
      });
    }
  },
}));

export default useChatStore;
