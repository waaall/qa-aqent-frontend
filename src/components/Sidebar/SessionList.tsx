/**
 * 会话列表组件
 */

import React from 'react';
import { Button, Empty, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { SessionItem } from './SessionItem';
import { useSession } from '@/hooks';
import styles from './SessionList.module.css';

export const SessionList: React.FC = () => {
  const { sessions, currentSessionId, switchSession, deleteSession, startNewChat } =
    useSession();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>对话列表</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={startNewChat}
          size="small"
        >
          新对话
        </Button>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div className={styles.sessionList}>
        {sessions.length === 0 ? (
          <Empty
            description="暂无对话记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.session_id}
              session={session}
              isActive={session.session_id === currentSessionId}
              onClick={() => switchSession(session.session_id)}
              onDelete={() => deleteSession(session.session_id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SessionList;
