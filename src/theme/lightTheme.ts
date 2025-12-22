/**
 * 浅色主题配置
 * 柔和的蓝绿到淡紫渐变背景，玻璃态卡片
 */
import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    // 主色调：柔和的蓝色（降低饱和度）
    colorPrimary: '#5B8DEF',
    colorInfo: '#5B8DEF',
    colorSuccess: '#52c41a',
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

    // 背景色（微妙的渐变基底）
    colorBgLayout: '#f8f9fc',
    colorBgContainer: 'rgba(255, 255, 255, 0.8)',
    colorBgElevated: 'rgba(255, 255, 255, 0.95)',

    // 边框
    colorBorder: 'rgba(0, 0, 0, 0.06)',
    colorBorderSecondary: 'rgba(0, 0, 0, 0.04)',

    // 文本
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',

    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },

  components: {
    Button: {
      borderRadius: 12,
      controlHeight: 38,
      controlHeightLG: 44,
      paddingContentHorizontal: 20,
      // Primary 按钮配置
      colorTextLightSolid: '#ffffff', // Primary 按钮文字颜色（白色，确保在深色背景上清晰）
      colorPrimaryText: '#5B8DEF',
      colorPrimaryTextHover: '#4070D9',
      colorPrimaryTextActive: '#2F5BC7',
          },
    Input: {
      borderRadius: 12,
      controlHeight: 42,
      paddingBlock: 10,
      paddingInline: 16,
          },
    Modal: {
      borderRadiusLG: 16,
      paddingContentHorizontalLG: 24,
    },
  },
};

// CSS 变量映射
export const lightCSSVars = {
  // 背景渐变
  '--bg-gradient': 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 50%, #fff5f7 100%)',
  '--bg-glass': 'rgba(255, 255, 255, 0.7)',
  '--bg-glass-strong': 'rgba(255, 255, 255, 0.9)',

  // 消息背景（玻璃态）
  '--msg-user-bg': 'linear-gradient(135deg, rgba(91, 141, 239, 0.12) 0%, rgba(130, 119, 239, 0.08) 100%)',
  '--msg-user-border': 'rgba(91, 141, 239, 0.15)',
  '--msg-assistant-bg': 'rgba(255, 255, 255, 0.6)',
  '--msg-assistant-border': 'rgba(0, 0, 0, 0.06)',

  // Sidebar 背景
  '--sidebar-bg': 'rgba(248, 249, 252, 0.8)',
  '--sidebar-item-hover': 'rgba(91, 141, 239, 0.08)',
  '--sidebar-item-active': 'rgba(91, 141, 239, 0.12)',

  // 玻璃态效果
  '--glass-blur': 'blur(20px)',
  '--glass-border': 'rgba(255, 255, 255, 0.3)',

  // 阴影
  '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
  '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.06)',
  '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.08)',
  '--shadow-glass': '0 8px 24px rgba(91, 141, 239, 0.08)',

  // 文本
  '--text-primary': 'rgba(0, 0, 0, 0.88)',
  '--text-secondary': 'rgba(0, 0, 0, 0.65)',
  '--text-tertiary': 'rgba(0, 0, 0, 0.45)',

  // 滚动条
  '--scrollbar-track': '#f1f3f9',
  '--scrollbar-thumb': '#c1c9d8',
  '--scrollbar-thumb-hover': '#a1aabf',

  // 输入框区域
  '--input-bg': 'rgba(255, 255, 255, 0.8)',
  '--input-border': 'rgba(0, 0, 0, 0.06)',
  '--input-focus-border': '#5B8DEF',
  '--input-focus-shadow': '0 0 0 2px rgba(91, 141, 239, 0.1), 0 0 16px rgba(91, 141, 239, 0.15)',
  '--input-placeholder': 'rgba(0, 0, 0, 0.45)',

  // 提示文本
  '--hint-bg': 'rgba(91, 141, 239, 0.08)',
  '--hint-text': 'rgba(91, 141, 239, 0.88)',
  '--hint-border': 'rgba(91, 141, 239, 0.15)',

  // 边框颜色
  '--border-light': '#f0f0f0',
  '--border-medium': '#e0e0e0',

  // Markdown 代码块
  '--code-bg': '#1e1e1e',
  '--code-inline-bg': '#f5f5f5',
  '--code-inline-text': '#d73a49',

  // 表格
  '--table-header-bg': '#f5f5f5',
  '--table-row-even-bg': '#fafafa',
  '--table-border': '#ddd',

  // 引用
  '--blockquote-border': '#ddd',
  '--blockquote-text': '#666',

  // 链接
  '--link-color': '#5B8DEF',
  '--link-hover': '#1890ff',

  // 加载动画
  '--loading-color': '#5B8DEF',

  // 思考时间线
  '--timeline-bg': '#fafafa',
  '--timeline-border': '#f0f0f0',
  '--timeline-text': 'rgba(0, 0, 0, 0.88)',

  // 按钮颜色
  '--btn-primary-bg': '#5B8DEF',
  '--btn-primary-text': '#ffffff',
  '--btn-primary-hover-bg': '#4070D9',
  '--btn-primary-hover-text': '#ffffff',
  '--btn-send-bg': 'var(--btn-primary-bg)',
  '--btn-send-text': 'var(--btn-primary-text)',
  '--btn-send-hover-bg': 'var(--btn-primary-hover-bg)',
  '--btn-send-hover-text': 'var(--btn-primary-hover-text)',
  '--btn-send-active-bg': 'var(--btn-primary-bg)',
  '--btn-send-border': 'transparent',
  '--btn-disabled-bg': 'rgba(0, 0, 0, 0.04)',
  '--btn-disabled-text': 'rgba(0, 0, 0, 0.35)',

  // 状态颜色
  '--success-color': '#52c41a',
  '--error-color': '#f5576c',

  // 标签颜色（用于 SourceTag 等）
  '--tag-blue-bg': 'rgba(91, 141, 239, 0.1)',
  '--tag-blue-text': '#5B8DEF',
  '--tag-blue-border': 'rgba(91, 141, 239, 0.2)',
  '--tag-green-bg': 'rgba(82, 196, 26, 0.1)',
  '--tag-green-text': '#52c41a',
  '--tag-green-border': 'rgba(82, 196, 26, 0.2)',
  '--tag-orange-bg': 'rgba(250, 173, 20, 0.1)',
  '--tag-orange-text': '#faad14',
  '--tag-orange-border': 'rgba(250, 173, 20, 0.2)',
  '--tag-purple-bg': 'rgba(114, 46, 209, 0.1)',
  '--tag-purple-text': '#722ed1',
  '--tag-purple-border': 'rgba(114, 46, 209, 0.2)',
};
