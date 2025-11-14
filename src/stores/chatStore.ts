/**
 * 聊天状态管理 - Zustand Store
 */

import { create } from 'zustand';
import { Message, CreateMessageParams } from '@/types';
import { generateId } from '@/utils/helpers';

interface ChatState {
  messages: Message[];
  isLoading: boolean;

  // Actions
  addMessage: (params: CreateMessageParams) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

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
}));

export default useChatStore;
