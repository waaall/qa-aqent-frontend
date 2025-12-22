/**
 * 系统信息弹窗组件
 * 整合显示：系统状态 + LLM 提供商 + 向量库状态
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Descriptions,
  Badge,
  Statistic,
  Row,
  Col,
  Card,
  Spin,
  Alert,
  Button,
  Divider,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { systemApi } from '@/services';
import type { HealthResponse, StatsResponse } from '@/types';
import styles from './SystemInfoModal.module.css';

interface SystemInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ open, onClose }) => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, stats] = await Promise.all([
        systemApi.checkHealth(),
        systemApi.getStats(),
      ]);
      setHealthData(health);
      setStatsData(stats);
    } catch (err) {
      setError('获取系统信息失败');
      console.error('Failed to fetch system info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

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
    <Modal
      title={
        <div className={styles.modalTitle}>
          <CloudServerOutlined className={styles.titleIcon} />
          <span>系统信息</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Button onClick={onClose} type="primary">
          关闭
        </Button>
      }
      width={720}
      className={styles.modal}
    >
      <div className={styles.container}>
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
          style={{ marginBottom: 16 }}
        >
          刷新数据
        </Button>

        {loading && !healthData && !statsData ? (
          <div className={styles.loading}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* 系统状态 */}
            {healthData && (
              <Card
                title={
                  <div className={styles.cardHeader}>
                    <CheckCircleOutlined className={styles.icon} />
                    <span>系统状态</span>
                  </div>
                }
                className={styles.card}
                size="small"
              >
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="系统状态">
                    {getStatusBadge(healthData.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="检查时间">
                    {healthData.timestamp}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* LLM 提供商 */}
            {healthData?.llm && (
              <Card
                title={
                  <div className={styles.cardHeader}>
                    <RobotOutlined className={styles.icon} />
                    <span>LLM 提供商</span>
                  </div>
                }
                className={styles.card}
                size="small"
              >
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="提供商">
                    {healthData.llm.provider || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {healthData.llm.ready ? (
                      <Badge status="success" text="就绪" />
                    ) : (
                      <Badge status="error" text="未就绪" />
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="当前模型">
                    <code className={styles.code}>{healthData.llm.current_model || '未知'}</code>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* 向量库状态 */}
            {statsData && (
              <Card
                title={
                  <div className={styles.cardHeader}>
                    <DatabaseOutlined className={styles.icon} />
                    <span>向量库状态</span>
                  </div>
                }
                className={styles.card}
                size="small"
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="集合名称"
                      value={statsData.stats.vector_store.collection_name}
                      valueStyle={{
                        color: '#1890ff',
                        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                        fontSize: '16px',
                      }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="文档数量"
                      value={statsData.stats.vector_store.document_count}
                      valueStyle={{
                        color: '#52c41a',
                        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                      }}
                      suffix="个"
                    />
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="集合名称">
                    <code className={styles.code}>
                      {statsData.stats.vector_store.collection_name}
                    </code>
                  </Descriptions.Item>
                  <Descriptions.Item label="文档数量">
                    <strong>{statsData.stats.vector_store.document_count}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="系统版本">
                    <code className={styles.code}>v{statsData.stats.version}</code>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default SystemInfoModal;
