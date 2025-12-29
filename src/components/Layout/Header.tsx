/**
 * 页面头部组件
 */

import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import config from '@/config';
import { SettingsModal, SystemInfoModal } from '@/components/Common';
import { useUiStore } from '@/stores/uiStore';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  // 系统信息弹窗状态
  const [systemInfoModalOpen, setSystemInfoModalOpen] = useState(false);

  // 设置面板状态
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // 侧边栏状态
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        {/* 侧边栏折叠按钮 */}
        <Tooltip title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            className={styles.sidebarToggle}
          />
        </Tooltip>

        <h1 className={styles.title}>{config.appTitle}</h1>
      </div>

      <div className={styles.actions}>
        <Tooltip title="系统状态">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={() => setSystemInfoModalOpen(true)}
          >
            系统状态
          </Button>
        </Tooltip>

        <Tooltip title="设置">
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalOpen(true)}
          />
        </Tooltip>
      </div>

      {/* 系统信息 Modal */}
      <SystemInfoModal
        open={systemInfoModalOpen}
        onClose={() => setSystemInfoModalOpen(false)}
      />

      {/* 设置面板 */}
      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Header;
