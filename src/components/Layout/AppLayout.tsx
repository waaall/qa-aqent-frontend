/**
 * 应用主布局组件
 */

import React from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { SessionList } from '@/components/Sidebar';
import { ChatContainer } from '@/components/Chat';
import config from '@/config';
import styles from './AppLayout.module.css';

const { Sider, Content } = Layout;

export const AppLayout: React.FC = () => {
  return (
    <Layout className={styles.layout}>
      <Header />

      <Layout className={styles.body}>
        <Sider
          width={config.ui.sidebarWidth}
          className={styles.sider}
          breakpoint="lg"
          collapsedWidth="0"
        >
          <SessionList />
        </Sider>

        <Content className={styles.content}>
          <ChatContainer />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
