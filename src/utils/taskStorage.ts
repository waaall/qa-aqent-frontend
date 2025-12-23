/**
 * 任务持久化存储工具
 * 用于保存上传和更新任务状态，支持页面刷新后恢复
 */

import type { UnifiedTaskInfo } from '@/types';
import logger from './logger';

const STORAGE_KEY = 'qa_agent_tasks';

export const taskStorage = {
  /**
   * 保存任务列表
   */
  save(tasks: UnifiedTaskInfo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      logger.error('Failed to save tasks to localStorage', error);
    }
  },

  /**
   * 加载任务列表
   */
  load(): UnifiedTaskInfo[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('Failed to load tasks from localStorage', error);
      return [];
    }
  },

  /**
   * 添加任务
   */
  add(task: UnifiedTaskInfo): void {
    const tasks = this.load();
    tasks.unshift(task);
    this.save(tasks);
  },

  /**
   * 更新任务
   */
  update(taskId: string, updates: Partial<UnifiedTaskInfo>): void {
    const tasks = this.load();
    const index = tasks.findIndex(t => t.taskId === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.save(tasks);
    }
  },

  /**
   * 删除任务
   */
  remove(taskId: string): void {
    const tasks = this.load();
    const filtered = tasks.filter(t => t.taskId !== taskId);
    this.save(filtered);
  },

  /**
   * 清除所有任务
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear tasks from localStorage', error);
    }
  },

  /**
   * 清除已完成的任务（超过指定时间）
   * @param olderThanMs 清除早于此时间的已完成任务（毫秒）
   */
  clearCompleted(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const tasks = this.load();
    const now = Date.now();
    const filtered = tasks.filter(task => {
      if (task.status !== 'completed' && task.status !== 'failed') {
        return true; // 保留未完成任务
      }
      const age = now - task.createdAt;
      return age < olderThanMs; // 保留未超时的已完成任务
    });
    this.save(filtered);
  },

  /**
   * 获取活动任务（未完成）
   */
  getActiveTasks(): UnifiedTaskInfo[] {
    return this.load().filter(
      task => task.status !== 'completed' && task.status !== 'failed'
    );
  },
};

export default taskStorage;
