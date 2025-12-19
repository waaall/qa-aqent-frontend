/**
 * 上传进度弹窗组件
 */
import React, { useEffect, useState } from 'react';
import { Modal, Progress, Space, Typography, Alert } from 'antd';
import { documentApi } from '@/services';
import { UploadTaskStatus } from '@/types';
import logger from '@/utils/logger';
import styles from './UploadProgressModal.module.css';

const { Text } = Typography;

interface UploadProgressModalProps {
  taskId: string | null;
  visible: boolean;
  onClose: () => void;
  onComplete?: (status: UploadTaskStatus) => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  taskId,
  visible,
  onClose,
  onComplete,
}) => {
  const [status, setStatus] = useState<UploadTaskStatus | null>(null);

  useEffect(() => {
    if (!taskId || !visible) return;

    documentApi
      .pollUploadStatus(taskId, (currentStatus) => {
        setStatus(currentStatus);
      })
      .then((finalStatus) => {
        onComplete?.(finalStatus);
      })
      .catch((error) => {
        logger.error('Upload polling error', error);
      });
  }, [taskId, visible, onComplete]);

  // 计算进度百分比
  const getProgressPercent = () => {
    if (!status) return 0;

    const { progress, status: taskStatus } = status;

    if (taskStatus === 'completed') return 100;
    if (taskStatus === 'failed') return 0;

    // preprocessing: 0-50%, indexing: 50-100%
    let percent = 0;
    if (progress.preprocessing === 'completed' || progress.preprocessing === 'skipped') {
      percent = 50;
    } else if (progress.preprocessing === 'in_progress') {
      percent = 25;
    }

    if (progress.indexing === 'completed') {
      percent = 100;
    } else if (progress.indexing === 'in_progress') {
      percent = 75;
    }

    return percent;
  };

  const progressPercent = getProgressPercent();
  const hasErrors = status?.errors && status.errors.length > 0;

  return (
    <Modal
      title="文档上传进度"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      className={styles.modal}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 文件信息 */}
        <div>
          <Text strong>文件名：</Text>
          <Text>{status?.filename || '加载中...'}</Text>
        </div>

        {/* 进度条 */}
        <Progress
          percent={progressPercent}
          status={status?.status === 'failed' ? 'exception' : 'active'}
        />

        {/* 当前阶段 */}
        <div>
          <Text strong>当前阶段：</Text>
          <Text>{status?.stage || '准备中...'}</Text>
        </div>

        {/* 错误信息 */}
        {hasErrors && (
          <Alert
            message="上传失败"
            description={
              <ul className={styles.errorList}>
                {status!.errors.map((err, idx) => (
                  <li key={idx}>{err.message}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
          />
        )}

        {/* 完成信息 */}
        {status?.status === 'completed' && (
          <Alert
            message="上传成功"
            description={`文档已成功索引，当前共 ${status.total_count} 个文档`}
            type="success"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};

export default UploadProgressModal;
