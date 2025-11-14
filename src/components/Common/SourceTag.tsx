/**
 * 数据源标签组件
 */

import React from 'react';
import { Tag } from 'antd';
import {
  DatabaseOutlined,
  CloudOutlined,
  BookOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import styles from './SourceTag.module.css';

interface SourceTagProps {
  engines: string[];
}

const engineConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  knowledge: {
    label: '知识库',
    color: 'blue',
    icon: <BookOutlined />,
  },
  sql: {
    label: '数据库',
    color: 'green',
    icon: <DatabaseOutlined />,
  },
  api: {
    label: '实时数据',
    color: 'orange',
    icon: <CloudOutlined />,
  },
  general: {
    label: '对话',
    color: 'purple',
    icon: <MessageOutlined />,
  },
};

export const SourceTag: React.FC<SourceTagProps> = ({ engines }) => {
  if (!engines || engines.length === 0) return null;

  return (
    <div className={styles.container}>
      <span className={styles.label}>数据来源:</span>
      <div className={styles.tags}>
        {engines.map((engine) => {
          const config = engineConfig[engine] || {
            label: engine,
            color: 'default',
            icon: null,
          };

          return (
            <Tag key={engine} color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          );
        })}
      </div>
    </div>
  );
};

export default SourceTag;
