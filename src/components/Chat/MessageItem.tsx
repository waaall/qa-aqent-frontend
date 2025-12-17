/**
 * 消息项组件
 */

import React, { useMemo } from 'react';
import { Avatar, Badge, Tooltip, Space } from 'antd';
import { UserOutlined, RobotOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Message } from '@/types';
import { MarkdownRenderer, SourceTag, LoadingDots } from '@/components/Common';
import { formatTime } from '@/utils/helpers';
import { useChatStore } from '@/stores/chatStore';
import ThinkingTimeline from './ThinkingTimeline';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: Message;
}

export const MessageItem = React.memo<MessageItemProps>(
  ({ message }) => {
    const isUser = message.role === 'user';
    const isError = !!message.error;
    const { thinkingEventsMap } = useChatStore();

    // 获取该消息的思考事件
    const thinkingEvents = message.traceId
      ? thinkingEventsMap.get(message.traceId) || []
      : [];

    // 使用useMemo缓存格式化时间
    const formattedTime = useMemo(
      () => formatTime(message.timestamp, 'HH:mm:ss'),
      [message.timestamp]
    );

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
              {formattedTime}
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

          {/* 思考轨迹（仅助手消息） */}
          {!isUser && thinkingEvents.length > 0 && (
            <ThinkingTimeline
              events={thinkingEvents}
              defaultExpanded={message.streaming}
            />
          )}

          {/* 流式打字动画 */}
          {message.streaming && !message.isLoading && (
            <div className={styles.streamingIndicator}>
              <LoadingDots />
              <span>正在思考...</span>
            </div>
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
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.isLoading === next.message.isLoading &&
    prev.message.streaming === next.message.streaming
);

export default MessageItem;
