/**
 * 消息列表组件
 */

import React from 'react';
import { Empty } from 'antd';
import { MessageItem } from './MessageItem';
import { useAutoScroll } from '@/hooks';
import { Message } from '@/types';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useAutoScroll(messages.length);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <Empty
          description="开始新的对话"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.messageList}>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
