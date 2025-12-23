/**
 * 任务队列面板组件
 * 显示所有上传和更新任务的进度
 */

import React from 'react';
import { Card, Progress, Space, Typography, Alert, Button } from 'antd';
import {
  UploadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { UnifiedTaskInfo } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';
import styles from './TaskQueuePanel.module.css';

const { Text } = Typography;

interface TaskQueuePanelProps {
  tasks: UnifiedTaskInfo[];
  onRemoveTask: (taskId: string) => void;
  onClearCompleted: () => void;
}

export const TaskQueuePanel: React.FC<TaskQueuePanelProps> = ({
  tasks,
  onRemoveTask,
  onClearCompleted,
}) => {
  if (tasks.length === 0) return null;

  const activeTasks = tasks.filter(
    t => t.status === 'pending' || t.status === 'processing'
  );
  const completedTasks = tasks.filter(
    t => t.status === 'completed' || t.status === 'failed'
  );

  const getTaskIcon = (task: UnifiedTaskInfo) => {
    if (task.status === 'completed') {
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
    }
    if (task.status === 'failed') {
      return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
    }
    if (task.type === 'upload') {
      return <UploadOutlined style={{ color: '#1890ff', fontSize: 18 }} />;
    }
    return <SyncOutlined spin style={{ color: '#1890ff', fontSize: 18 }} />;
  };

  const getTaskTitle = (task: UnifiedTaskInfo) => {
    if (task.type === 'upload') {
      return task.filename || '上传文档';
    }
    return '更新向量库';
  };

  const getProgressStatus = (task: UnifiedTaskInfo) => {
    if (task.status === 'failed') return 'exception';
    if (task.status === 'completed') return 'success';
    return 'active';
  };

  const getProgressColor = (task: UnifiedTaskInfo) => {
    if (task.type === 'upload') {
      return { '0%': '#108ee9', '100%': '#87d068' };
    }
    return { '0%': '#7B9EF5', '100%': '#52c41a' };
  };

  const renderTask = (task: UnifiedTaskInfo) => (
    <div key={task.taskId} className={styles.taskItem}>
      <div className={styles.taskHeader}>
        <Space size={8}>
          {getTaskIcon(task)}
          <Text strong className={styles.taskTitle}>
            {getTaskTitle(task)}
          </Text>
        </Space>
        {(task.status === 'completed' || task.status === 'failed') && (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => onRemoveTask(task.taskId)}
            className={styles.removeBtn}
          />
        )}
      </div>

      <Progress
        percent={task.progress}
        status={getProgressStatus(task)}
        strokeColor={getProgressColor(task)}
        size="small"
        className={styles.progress}
      />

      <div className={styles.taskFooter}>
        <Text type="secondary" className={styles.stage}>
          {task.stage}
        </Text>
        <Text type="secondary" className={styles.time}>
          {formatRelativeTime(task.createdAt / 1000)}
        </Text>
      </div>

      {task.errors && task.errors.length > 0 && (
        <Alert
          message="处理错误"
          description={task.errors.map((err, idx) => (
            <div key={idx}>
              [{err.stage}] {err.message}
            </div>
          ))}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      )}
    </div>
  );

  return (
    <Card className={styles.panel} bordered={false}>
      <div className={styles.header}>
        <Space>
          <Text strong className={styles.title}>
            任务队列
          </Text>
          <Text type="secondary" className={styles.count}>
            {activeTasks.length > 0 ? `${activeTasks.length} 个进行中` : '全部完成'}
          </Text>
        </Space>
        {completedTasks.length > 0 && (
          <Button
            type="text"
            size="small"
            onClick={onClearCompleted}
            className={styles.clearBtn}
          >
            清除已完成
          </Button>
        )}
      </div>

      <div className={styles.taskList}>
        {activeTasks.map(renderTask)}
        {completedTasks.map(renderTask)}
      </div>
    </Card>
  );
};

export default TaskQueuePanel;
