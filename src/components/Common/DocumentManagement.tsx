/**
 * 文档管理组件
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Tooltip, Empty } from 'antd';
import { UploadOutlined, ReloadOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { documentApi } from '@/services';
import type { Document } from '@/types';
import config from '@/config';
import { formatFileSize, formatRelativeTime } from '@/utils/formatters';
import { UploadDocumentModal } from './UploadDocumentModal';
import styles from './DocumentManagement.module.css';

const { Text } = Typography;

export const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentApi.list();
      if (response.success) {
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getLabelConfig = (labelValue: string) => {
    return config.documents.labels.find((l) => l.value === labelValue) || {
      value: labelValue,
      label: labelValue,
      color: 'default',
    };
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === '.pdf') {
      return <FilePdfOutlined style={{ color: '#f5222d', fontSize: 16 }} />;
    }
    return <FileTextOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
  };

  const columns: ColumnsType<Document> = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      width: '30%',
      render: (text: string, record: Document) => (
        <Space size={8}>
          {getFileIcon(record.file_type)}
          <Text className={styles.filename} title={text}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      width: '15%',
      render: (label: string) => {
        const labelConfig = getLabelConfig(label);
        return (
          <Tag color={labelConfig.color} className={styles.tag}>
            {labelConfig.label}
          </Tag>
        );
      },
      filters: config.documents.labels.map((l) => ({
        text: l.label,
        value: l.value,
      })),
      onFilter: (value, record) => record.label === value,
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: '10%',
      render: (type: string) => (
        <Text className={styles.fileType}>{type.toUpperCase()}</Text>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: '12%',
      render: (size: number) => (
        <Text className={styles.size}>{formatFileSize(size)}</Text>
      ),
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: '修改时间',
      dataIndex: 'modified',
      key: 'modified',
      width: '18%',
      render: (modified: number) => (
        <Tooltip title={new Date(modified * 1000).toLocaleString()}>
          <Text className={styles.time}>{formatRelativeTime(modified)}</Text>
        </Tooltip>
      ),
      sorter: (a, b) => a.modified - b.modified,
      defaultSortOrder: 'descend',
    },
    {
      title: '存储位置',
      dataIndex: 'storage',
      key: 'storage',
      width: '15%',
      render: (storage: string) => (
        <Tag className={styles.storageTag}>
          {storage === 'documents' ? '原始文档' : '已处理'}
        </Tag>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      {/* 操作栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Text className={styles.title}>文档库</Text>
          <Text type="secondary" className={styles.count}>
            {documents.length} 个文档
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDocuments}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
            className={styles.uploadBtn}
          >
            上传文档
          </Button>
        </Space>
      </div>

      {/* 文档列表 */}
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey={(record) => `${record.storage}-${record.relative_path}`}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个文档`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无文档"
              />
            ),
          }}
          className={styles.table}
        />
      </div>

      {/* 上传弹窗 */}
      <UploadDocumentModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};

export default DocumentManagement;
