/**
 * 数据库查询组件
 */

import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Spin,
  Alert,
  Typography,
  Input,
  Select,
} from 'antd';
import {
  ReloadOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { databaseApi } from '@/services';
import type { DatabaseInfoResponse } from '@/types';
import styles from './DatabaseQuery.module.css';

const { Title } = Typography;

export const DatabaseQuery: React.FC = () => {
  const [dbInfo, setDbInfo] = useState<DatabaseInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dbName, setDbName] = useState<string>('');
  const [dbSource, setDbSource] = useState<string>('');

  const fetchDbInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await databaseApi.getInfo(dbName || undefined, dbSource || undefined);
      setDbInfo(response);
    } catch (err) {
      setError('获取数据库信息失败');
      console.error('Failed to fetch database info:', err);
    } finally {
      setLoading(false);
    }
  };

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

      <Card
        title={
          <div className={styles.cardHeader}>
            <DatabaseOutlined className={styles.icon} />
            <Title level={5} className={styles.cardTitle}>数据库信息查询</Title>
          </div>
        }
        className={styles.card}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 查询表单 */}
          <div className={styles.queryForm}>
            <div className={styles.inputGroup}>
              <div className={styles.formItem}>
                <label htmlFor="db-name-input" id="db-name-label" className={styles.label}>
                  数据库名
                </label>
                <Input
                  id="db-name-input"
                  aria-labelledby="db-name-label"
                  placeholder="可选"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formItem}>
                <label id="db-source-label" className={styles.label}>
                  数据库源
                </label>
                <Select
                  aria-labelledby="db-source-label"
                  placeholder="可选"
                  value={dbSource}
                  onChange={setDbSource}
                  className={styles.select}
                  allowClear
                >
                  <Select.Option value="clickhouse">ClickHouse</Select.Option>
                  <Select.Option value="mysql">MySQL</Select.Option>
                </Select>
              </div>
            </div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchDbInfo}
              loading={loading}
              className={styles.queryButton}
            >
              查询
            </Button>
          </div>

          {/* 数据库信息展示 */}
          {loading ? (
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
    </div>
  );
};

export default DatabaseQuery;
