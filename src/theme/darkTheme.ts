/**
 * 深色主题配置
 * 深蓝灰色基调，对比度适中，带微妙紫色调
 */
import type { ThemeConfig } from 'antd';

export const darkTheme: ThemeConfig = {
  token: {
    // 主色调：柔和的蓝紫色
    colorPrimary: '#7B9EF5',
    colorInfo: '#7B9EF5',
    colorSuccess: '#5ec269',
    colorWarning: '#faad14',
    colorError: '#f5576c',

    // 圆角
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,

    // 字体
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    margin: 16,
    marginLG: 24,

    // 背景色（深蓝灰，非纯黑）
    colorBgLayout: '#1a1d2e',
    colorBgContainer: 'rgba(30, 34, 51, 0.7)',
    colorBgElevated: 'rgba(38, 43, 64, 0.9)',

    // 边框
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',

    // 文本
    colorText: 'rgba(255, 255, 255, 0.88)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    // 带背景色文本（如 Primary 按钮文字）
    colorTextLightSolid: '#1a1d2e',

    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },

  components: {
    Button: {
      borderRadius: 12,
      controlHeight: 38,
      controlHeightLG: 44,
      paddingContentHorizontal: 20,
      // 深色主题按钮配置
      colorBgContainer: 'rgba(38, 43, 64, 0.6)',
      colorBorder: 'rgba(123, 158, 245, 0.2)',
      colorText: 'rgba(255, 255, 255, 0.88)',
      // Primary 按钮 - 确保文字颜色清晰
      colorTextLightSolid: '#1a1d2e', // Primary 按钮文字颜色（深色，确保在浅色背景上清晰）
      colorPrimaryText: '#7B9EF5',
      colorPrimaryTextHover: '#9BB8F7',
      colorPrimaryTextActive: '#5B7DD5',
      primaryShadow: '0 2px 8px rgba(123, 158, 245, 0.3)',
      // Text 按钮文字颜色
      colorLink: 'rgba(255, 255, 255, 0.88)',
      colorLinkHover: 'rgba(255, 255, 255, 1)',
    },
    Input: {
      borderRadius: 12,
      controlHeight: 42,
      paddingBlock: 10,
      paddingInline: 16,
      // 深色主题输入框配置
      colorBgContainer: 'rgba(30, 34, 51, 0.6)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorText: 'rgba(255, 255, 255, 0.88)',
      colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
      // Focus 状态 - 柔和发光效果
      activeBorderColor: '#7B9EF5',
      activeShadow: '0 0 0 2px rgba(123, 158, 245, 0.15), 0 0 16px rgba(123, 158, 245, 0.2)',
      // Hover 状态
      hoverBorderColor: 'rgba(123, 158, 245, 0.3)',
    },
    Modal: {
      borderRadiusLG: 16,
      paddingContentHorizontalLG: 24,
      contentBg: 'rgba(30, 34, 51, 0.95)',
      headerBg: 'rgba(38, 43, 64, 0.9)',
    },
    Segmented: {
      // 主题切换器配置
      itemSelectedBg: 'rgba(123, 158, 245, 0.2)',
      itemSelectedColor: '#7B9EF5',
      itemHoverBg: 'rgba(123, 158, 245, 0.1)',
      trackBg: 'rgba(30, 34, 51, 0.6)',
    },
    Tooltip: {
      colorTextLightSolid: 'rgba(255, 255, 255, 0.88)',
    },
  },
};

