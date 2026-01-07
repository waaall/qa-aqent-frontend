/**
 * Tauri 后端地址配置
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Input, Space, Typography, message } from 'antd';
import { LinkOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import apiClient from '@/services/apiClient';
import { getBackendUrl, setBackendUrl, testBackendConnection } from '@/lib/tauri';
import styles from './BackendConfig.module.css';

const { Text } = Typography;

type StatusState = {
  type: 'success' | 'error';
  message: string;
} | null;

export const BackendConfig: React.FC = () => {
  const [backendUrl, setBackendUrlState] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  const loadBackendUrl = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const storedUrl = await getBackendUrl();
      setBackendUrlState(storedUrl);
    } catch (error) {
      setStatus({ type: 'error', message: '读取后端地址失败' });
    } finally {
      setLoading(false);
    }
  }, []); // getBackendUrl 是静态导入的函数，不需要作为依赖

  useEffect(() => {
    loadBackendUrl();
  }, [loadBackendUrl]);

  const handleTest = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const result = await testBackendConnection(backendUrl);
      if (result.ok) {
        setStatus({
          type: 'success',
          message: result.status
            ? `连接成功（${result.status}）`
            : '连接成功',
        });
      } else {
        setStatus({
          type: 'error',
          message: result.message || '连接失败',
        });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '连接失败，请检查地址' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await setBackendUrl(backendUrl);
      apiClient.updateBaseURL(backendUrl);
      message.success('后端地址已保存');
    } catch (error) {
      message.error('保存失败，请检查地址格式');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>后端地址配置</Text>
        <Text type="secondary" className={styles.subtitle}>
          修改后端地址后会立即生效，建议先测试连接
        </Text>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <Text className={styles.label}>后端服务地址</Text>
          <Input
            prefix={<LinkOutlined />}
            value={backendUrl}
            onChange={(event) => {
              setBackendUrlState(event.target.value);
              if (status) {
                setStatus(null);
              }
            }}
            placeholder="http://192.168.50.50:5000"
            disabled={loading || saving}
            className={styles.input}
          />
        </div>

        <Space className={styles.actions} size={12} wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadBackendUrl}
            loading={loading}
          >
            重新加载
          </Button>
          <Button
            onClick={handleTest}
            loading={testing}
          >
            测试连接
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>

        {status && (
          <Alert
            type={status.type}
            message={status.message}
            showIcon
            className={styles.status}
          />
        )}
      </div>
    </div>
  );
};

export default BackendConfig;
