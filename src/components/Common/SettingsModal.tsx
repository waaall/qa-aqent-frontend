/**
 * 设置面板组件
 */

import React from 'react';
import { Modal, Tabs, Typography } from 'antd';
import {
  BgColorsOutlined,
  FileTextOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { ThemeToggle } from './ThemeToggle';
import { DocumentManagement } from './DocumentManagement';
import { DatabaseQuery } from './DatabaseQuery';
import config from '@/config';
import styles from './SettingsModal.module.css';

const { Text } = Typography;

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const tabItems = [
    {
      key: 'theme',
      label: (
        <span className={styles.tabLabel}>
          <BgColorsOutlined />
          主题
        </span>
      ),
      children: (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <Text type="secondary" className={styles.sectionDesc}>
              选择浅色、深色主题，或跟随系统设置自动切换
            </Text>
            <div className={styles.sectionContent}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'documents',
      label: (
        <span className={styles.tabLabel}>
          <FileTextOutlined />
          文档管理
        </span>
      ),
      children: (
        <div className={styles.tabContent}>
          <DocumentManagement />
        </div>
      ),
    },
    {
      key: 'database',
      label: (
        <span className={styles.tabLabel}>
          <DashboardOutlined />
          数据库
        </span>
      ),
      children: (
        <div className={styles.tabContent}>
          <DatabaseQuery />
        </div>
      ),
    },
    {
      key: 'about',
      label: (
        <span className={styles.tabLabel}>
          <InfoCircleOutlined />
          关于
        </span>
      ),
      children: (
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <div className={styles.aboutContent}>
              <Text className={styles.appTitle}>{config.appTitle}</Text>
              <Text type="secondary" className={styles.version}>
                版本 {config.app.version}
              </Text>
              <Text type="secondary" className={styles.description}>
                {config.app.description}
              </Text>
              {/* 可选：显示作者 */}
              {config.app.author && (
                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                  作者：{config.app.author}
                </Text>
              )}
              {/* 可选：显示仓库链接 */}
              {config.app.repository && (
                <a
                  href={config.app.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: 8, display: 'block', color: 'var(--primary-color)' }}
                >
                  GitHub 仓库
                </a>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <Text className={styles.titleText}>系统设置</Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="95vw"
      className={styles.modal}
      styles={{
        body: { padding: 0 },
      }}
    >
      <Tabs
        items={tabItems}
        defaultActiveKey="theme"
        className={styles.tabs}
        tabBarStyle={{ paddingLeft: 24, paddingRight: 24 }}
      />
    </Modal>
  );
};

export default SettingsModal;
