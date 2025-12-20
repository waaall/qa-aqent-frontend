/**
 * 主题切换器组件
 */

import React from 'react';
import { Segmented } from 'antd';
import { SunOutlined, MoonOutlined, LaptopOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/stores/themeStore';
import styles from './ThemeToggle.module.css';

type ThemeMode = 'light' | 'dark' | 'auto';

export const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useThemeStore();

  const options = [
    {
      label: (
        <div className={styles.option}>
          <SunOutlined />
          <span>浅色</span>
        </div>
      ),
      value: 'light' as ThemeMode,
    },
    {
      label: (
        <div className={styles.option}>
          <MoonOutlined />
          <span>深色</span>
        </div>
      ),
      value: 'dark' as ThemeMode,
    },
    {
      label: (
        <div className={styles.option}>
          <LaptopOutlined />
          <span>自动</span>
        </div>
      ),
      value: 'auto' as ThemeMode,
    },
  ];

  return (
    <div className={styles.container}>
      <Segmented
        options={options}
        value={mode}
        onChange={(value) => setMode(value as ThemeMode)}
        block
      />
    </div>
  );
};

export default ThemeToggle;
