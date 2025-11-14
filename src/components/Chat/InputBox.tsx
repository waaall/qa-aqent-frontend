/**
 * 输入框组件
 */

import React, { useState, KeyboardEvent } from 'react';
import { Input, Button, Space, Tooltip } from 'antd';
import { SendOutlined, StopOutlined } from '@ant-design/icons';
import config from '@/config';
import styles from './InputBox.module.css';

const { TextArea } = Input;

interface InputBoxProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSend, disabled, loading }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter 发送消息
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    if (trimmedInput.length > config.ui.maxMessageLength) {
      return;
    }

    onSend(trimmedInput);
    setInput('');
  };

  const isDisabled = disabled || loading;
  const canSend = !isDisabled && input.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            loading
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

          {loading ? (
            <Tooltip title="停止生成（暂未实现）">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                disabled
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
              >
                发送
              </Button>
            </Tooltip>
          )}
        </Space>
      </div>

      <div className={styles.hint}>
        提示: 您可以询问电厂运维相关问题，获取实时数据、历史记录或知识库信息
      </div>
    </div>
  );
};

export default InputBox;
