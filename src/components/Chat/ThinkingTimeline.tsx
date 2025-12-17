/**
 * 思考轨迹时间线组件
 */

import React from 'react';
import { Timeline, Tag, Collapse, Space, Typography } from 'antd';
import {
  ThunderboltOutlined,
  ToolOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { ThinkingEvent, ThinkingEventType } from '@/types/thinking';
import styles from './ThinkingTimeline.module.css';

const { Panel } = Collapse;
const { Text } = Typography;

interface ThinkingTimelineProps {
  events: ThinkingEvent[];
  defaultExpanded?: boolean;
}

// 事件类型配置
const EVENT_CONFIG: Record<
  ThinkingEventType,
  {
    icon: React.ReactNode;
    color: string;
    label: string;
  }
> = {
  'meta.start': {
    icon: <ThunderboltOutlined />,
    color: 'blue',
    label: '开始处理',
  },
  'router.decision': {
    icon: <ThunderboltOutlined />,
    color: 'purple',
    label: '路由决策',
  },
  'memory.inject': {
    icon: <BulbOutlined />,
    color: 'orange',
    label: '记忆注入',
  },
  thought: {
    icon: <BulbOutlined />,
    color: 'cyan',
    label: 'AI思考',
  },
  tool_call: {
    icon: <ToolOutlined />,
    color: 'geekblue',
    label: '工具调用',
  },
  tool_result: {
    icon: <CheckCircleOutlined />,
    color: 'green',
    label: '工具结果',
  },
  fallback: {
    icon: <WarningOutlined />,
    color: 'orange',
    label: '兜底处理',
  },
  final: {
    icon: <CheckCircleOutlined />,
    color: 'success',
    label: '完成',
  },
  error: {
    icon: <CloseCircleOutlined />,
    color: 'red',
    label: '错误',
  },
  heartbeat: {
    icon: <CloudOutlined />,
    color: 'default',
    label: '心跳',
  },
};

// 格式化时间戳
function formatTime(ts: number): string {
  const date = new Date(ts);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

// 渲染扩展信息
function renderEventExtra(event: ThinkingEvent): React.ReactNode {
  const { extra } = event;
  if (!extra) return null;

  const items: React.ReactNode[] = [];

  // 路由决策
  if (event.type === 'router.decision') {
    if (extra.query_type) {
      items.push(
        <Tag key="type" color="blue">
          类型: {extra.query_type}
        </Tag>
      );
    }
    if (extra.confidence !== undefined) {
      items.push(
        <Tag key="conf" color="green">
          置信度: {(extra.confidence * 100).toFixed(0)}%
        </Tag>
      );
    }
  }

  // 工具调用
  if (event.type === 'tool_call' && extra.tool_name) {
    items.push(
      <Tag key="tool" color="blue">
        工具: {extra.tool_name}
      </Tag>
    );
  }

  // 工具结果
  if (event.type === 'tool_result') {
    if (extra.status) {
      items.push(
        <Tag key="status" color={extra.status === 'ok' ? 'success' : 'error'}>
          {extra.status === 'ok' ? '成功' : '失败'}
        </Tag>
      );
    }
    if (extra.duration) {
      items.push(<Tag key="dur">耗时: {extra.duration}ms</Tag>);
    }
    if (extra.preview) {
      items.push(
        <div key="preview" className={styles.preview}>
          <Text type="secondary">{extra.preview}</Text>
        </div>
      );
    }
  }

  return items.length > 0 ? (
    <Space size={4} wrap className={styles.extra}>
      {items}
    </Space>
  ) : null;
}

export const ThinkingTimeline: React.FC<ThinkingTimelineProps> = ({
  events,
  defaultExpanded = false,
}) => {
  // 过滤掉心跳事件
  const visibleEvents = events.filter((e) => e.type !== 'heartbeat');

  if (visibleEvents.length === 0) return null;

  return (
    <Collapse
      className={styles.collapse}
      defaultActiveKey={defaultExpanded ? ['thinking'] : []}
    >
      <Panel
        header={
          <Space>
            <BulbOutlined />
            <span>思考过程</span>
            <Tag color="blue">{visibleEvents.length} 步</Tag>
          </Space>
        }
        key="thinking"
      >
        <Timeline
          className={styles.timeline}
          items={visibleEvents.map((event) => {
            const config = EVENT_CONFIG[event.type];

            return {
              dot: config.icon,
              color: config.color,
              children: (
                <div className={styles.timelineItem}>
                  <div className={styles.header}>
                    <Tag color={config.color}>{config.label}</Tag>
                    <Text type="secondary" className={styles.time}>
                      {formatTime(event.ts)}
                    </Text>
                  </div>

                  <div className={styles.content}>{event.content}</div>

                  {/* 扩展信息 */}
                  {renderEventExtra(event)}
                </div>
              ),
            };
          })}
        />
      </Panel>
    </Collapse>
  );
};

export default ThinkingTimeline;
