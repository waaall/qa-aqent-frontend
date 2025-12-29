/**
 * 文档上传弹窗组件
 */

import React, { useState } from 'react';
import { Modal, Upload, Select, Space, Typography, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { documentApi } from '@/services';
import config from '@/config';
import type { UploadTaskStatus, UnifiedTaskInfo } from '@/types';
import styles from './UploadDocumentModal.module.css';

const { Dragger } = Upload;
const { Text } = Typography;

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onTaskUpdate?: (taskInfo: UnifiedTaskInfo) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  open,
  onClose,
  onSuccess,
  onTaskUpdate,
}) => {
  const defaultLabel = config.documents.labels[0]?.value ?? 'general';
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const clearSelectedFile = () => {
    setCurrentFile(null);
  };

  const handleClose = () => {
    if (!uploading) {
      clearSelectedFile();
      onClose();
    }
  };

  const validateFile = (file: File) => {
    // 文件大小检查
    if (file.size > config.documents.maxFileSize) {
      message.error(`文件大小超过限制（最大 ${config.documents.maxFileSize / 1024 / 1024}MB）`);
      return false;
    }

    // 文件类型检查
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}` as (typeof config.documents.supportedExtensions)[number];
    if (!config.documents.supportedExtensions.includes(fileExt)) {
      message.error(`不支持的文件类型，仅支持：${config.documents.supportedExtensions.join('、')}`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) {
      return Upload.LIST_IGNORE;
    }

    setCurrentFile(file);
    return false;
  };

  // 映射上传状态
  const mapUploadStatus = (
    status: UploadTaskStatus['status']
  ): UnifiedTaskInfo['status'] => {
    if (status === 'pending') return 'pending';
    if (status === 'preprocessing' || status === 'indexing') return 'processing';
    if (status === 'completed') return 'completed';
    if (status === 'failed') return 'failed';
    return 'pending';
  };

  // 计算进度百分比（复用现有逻辑）
  const calculateProgress = (status?: UploadTaskStatus): number => {
    if (!status) return 0;

    const { status: taskStatus, progress } = status;

    if (taskStatus === 'pending') return 10;
    if (taskStatus === 'preprocessing') {
      return progress.preprocessing === 'completed' ? 40 : 25;
    }
    if (taskStatus === 'indexing') {
      return progress.indexing === 'completed' ? 100 : 70;
    }
    if (taskStatus === 'completed') return 100;
    if (taskStatus === 'failed') return 0;

    return 0;
  };

  // 获取阶段描述（复用现有逻辑）
  const getStage = (status?: UploadTaskStatus): string => {
    if (!status) return '等待上传';

    const { status: taskStatus, stage } = status;

    if (stage) return stage;
    if (taskStatus === 'pending') return '等待处理';
    if (taskStatus === 'preprocessing') return '预处理中';
    if (taskStatus === 'indexing') return '构建索引中';
    if (taskStatus === 'completed') return '完成';
    if (taskStatus === 'failed') return '失败';

    return '处理中';
  };

  const handleStartUpload = async () => {
    if (!currentFile) {
      message.warning('请先选择文件');
      return;
    }

    setUploading(true);

    try {
      // 上传文件
      const response = await documentApi.upload(currentFile, selectedLabel);

      if (!response.success || !response.task_id) {
        message.error('上传失败，请重试');
        return;
      }

      const taskId = response.task_id;
      const filename = currentFile.name;

      message.success('文件上传成功，正在后台处理...');

      // 通知父组件添加任务
      onTaskUpdate?.({
        taskId,
        type: 'upload',
        filename,
        status: 'pending',
        progress: 10,
        stage: '等待处理',
        createdAt: Date.now(),
      });

      // 上传完成后可继续选择文件
      clearSelectedFile();
      onClose();

      // 在后台继续轮询任务状态
      documentApi.pollUploadStatus(taskId, (status) => {
        // 通知父组件更新任务进度
        const progress = calculateProgress(status);
        const stage = getStage(status);

        onTaskUpdate?.({
          taskId,
          type: 'upload',
          filename,
          status: mapUploadStatus(status.status),
          progress,
          stage,
          createdAt: Date.now(),
          errors: status.errors,
        });
      }).then((finalStatus) => {
        if (finalStatus?.status === 'completed') {
          message.success(`文档 ${filename} 处理完成！`);

          // 通知父组件任务完成
          onTaskUpdate?.({
            taskId,
            type: 'upload',
            filename,
            status: 'completed',
            progress: 100,
            stage: '完成',
            createdAt: Date.now(),
            completedAt: Date.now(),
          });

          onSuccess();
        } else if (finalStatus?.status === 'failed') {
          message.error(`文档 ${filename} 处理失败`);
        }
      }).catch((error) => {
        console.error('Poll upload status failed:', error);
      });
    } catch (error) {
      message.error('上传失败，请重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    maxCount: 1,
    accept: config.documents.supportedExtensions.join(','),
    beforeUpload: handleFileSelect,
    disabled: uploading,
  };

  return (
    <Modal
      title="上传文档"
      open={open}
      onCancel={handleClose}
      footer={null}
      width="95vw"
      closable={!uploading}
      maskClosable={!uploading}
      className={styles.modal}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 文件上传 */}
        <Dragger {...uploadProps} className={styles.dragger}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持格式: {config.documents.supportedExtensions.join('、')}
            <br />
            最大文件大小: {config.documents.maxFileSize / 1024 / 1024}MB
            <br />
            选择文件后可设置标签并开始上传
          </p>
        </Dragger>

        {currentFile && !uploading && (
          <div className={styles.selectionSection}>
            <div className={styles.fileSummary}>
              <Text className={styles.fileName}>{currentFile.name}</Text>
              <Button
                type="link"
                onClick={clearSelectedFile}
                className={styles.resetBtn}
              >
                重新选择
              </Button>
            </div>
            {/* 标签选择 */}
            <div className={styles.labelSection}>
              <Text strong className={styles.label}>文档标签</Text>
              <Select
                value={selectedLabel}
                onChange={setSelectedLabel}
                disabled={uploading}
                className={styles.labelSelect}
                size="large"
              >
                {config.documents.labels.map((label) => (
                  <Select.Option key={label.value} value={label.value}>
                    <span className={styles.labelOption} data-color={label.color}>
                      {label.label}
                    </span>
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className={styles.actions}>
              <Button type="primary" onClick={handleStartUpload} loading={uploading}>
                开始上传
              </Button>
            </div>
          </div>
        )}

        {uploading && (
          <div className={styles.uploadingHint}>
            <Text type="secondary">正在上传文件，请稍候...</Text>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default UploadDocumentModal;
