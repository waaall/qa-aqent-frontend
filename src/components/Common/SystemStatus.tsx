/**
 * 系统状态组件
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Space,
  Button,
  Spin,
  Alert,
  Typography,
  Statistic,
  Row,
  Col,
  Input,
  Select,
  Form,
} from 'antd';
import {
  ReloadOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { systemApi, databaseApi } from '@/services';
import type { StatsResponse, DatabaseInfoResponse } from '@/types';
import styles from './SystemStatus.module.css';

const { Text, Title } = Typography;

export const SystemStatus: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dbInfo, setDbInfo] = useState<DatabaseInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dbName, setDbName] = useState<string>('');
  const [dbSource, setDbSource] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await systemApi.getStats();
      setStats(response);
    } catch (err) {
      setError('获取系统统计失败');
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbInfo = async () => {
    setDbLoading(true);
    setError(null);
    try {
      const response = await databaseApi.getInfo(dbName || undefined, dbSource || undefined);
      setDbInfo(response);
    } catch (err) {
      setError('获取数据库信息失败');
      console.error('Failed to fetch database info:', err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className={styles.container}>
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 系统统计 */}
        <Card
          title={
            <div className={styles.cardHeader}>
              <CloudServerOutlined className={styles.icon} />
              <Title level={5} className={styles.cardTitle}>系统统计</Title>
            </div>
          }
          extra={
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStats}
              loading={loading}
              size="small"
            >
              刷新
            </Button>
          }
          className={styles.card}
        >
          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : stats ? (
            <div>
              <Row gutter={[24, 24]}>
                <Col span={8}>
                  <Statistic
                    title="向量库集合"
                    value={stats.stats.vector_store.collection_name}
                    valueStyle={{ color: '#1890ff', fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="文档数量"
                    value={stats.stats.vector_store.document_count}
                    valueStyle={{ color: '#52c41a', fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}
                    suffix="个"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="系统版本"
                    value={stats.stats.version}
                    valueStyle={{ fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}
                  />
                </Col>
              </Row>

              <Descriptions
                bordered
                size="small"
                column={1}
                className={styles.descriptions}
                style={{ marginTop: 20 }}
              >
                <Descriptions.Item label="集合名称">
                  <Text code>{stats.stats.vector_store.collection_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="文档数量">
                  <Text strong>{stats.stats.vector_store.document_count}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="系统版本">
                  <Text code>v{stats.stats.version}</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          ) : (
            <Text type="secondary">暂无数据</Text>
          )}
        </Card>

        {/* 数据库信息 */}
        <Card
          title={
            <div className={styles.cardHeader}>
              <DatabaseOutlined className={styles.icon} />
              <Title level={5} className={styles.cardTitle}>数据库信息</Title>
            </div>
          }
          className={styles.card}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 查询表单 */}
            <Form layout="inline" className={styles.form}>
              <Form.Item label="数据库名称">
                <Input
                  placeholder="可选"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item label="数据源">
                <Select
                  placeholder="可选"
                  value={dbSource}
                  onChange={setDbSource}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Select.Option value="clickhouse">ClickHouse</Select.Option>
                  <Select.Option value="mysql">MySQL</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchDbInfo}
                  loading={dbLoading}
                >
                  查询
                </Button>
              </Form.Item>
            </Form>

            {/* 数据库信息展示 */}
            {dbLoading ? (
              <div className={styles.loading}>
                <Spin size="large" />
              </div>
            ) : dbInfo ? (
              <div className={styles.dbInfo}>
                <pre className={styles.jsonDisplay}>
                  {JSON.stringify(dbInfo.info, null, 2)}
                </pre>
              </div>
            ) : (
              <Alert
                message="提示"
                description="请输入数据库参数后点击查询按钮获取数据库信息"
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SystemStatus;
