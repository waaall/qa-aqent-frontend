/**
 * 页面头部组件
 */

import React, { useState } from 'react';
import { Button, Tooltip, Badge, Modal, Descriptions } from 'antd';
import {
  UploadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import config from '@/config';
import { systemApi } from '@/services';
import { HealthResponse } from '@/types';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckHealth = async () => {
    setLoading(true);
    try {
      const data = await systemApi.checkHealth();
      setHealthData(data);
      setHealthModalOpen(true);
    } catch (error) {
      console.error('Failed to check health', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge status="success" text="正常" />;
      case 'degraded':
        return <Badge status="warning" text="降级" />;
      case 'unhealthy':
        return <Badge status="error" text="异常" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <h1 className={styles.title}>{config.appTitle}</h1>
      </div>

      <div className={styles.actions}>
        <Tooltip title="文档上传（暂未实现）">
          <Button
            type="text"
            icon={<UploadOutlined />}
            disabled
          >
            上传文档
          </Button>
        </Tooltip>

        <Tooltip title="系统状态">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={handleCheckHealth}
            loading={loading}
          >
            系统状态
          </Button>
        </Tooltip>

        <Tooltip title="设置（暂未实现）">
          <Button
            type="text"
            icon={<SettingOutlined />}
            disabled
          />
        </Tooltip>
      </div>

      {/* 系统状态 Modal */}
      <Modal
        title="系统状态"
        open={healthModalOpen}
        onCancel={() => setHealthModalOpen(false)}
        footer={null}
      >
        {healthData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="系统状态">
              {getStatusBadge(healthData.status)}
            </Descriptions.Item>

            {healthData.ollama && (
              <>
                <Descriptions.Item label="Ollama 服务">
                  {healthData.ollama.running ? (
                    <Badge status="success" text="运行中" />
                  ) : (
                    <Badge status="error" text="未运行" />
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="当前模型">
                  {healthData.ollama.current_model || '未知'}
                </Descriptions.Item>

                <Descriptions.Item label="模型可用">
                  {healthData.ollama.model_available ? '是' : '否'}
                </Descriptions.Item>

                <Descriptions.Item label="模型已加载">
                  {healthData.ollama.model_loaded ? '是' : '否'}
                </Descriptions.Item>

                {healthData.ollama.running_models &&
                  healthData.ollama.running_models.length > 0 && (
                    <Descriptions.Item label="运行中的模型">
                      {healthData.ollama.running_models.join(', ')}
                    </Descriptions.Item>
                  )}
              </>
            )}

            <Descriptions.Item label="检查时间">
              {healthData.timestamp}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Header;
