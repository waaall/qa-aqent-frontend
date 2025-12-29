/**
 * 文档管理组件
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Typography, Tooltip, Empty, message } from 'antd';
import {
  UploadOutlined,
  ReloadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { documentApi } from '@/services';
import type { Document, UnifiedTaskInfo, UpdateTaskStatus } from '@/types';
import config from '@/config';
import { formatFileSize, formatRelativeTime } from '@/utils/formatters';
import { UploadDocumentModal } from './UploadDocumentModal';
import { TaskQueuePanel } from './TaskQueuePanel';
import { taskStorage } from '@/utils/taskStorage';
import styles from './DocumentManagement.module.css';

const { Text } = Typography;

export const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // 任务队列状态
  const [tasks, setTasks] = useState<UnifiedTaskInfo[]>([]);
  const [updating, setUpdating] = useState(false);

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

  // 加载持久化的任务并恢复轮询
  useEffect(() => {
    fetchDocuments();

    const savedTasks = taskStorage.load();
    setTasks(savedTasks);

    // 恢复未完成任务的轮询
    const activeTasks = savedTasks.filter(
      t => t.status !== 'completed' && t.status !== 'failed'
    );
    activeTasks.forEach(task => {
      if (task.type === 'update') {
        resumeUpdateTask(task.taskId);
      }
      // 上传任务的恢复由 UploadDocumentModal 组件处理
    });
  }, []);

  // 更新任务状态（通用）
  const updateTaskStatus = (taskId: string, updates: Partial<UnifiedTaskInfo>) => {
    setTasks(prev => {
      const updated = prev.map(t =>
        t.taskId === taskId ? { ...t, ...updates } : t
      );
      taskStorage.save(updated);
      return updated;
    });
  };

  // 计算更新任务进度
  const calculateUpdateProgress = (status: UpdateTaskStatus): number => {
    if (status.status === 'pending') return 5;

    if (status.status === 'loading') {
      // 如果有 total_count，使用精确计算
      if (status.total_count && status.documents_loaded !== undefined) {
        return Math.floor((status.documents_loaded / status.total_count) * 50);
      }
      return status.progress.loading === 'completed' ? 50 : 25;
    }

    if (status.status === 'updating') {
      return 50 + (status.progress.updating === 'completed' ? 45 : 25);
    }

    if (status.status === 'completed') return 100;
    if (status.status === 'failed') return 0;

    return 0;
  };

  // 映射状态
  const mapUpdateStatus = (
    status: UpdateTaskStatus['status']
  ): UnifiedTaskInfo['status'] => {
    if (status === 'pending') return 'pending';
    if (status === 'loading' || status === 'updating') return 'processing';
    if (status === 'completed') return 'completed';
    if (status === 'failed') return 'failed';
    return 'pending';
  };

  // 获取默认阶段描述
  const getDefaultStage = (status: string): string => {
    const stageMap: Record<string, string> = {
      pending: '等待处理',
      loading: '加载文档中',
      updating: '更新索引中',
      completed: '完成',
      failed: '失败',
    };
    return stageMap[status] || '处理中';
  };

  // 更新任务进度（更新任务）
  const updateTaskProgress = (taskId: string, status: UpdateTaskStatus) => {
    const progress = calculateUpdateProgress(status);
    const stage = status.stage || getDefaultStage(status.status);

    const updates: Partial<UnifiedTaskInfo> = {
      status: mapUpdateStatus(status.status),
      progress,
      stage,
      errors: status.errors,
    };

    if (status.status === 'completed') {
      updates.completedAt = Date.now();
    }

    updateTaskStatus(taskId, updates);
  };

  // 轮询更新任务
  const pollUpdateTask = async (taskId: string) => {
    try {
      const finalStatus = await documentApi.pollUpdateStatus(
        taskId,
        (status: UpdateTaskStatus) => {
          updateTaskProgress(taskId, status);
        }
      );

      // 完成后刷新文档列表
      if (finalStatus.status === 'completed') {
        message.success('向量库更新完成！');
        fetchDocuments();
      } else if (finalStatus.status === 'failed') {
        message.error('向量库更新失败');
      }
    } catch (error) {
      console.error('Poll update task failed:', error);
      updateTaskStatus(taskId, { status: 'failed', progress: 0 });
    }
  };

  // 恢复更新任务轮询
  const resumeUpdateTask = async (taskId: string) => {
    try {
      await pollUpdateTask(taskId);
    } catch (error) {
      console.error('Resume update task failed:', error);
    }
  };

  // 处理更新向量库
  const handleUpdateIndex = async () => {
    setUpdating(true);

    try {
      const response = await documentApi.updateIndex();

      if (response.success && response.task_id) {
        message.success('更新任务已提交');

        // 创建任务信息
        const taskInfo: UnifiedTaskInfo = {
          taskId: response.task_id,
          type: 'update',
          status: 'pending',
          progress: 5,
          stage: '等待处理',
          createdAt: Date.now(),
        };

        // 添加到任务列表和持久化
        setTasks(prev => {
          const updated = [taskInfo, ...prev];
          taskStorage.save(updated);
          return updated;
        });

        // 开始轮询
        await pollUpdateTask(response.task_id);
      }
    } catch (error) {
      message.error('提交更新任务失败');
      console.error('Update index error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // 移除任务
  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.taskId !== taskId);
      taskStorage.save(updated);
      return updated;
    });
  };

  // 清除已完成任务
  const handleClearCompleted = () => {
    setTasks(prev => {
      const updated = prev.filter(
        t => t.status !== 'completed' && t.status !== 'failed'
      );
      taskStorage.save(updated);
      return updated;
    });
  };

  // 处理任务更新回调（来自 UploadDocumentModal）
  const handleTaskUpdate = (taskInfo: UnifiedTaskInfo) => {
    setTasks(prev => {
      const existing = prev.find(t => t.taskId === taskInfo.taskId);
      let updated;
      if (existing) {
        updated = prev.map(t =>
          t.taskId === taskInfo.taskId ? taskInfo : t
        );
      } else {
        updated = [taskInfo, ...prev];
      }
      taskStorage.save(updated);
      return updated;
    });
  };

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
      ellipsis: true, // 自动截断溢出文本
      render: (text: string, record: Document) => (
        <Space size={8}>
          {getFileIcon(record.file_type)}
          <Tooltip title={text}>
            <Text className={styles.filename}>
              {text}
            </Text>
          </Tooltip>
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
        <Space className={styles.actionButtons}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDocuments}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<SyncOutlined spin={updating} />}
            onClick={handleUpdateIndex}
            loading={updating}
            className={styles.updateBtn}
          >
            更新向量库
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

      {/* 任务队列面板 */}
      <TaskQueuePanel
        tasks={tasks}
        onRemoveTask={handleRemoveTask}
        onClearCompleted={handleClearCompleted}
      />

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
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};

export default DocumentManagement;
