/**
 * 会话项组件
 */

import React, { useState } from 'react';
import { Button, Popconfirm } from 'antd';
import {
  MessageOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Session } from '@/types';
import { timeAgo } from '@/utils/helpers';
import styles from './SessionItem.module.css';

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onClick,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.container} ${isActive ? styles.active : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={styles.icon}>
        {isActive ? (
          <CheckOutlined className={styles.activeIcon} />
        ) : (
          <MessageOutlined />
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.title}>{session.title}</div>
        <div className={styles.meta}>
          <span>{timeAgo(session.last_accessed)}</span>
          <span className={styles.dot}>·</span>
          <span>{session.message_count} 条消息</span>
        </div>
      </div>

      {isHovered && (
        <Popconfirm
          title="确定删除此会话吗？"
          description="删除后将无法恢复"
          onConfirm={(e) => {
            e?.stopPropagation();
            onDelete();
          }}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            className={styles.deleteBtn}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      )}
    </div>
  );
};

export default SessionItem;
