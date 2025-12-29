/**
 * 应用主布局组件
 */

import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { SessionList } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import { useUiStore } from '@/stores/uiStore';
import config from '@/config';
import styles from './AppLayout.module.css';

const { Sider, Content } = Layout;

export const AppLayout: React.FC = () => {
  // 获取侧边栏状态
  const { sidebarCollapsed, toggleSidebar, setSidebarCollapsed, loadUiPreferences } = useUiStore();

  // 判断是否为移动端
  const [isMobile, setIsMobile] = useState(window.innerWidth < config.ui.breakpoints.mobile);

  // 组件挂载时加载用户偏好并根据窗口宽度调整
  useEffect(() => {
    loadUiPreferences();

    // 加载偏好后，根据当前窗口宽度强制调整
    const width = window.innerWidth;
    if (width >= config.ui.breakpoints.desktop) {
      // 宽屏幕强制展开
      setSidebarCollapsed(false);
    } else if (width < config.ui.breakpoints.mobile) {
      // 窄屏幕强制收起
      setSidebarCollapsed(true);
    }
    // mobile-desktop 之间保持加载的用户偏好
  }, [loadUiPreferences, setSidebarCollapsed]);

  // 监听窗口大小变化，自动展开/收起侧边栏
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // 防抖：延迟 150ms 执行
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const isNowMobile = width < config.ui.breakpoints.mobile;
        setIsMobile(isNowMobile);

        // 根据窗口宽度自动展开/收起侧边栏
        if (width >= config.ui.breakpoints.desktop && sidebarCollapsed) {
          // 桌面端：自动展开
          setSidebarCollapsed(false);
        } else if (width < config.ui.breakpoints.mobile && !sidebarCollapsed) {
          // 移动端：自动收起
          setSidebarCollapsed(true);
        }
        // 中间态（平板）：保持当前状态
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarCollapsed, setSidebarCollapsed]);

  return (
    <Layout className={styles.layout}>
      <Header />

      <Layout className={styles.body}>
        <Sider
          width={config.ui.sidebarWidth}
          className={styles.sider}
          collapsed={sidebarCollapsed}
          collapsedWidth={0}
          trigger={null}
        >
          <SessionList />
        </Sider>

        <Content className={styles.content}>
          <ChatContainer />
        </Content>
      </Layout>

      {/* 移动端遮罩：覆盖整个页面，点击收起侧边栏 */}
      {!sidebarCollapsed && isMobile && (
        <div
          className={styles.overlay}
          onClick={toggleSidebar}
        />
      )}
    </Layout>
  );
};

export default AppLayout;
