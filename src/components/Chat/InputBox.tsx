/**
 * 输入框组件
 */

import React, { useState, KeyboardEvent } from 'react';
import { Input, Button, Space, Tooltip, message } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import config from '@/config';
import { validateUserInput } from '@/utils/validation';
import { StreamStatus } from '@/types/thinking';
import { LoadingDots } from '@/components/Common';
import styles from './InputBox.module.css';

const { TextArea } = Input;

interface InputBoxProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  streamStatus?: StreamStatus;
}

export const InputBox: React.FC<InputBoxProps> = ({
  onSend,
  onStop,
  disabled,
  loading,
  streamStatus = 'idle',
}) => {
  const [input, setInput] = useState('');

  // 流式状态判断
  const isStreaming = streamStatus === 'streaming' || streamStatus === 'connecting';

  // 停止生成处理
  const handleStop = () => {
    onStop?.();
    message.info('已停止生成');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 发送消息
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const cleanedValue = validateUserInput(input);

    if (!cleanedValue) {
      message.warning('请输入有效内容');
      return;
    }

    if (cleanedValue.length > config.ui.maxMessageLength) {
      message.warning(`消息长度不能超过 ${config.ui.maxMessageLength} 字符`);
      return;
    }

    onSend(cleanedValue);
    setInput('');
  };

  const isDisabled = disabled || loading || isStreaming;
  const canSend = !isDisabled && input.trim().length > 0;

  return (
    <div className={styles.container}>
      <div
        className={styles.inputWrapper}
        style={{ maxWidth: config.ui.containerMaxWidth.message }}
      >
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'AI正在思考中...'
              : loading
              ? '正在处理中...'
              : '输入您的问题... (Ctrl/Cmd + Enter 发送)'
          }
          disabled={isDisabled}
          autoSize={{ minRows: 1, maxRows: 6 }}
          className={styles.textarea}
        />

        <Space className={styles.actions}>
          <span className={styles.charCount}>
            {input.length}/{config.ui.maxMessageLength}
          </span>

          {isStreaming ? (
            <Tooltip title="停止生成">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={handleStop}
              >
                停止
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="发送消息 (Ctrl/Cmd + Enter)">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                disabled={!canSend}
                className={styles.sendButton}
              >
                发送
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      {/* 流式连接状态提示 */}
      {streamStatus === 'connecting' && (
        <div
          className={styles.statusHint}
          style={{ maxWidth: config.ui.containerMaxWidth.message }}
        >
          <LoadingDots /> 正在建立思考流连接...
        </div>
      )}

      <div
        className={styles.hint}
        style={{ maxWidth: config.ui.containerMaxWidth.message }}
      >
        提示: 您可以询问电厂运维相关问题，获取实时数据、历史记录或知识库信息
      </div>
    </div>
  );
};

export default InputBox;
