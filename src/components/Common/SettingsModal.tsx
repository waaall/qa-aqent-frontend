/**
 * 设置面板组件
 */

import React from 'react';
import { Modal, Typography, Divider, Space } from 'antd';
import { ThemeToggle } from './ThemeToggle';
import styles from './SettingsModal.module.css';

const { Title, Text } = Typography;

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      className={styles.modal}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 主题设置 */}
        <div className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            主题设置
          </Title>
          <Text type="secondary" className={styles.sectionDesc}>
            选择浅色、深色主题，或跟随系统设置自动切换
          </Text>
          <div className={styles.sectionContent}>
            <ThemeToggle />
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        {/* 其他设置区域预留 */}
        <div className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            关于
          </Title>
          <Text type="secondary">
            电厂智能问答系统 v1.0
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default SettingsModal;
