/**
 * 聊天容器组件
 */

import React from 'react';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { useChat } from '@/hooks';
import styles from './ChatContainer.module.css';

export const ChatContainer: React.FC = () => {
  const { messages, isLoading, streamStatus, sendMessage, stopStream } = useChat();

  return (
    <div className={styles.container}>
      <MessageList messages={messages} />
      <InputBox
        onSend={sendMessage}
        onStop={stopStream}
        loading={isLoading}
        streamStatus={streamStatus}
      />
    </div>
  );
};

export default ChatContainer;
