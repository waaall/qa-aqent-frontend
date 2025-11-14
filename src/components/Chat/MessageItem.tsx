/**
 * 消息项组件
 */

import React from 'react';
import { Avatar, Badge, Tooltip, Space } from 'antd';
import { UserOutlined, RobotOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Message } from '@/types';
import { MarkdownRenderer, SourceTag, LoadingDots } from '@/components/Common';
import { formatTime } from '@/utils/helpers';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = !!message.error;

  return (
    <div className={`${styles.container} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.avatar}>
        <Avatar
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: isUser ? '#1890ff' : '#52c41a',
          }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.role}>
            {isUser ? '我' : 'AI 助手'}
          </span>
          <span className={styles.time}>
            {formatTime(message.timestamp, 'HH:mm:ss')}
          </span>
        </div>

        <div className={styles.messageBody}>
          {message.isLoading ? (
            <LoadingDots />
          ) : isError ? (
            <div className={styles.error}>
              <ExclamationCircleOutlined />
              <span>{message.content}</span>
              {message.error && (
                <Tooltip title={message.error}>
                  <span className={styles.errorDetails}>查看详情</span>
                </Tooltip>
              )}
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {/* 元数据 */}
          {!message.isLoading && !isUser && message.metadata && (
            <div className={styles.metadata}>
              {message.metadata.engines_used && (
                <SourceTag engines={message.metadata.engines_used} />
              )}

              <Space size={8} className={styles.badges}>
                {message.metadata.enhancement_applied && (
                  <Badge status="processing" text="知识增强" />
                )}
                {message.metadata.confidence !== undefined && (
                  <Tooltip title="回答置信度">
                    <span className={styles.confidence}>
                      置信度: {(message.metadata.confidence * 100).toFixed(0)}%
                    </span>
                  </Tooltip>
                )}
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
