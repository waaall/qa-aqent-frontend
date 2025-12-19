/**
 * 页面头部组件
 */

import React, { useState } from 'react';
import { Button, Tooltip, Badge, Modal, Descriptions, Upload, message } from 'antd';
import {
  UploadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import config from '@/config';
import { systemApi, documentApi } from '@/services';
import { HealthResponse, UploadTaskStatus } from '@/types';
import { UploadProgressModal } from '@/components/Common';
import logger from '@/utils/logger';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 上传相关状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);

  const handleCheckHealth = async () => {
    setLoading(true);
    try {
      const data = await systemApi.checkHealth();
      setHealthData(data);
      setHealthModalOpen(true);
    } catch (error) {
      logger.error('Failed to check health', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge status="success" text="正常" />;
      case 'degraded':
        return <Badge status="warning" text="降级" />;
      case 'unhealthy':
        return <Badge status="error" text="异常" />;
      default:
        return <Badge status="default" text="未知" />;
    }
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
            onClick={handleCheckHealth}
            loading={loading}
          >
            系统状态
          </Button>
        </Tooltip>

        <Tooltip title="设置（暂未实现）">
          <Button
            type="text"
            icon={<SettingOutlined />}
            disabled
          />
        </Tooltip>
      </div>

      {/* 系统状态 Modal */}
      <Modal
        title="系统状态"
        open={healthModalOpen}
        onCancel={() => setHealthModalOpen(false)}
        footer={null}
      >
        {healthData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="系统状态">
              {getStatusBadge(healthData.status)}
            </Descriptions.Item>

            {healthData.llm && (
              <>
                <Descriptions.Item label="LLM 提供商">
                  {healthData.llm.provider || '未知'}
                </Descriptions.Item>

                <Descriptions.Item label="LLM 状态">
                  {healthData.llm.ready ? (
                    <Badge status="success" text="就绪" />
                  ) : (
                    <Badge status="error" text="未就绪" />
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="当前模型">
                  {healthData.llm.current_model || '未知'}
                </Descriptions.Item>
              </>
            )}

            <Descriptions.Item label="检查时间">
              {healthData.timestamp}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 上传进度 Modal */}
      <UploadProgressModal
        taskId={uploadTaskId}
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onComplete={handleUploadComplete}
      />
    </div>
  );
};

export default Header;
