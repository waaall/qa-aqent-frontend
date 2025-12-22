/**
 * 主题状态管理 - Zustand Store
 */
import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'auto';
type ThemeType = 'light' | 'dark'; // 实际应用的主题

interface ThemeState {
  // 用户选择的模式（light/dark/auto）
  mode: ThemeMode;
  // 实际应用的主题（light/dark）
  currentTheme: ThemeType;
  // 是否正在切换主题（用于动画）
  isTransitioning: boolean;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setCurrentTheme: (theme: ThemeType) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  loadThemePreference: () => void;
}

// 从 localStorage 加载主题偏好
const loadThemeFromStorage = (): ThemeMode => {
  try {
    const stored = localStorage.getItem('qa_agent_theme_mode');
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load theme preference', e);
  }
  return 'auto'; // 默认跟随系统
};

// 保存主题偏好到 localStorage
const saveThemeToStorage = (mode: ThemeMode) => {
  try {
    localStorage.setItem('qa_agent_theme_mode', mode);
  } catch (e) {
    console.warn('Failed to save theme preference', e);
  }
};

// 检测系统主题
const getSystemTheme = (): ThemeType => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// 计算实际应用的主题
const resolveTheme = (mode: ThemeMode): ThemeType => {
  if (mode === 'auto') {
    return getSystemTheme();
  }
  return mode;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'auto',
  currentTheme: 'light',
  isTransitioning: false,

  setMode: (mode) => {
    saveThemeToStorage(mode);
    const currentTheme = resolveTheme(mode);

    // 触发过渡动画
    set({ isTransitioning: true });
    set({ mode, currentTheme });

    // 200ms 后结束过渡
    setTimeout(() => {
      set({ isTransitioning: false });
    }, 200);
  },

  setCurrentTheme: (theme) => {
    set({ currentTheme: theme });
  },

  setIsTransitioning: (transitioning) => {
    set({ isTransitioning: transitioning });
  },

  loadThemePreference: () => {
    const mode = loadThemeFromStorage();
    const currentTheme = resolveTheme(mode);
    set({ mode, currentTheme });
  },
}));

// 监听系统主题变化
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.mode === 'auto') {
      store.setCurrentTheme(e.matches ? 'dark' : 'light');
    }
  });
}

export default useThemeStore;
