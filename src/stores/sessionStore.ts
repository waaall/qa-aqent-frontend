/**
 * 会话状态管理 - Zustand Store
 */

import { create } from 'zustand';
import { Session } from '@/types';
import sessionStorage from '@/utils/storage';

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;

  // Actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string | null) => void;
  loadSessions: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSessionId: null,

  setSessions: (sessions) => {
    set({ sessions });
    sessionStorage.save(sessions);
  },

  addSession: (session) => {
    const sessions = [session, ...get().sessions];
    set({ sessions, currentSessionId: session.session_id });
    // 添加会话是关键操作，立即保存
    sessionStorage.saveImmediate(sessions);
  },

  updateSession: (sessionId, updates) => {
    const sessions = get().sessions.map((s) =>
      s.session_id === sessionId ? { ...s, ...updates } : s
    );
    set({ sessions });
    // 更新会话使用防抖保存，减少高频写入
    sessionStorage.saveLater(sessions, 1000);
  },

  removeSession: (sessionId) => {
    const sessions = get().sessions.filter((s) => s.session_id !== sessionId);
    const currentSessionId = get().currentSessionId;

    set({
      sessions,
      currentSessionId: currentSessionId === sessionId ? null : currentSessionId,
    });

    // 删除会话是关键操作，立即保存
    sessionStorage.saveImmediate(sessions);
  },

  setCurrentSession: (sessionId) => {
    set({ currentSessionId: sessionId });
  },

  loadSessions: () => {
    const sessions = sessionStorage.load();
    set({ sessions });
  },
}));

export default useSessionStore;
