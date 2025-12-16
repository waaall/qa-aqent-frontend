/**
 * 本地存储工具
 */

import { Session } from '@/types';
import config from '@/config';
import logger from './logger';

const STORAGE_KEY = config.session.storageKey;

// 防抖保存的定时器
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const sessionStorage = {
  /**
   * 保存会话列表
   */
  save(sessions: Session[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      logger.error('Failed to save sessions to localStorage', error);
    }
  },

  /**
   * 加载会话列表
   */
  load(): Session[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to load sessions from localStorage', error);
      return [];
    }
  },

  /**
   * 清除所有会话
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear sessions from localStorage', error);
    }
  },

  /**
   * 添加会话
   */
  add(session: Session): void {
    const sessions = this.load();
    sessions.unshift(session);
    this.save(sessions);
  },

  /**
   * 删除会话
   */
  remove(sessionId: string): void {
    const sessions = this.load();
    const filtered = sessions.filter(s => s.session_id !== sessionId);
    this.save(filtered);
  },

  /**
   * 更新会话
   */
  update(sessionId: string, updates: Partial<Session>): void {
    const sessions = this.load();
    const index = sessions.findIndex(s => s.session_id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.save(sessions);
    }
  },

  /**
   * 防抖保存（延迟保存，适用于高频更新）
   */
  saveLater(sessions: Session[], delay = 1000): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      this.save(sessions);
    }, delay);
  },

  /**
   * 立即保存（取消防抖，适用于关键操作）
   */
  saveImmediate(sessions: Session[]): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    this.save(sessions);
  },
};

export default sessionStorage;