// CSS 变量映射
export const darkCSSVars = {
  // 背景渐变（深蓝灰色调）
  '--bg-gradient': 'linear-gradient(135deg, #1a1d2e 0%, #1e2238 50%, #1a1e32 100%)',
  '--bg-glass': 'rgba(30, 34, 51, 0.6)',
  '--bg-glass-strong': 'rgba(38, 43, 64, 0.8)',

  // 消息背景（玻璃态）
  '--msg-user-bg': 'linear-gradient(135deg, rgba(123, 158, 245, 0.2) 0%, rgba(147, 134, 245, 0.15) 100%)',
  '--msg-user-border': 'rgba(123, 158, 245, 0.3)',
  '--msg-assistant-bg': 'rgba(38, 43, 64, 0.5)',
  '--msg-assistant-border': 'rgba(255, 255, 255, 0.08)',

  // Sidebar 背景
  '--sidebar-bg': 'rgba(22, 25, 38, 0.8)',
  '--sidebar-item-hover': 'rgba(123, 158, 245, 0.12)',
  '--sidebar-item-active': 'rgba(123, 158, 245, 0.2)',

  // 玻璃态效果
  '--glass-blur': 'blur(20px)',
  '--glass-border': 'rgba(255, 255, 255, 0.1)',

  // 阴影
  '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.5)',
  '--shadow-glass': '0 8px 24px rgba(0, 0, 0, 0.4)',

  // 文本
  '--text-primary': 'rgba(255, 255, 255, 0.88)',
  '--text-secondary': 'rgba(255, 255, 255, 0.65)',
  '--text-tertiary': 'rgba(255, 255, 255, 0.45)',

  // 滚动条
  '--scrollbar-track': '#262b40',
  '--scrollbar-thumb': '#4a5070',
  '--scrollbar-thumb-hover': '#5a6080',

  // 输入框区域
  '--input-bg': 'rgba(30, 34, 51, 0.6)',
  '--input-border': 'rgba(255, 255, 255, 0.1)',
  '--input-focus-border': '#7B9EF5',
  '--input-focus-shadow': '0 0 0 2px rgba(123, 158, 245, 0.15), 0 0 20px rgba(123, 158, 245, 0.25)',
  '--input-placeholder': 'rgba(255, 255, 255, 0.45)',

  // 提示文本
  '--hint-bg': 'rgba(123, 158, 245, 0.12)',
  '--hint-text': 'rgba(123, 158, 245, 0.88)',
  '--hint-border': 'rgba(123, 158, 245, 0.2)',

  // 边框颜色
  '--border-light': 'rgba(255, 255, 255, 0.08)',
  '--border-medium': 'rgba(255, 255, 255, 0.12)',

  // Markdown 代码块
  '--code-bg': 'rgba(20, 23, 35, 0.8)',
  '--code-inline-bg': 'rgba(123, 158, 245, 0.15)',
  '--code-inline-text': '#7B9EF5',

  // 表格
  '--table-header-bg': 'rgba(38, 43, 64, 0.6)',
  '--table-row-even-bg': 'rgba(30, 34, 51, 0.3)',
  '--table-border': 'rgba(255, 255, 255, 0.1)',

  // 引用
  '--blockquote-border': 'rgba(123, 158, 245, 0.4)',
  '--blockquote-text': 'rgba(255, 255, 255, 0.65)',

  // 链接
  '--link-color': '#7B9EF5',
  '--link-hover': '#9BB8F7',

  // 加载动画
  '--loading-color': '#7B9EF5',

  // 思考时间线
  '--timeline-bg': 'rgba(30, 34, 51, 0.4)',
  '--timeline-border': 'rgba(255, 255, 255, 0.08)',
  '--timeline-text': 'rgba(255, 255, 255, 0.88)',

  // 按钮颜色
  '--btn-primary-bg': '#7B9EF5',
  '--btn-primary-text': '#1a1d2e',
  '--btn-primary-hover-bg': '#9BB8F7',
  '--btn-primary-hover-text': '#1a1d2e',
  '--btn-send-bg': 'var(--btn-primary-bg)',
  '--btn-send-text': 'var(--btn-primary-text)',
  '--btn-send-hover-bg': 'var(--btn-primary-hover-bg)',
  '--btn-send-hover-text': 'var(--btn-primary-hover-text)',
  '--btn-send-active-bg': 'var(--btn-primary-bg)',
  '--btn-send-border': 'transparent',
  '--btn-disabled-bg': 'rgba(38, 43, 64, 0.3)',
  '--btn-disabled-text': 'rgba(255, 255, 255, 0.35)',

  // 状态颜色
  '--success-color': '#5ec269',
  '--error-color': '#f5576c',

  // 标签颜色（用于 SourceTag 等）
  '--tag-blue-bg': 'rgba(123, 158, 245, 0.2)',
  '--tag-blue-text': '#9BB8F7',
  '--tag-blue-border': 'rgba(123, 158, 245, 0.3)',
  '--tag-green-bg': 'rgba(94, 194, 105, 0.2)',
  '--tag-green-text': '#6ec378',
  '--tag-green-border': 'rgba(94, 194, 105, 0.3)',
  '--tag-orange-bg': 'rgba(250, 173, 20, 0.2)',
  '--tag-orange-text': '#ffc53d',
  '--tag-orange-border': 'rgba(250, 173, 20, 0.3)',
  '--tag-purple-bg': 'rgba(147, 134, 245, 0.2)',
  '--tag-purple-text': '#a89ef7',
  '--tag-purple-border': 'rgba(147, 134, 245, 0.3)',
};
