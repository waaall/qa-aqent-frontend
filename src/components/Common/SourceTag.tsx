/**
 * 数据库源标签组件
 */

import React from 'react';
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
  { label: string; className: string; icon: React.ReactNode }
> = {
  knowledge: {
    label: '知识库',
    className: 'tagBlue',
    icon: <BookOutlined />,
  },
  sql: {
    label: '数据库',
    className: 'tagGreen',
    icon: <DatabaseOutlined />,
  },
  api: {
    label: '实时数据',
    className: 'tagOrange',
    icon: <CloudOutlined />,
  },
  general: {
    label: '对话',
    className: 'tagPurple',
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
            className: 'tagDefault',
            icon: null,
          };

          return (
            <div key={engine} className={`${styles.tag} ${styles[config.className]}`}>
              {config.icon && <span className={styles.tagIcon}>{config.icon}</span>}
              <span>{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SourceTag;
