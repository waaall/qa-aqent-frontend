/**
 * 页面头部组件
 */

import React, { useState } from 'react';
import { Button, Tooltip, Upload, message } from 'antd';
import {
  UploadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import config from '@/config';
import { documentApi } from '@/services';
import { UploadTaskStatus } from '@/types';
import { UploadProgressModal, SettingsModal, SystemInfoModal } from '@/components/Common';
import logger from '@/utils/logger';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  // 系统信息弹窗状态
  const [systemInfoModalOpen, setSystemInfoModalOpen] = useState(false);

  // 上传相关状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);

  // 设置面板状态
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // 处理文档上传
  const handleUpload = async (file: File) => {
    try {
      const response = await documentApi.upload(file);

      if (response.task_id) {
        // 异步上传，显示进度弹窗
        setUploadTaskId(response.task_id);
        setUploadModalVisible(true);
      } else {
        // 同步上传（向后兼容）
        message.success('上传成功');
      }

      return false; // 阻止 Upload 组件默认行为
    } catch (error) {
      message.error('上传失败');
      logger.error('Upload failed', error);
      return false;
    }
  };

  // 上传完成回调
  const handleUploadComplete = (status: UploadTaskStatus) => {
    if (status.status === 'completed') {
      message.success('文档上传成功');
    } else if (status.status === 'failed') {
      message.error('文档上传失败');
    }
    setUploadModalVisible(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <h1 className={styles.title}>{config.appTitle}</h1>
      </div>

      <div className={styles.actions}>
        <Upload
          accept=".pdf,.md"
          beforeUpload={handleUpload}
          showUploadList={false}
        >
          <Tooltip title="上传 PDF 或 Markdown 文档">
            <Button
              type="text"
              icon={<UploadOutlined />}
            >
              上传文档
            </Button>
          </Tooltip>
        </Upload>

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

      {/* 上传进度 Modal */}
      <UploadProgressModal
        taskId={uploadTaskId}
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onComplete={handleUploadComplete}
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
