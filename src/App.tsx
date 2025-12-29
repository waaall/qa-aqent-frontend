/**
 * 主应用组件
 */

import React, { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/Layout';
import config from '@/config';
import { useThemeStore } from '@/stores/themeStore';
import { lightTheme, darkTheme, lightCSSVars, darkCSSVars } from '@/theme';
import './App.css';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const layoutCSSVars = {
  '--modal-width-narrow': `${config.ui.containerMaxWidth.narrow}px`,
  '--modal-width-medium': `${config.ui.containerMaxWidth.medium}px`,
  '--modal-width-wide': `${config.ui.containerMaxWidth.wide}px`,
  '--panel-max-height': `${config.ui.scrollMaxHeight.panel}px`,
  '--header-height-normal': `${config.ui.headerHeight.normal}px`,
  '--header-height-landscape': `${config.ui.headerHeight.landscape}px`,
  '--table-min-col-desktop': `${config.ui.table.minColumnWidth.desktop}px`,
  '--table-min-col-mobile': `${config.ui.table.minColumnWidth.mobile}px`,
};

const App: React.FC = () => {
  const { currentTheme, loadThemePreference, isTransitioning } = useThemeStore();

  // 加载主题偏好
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // 应用 CSS 变量
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = currentTheme === 'light' ? lightCSSVars : darkCSSVars;

    Object.entries({ ...cssVars, ...layoutCSSVars }).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // 设置 data-theme 属性用于 CSS 选择器
    root.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // 选择 Ant Design 主题
  const antdThemeConfig = currentTheme === 'light' ? lightTheme : darkTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={antdThemeConfig}
      >
        <div className={`app-container ${isTransitioning ? 'theme-transitioning' : ''}`}>
          <AppLayout />
        </div>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
