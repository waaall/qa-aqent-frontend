/**
 * 文档上传弹窗组件
 */

import React, { useState } from 'react';
import { Modal, Upload, Select, Progress, Space, Typography, Alert, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { documentApi } from '@/services';
import config from '@/config';
import type { UploadTaskStatus } from '@/types';
import styles from './UploadDocumentModal.module.css';

const { Dragger } = Upload;
const { Text } = Typography;

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [selectedLabel, setSelectedLabel] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadTaskStatus | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleClose = () => {
    if (!uploading) {
      setUploadStatus(null);
      setCurrentFile(null);
      onClose();
    }
  };

  const handleUpload = async (file: File) => {
    // 文件大小检查
    if (file.size > config.documents.maxFileSize) {
      message.error(`文件大小超过限制（最大 ${config.documents.maxFileSize / 1024 / 1024}MB）`);
      return false;
    }

    // 文件类型检查
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!config.documents.supportedExtensions.includes(fileExt)) {
      message.error(`不支持的文件类型，仅支持：${config.documents.supportedExtensions.join('、')}`);
      return false;
    }

    setCurrentFile(file);
    setUploading(true);
    setUploadStatus(null);

    try {
      // 上传文件
      const response = await documentApi.upload(file, selectedLabel);

      if (response.success && response.task_id) {
        message.success('文件上传成功，开始处理...');

        // 轮询任务状态
        await documentApi.pollUploadStatus(response.task_id, (status) => {
          setUploadStatus(status);
        });

        const finalStatus = uploadStatus;
        if (finalStatus?.status === 'completed') {
          message.success('文档处理完成！');
          onSuccess();
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else if (finalStatus?.status === 'failed') {
          message.error('文档处理失败，请重试');
        }
      }
    } catch (error) {
      message.error('上传失败，请重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }

    return false;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: handleUpload,
    disabled: uploading,
  };

  const getProgressPercent = (): number => {
    if (!uploadStatus) return 0;

    const { status, progress } = uploadStatus;

    if (status === 'pending') return 10;
    if (status === 'preprocessing') {
      return progress.preprocessing === 'completed' ? 40 : 25;
    }
    if (status === 'indexing') {
      return progress.indexing === 'completed' ? 100 : 70;
    }
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;

    return 0;
  };

  const getStatusText = (): string => {
    if (!uploadStatus) return '等待上传';

    const { status, stage } = uploadStatus;

    if (stage) return stage;
    if (status === 'pending') return '等待处理';
    if (status === 'preprocessing') return '预处理中';
    if (status === 'indexing') return '构建索引中';
    if (status === 'completed') return '完成';
    if (status === 'failed') return '失败';

    return '处理中';
  };

  return (
    <Modal
      title="上传文档"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={560}
      closable={!uploading}
      maskClosable={!uploading}
      className={styles.modal}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
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
          </p>
        </Dragger>

        {/* 上传进度 */}
        {(uploading || uploadStatus) && (
          <div className={styles.progressSection}>
            {currentFile && (
              <Text className={styles.fileName}>{currentFile.name}</Text>
            )}
            <Progress
              percent={getProgressPercent()}
              status={uploadStatus?.status === 'failed' ? 'exception' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text type="secondary" className={styles.statusText}>
              {getStatusText()}
            </Text>

            {/* 错误信息 */}
            {uploadStatus?.errors && uploadStatus.errors.length > 0 && (
              <Alert
                message="处理错误"
                description={uploadStatus.errors.map((err, idx) => (
                  <div key={idx}>
                    [{err.stage}] {err.message}
                  </div>
                ))}
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default UploadDocumentModal;
