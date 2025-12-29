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
  const { sidebarCollapsed, toggleSidebar, loadUiPreferences } = useUiStore();

  // 判断是否为移动端
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 组件挂载时加载用户偏好
  useEffect(() => {
    loadUiPreferences();
  }, [loadUiPreferences]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
