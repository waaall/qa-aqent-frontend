/**
 * UI 状态管理 - Zustand Store
 */
import { create } from 'zustand';
import config from '@/config';

interface UiState {
  // 侧边栏是否折叠
  sidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  loadUiPreferences: () => void;
}

// 从 localStorage 加载 UI 偏好
const loadSidebarStateFromStorage = (): boolean => {
  try {
    const stored = localStorage.getItem(config.ui.storageKey);
    if (stored !== null) {
      const preferences = JSON.parse(stored);
      return preferences.sidebarCollapsed || false;
    }
  } catch (e) {
    console.warn('Failed to load UI preferences', e);
  }
  // 默认值：移动端收起，桌面端展开
  return window.innerWidth < config.ui.breakpoints.mobile;
};

// 保存 UI 偏好到 localStorage
const saveSidebarStateToStorage = (collapsed: boolean) => {
  try {
    const current = localStorage.getItem(config.ui.storageKey);
    const preferences = current ? JSON.parse(current) : {};
    preferences.sidebarCollapsed = collapsed;
    localStorage.setItem(config.ui.storageKey, JSON.stringify(preferences));
  } catch (e) {
    console.warn('Failed to save UI preferences', e);
  }
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,

  toggleSidebar: () => {
    set((state) => {
      const newCollapsed = !state.sidebarCollapsed;
      saveSidebarStateToStorage(newCollapsed);
      return { sidebarCollapsed: newCollapsed };
    });
  },

  setSidebarCollapsed: (collapsed) => {
    saveSidebarStateToStorage(collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  loadUiPreferences: () => {
    const collapsed = loadSidebarStateFromStorage();
    set({ sidebarCollapsed: collapsed });
  },
}));

export default useUiStore;
