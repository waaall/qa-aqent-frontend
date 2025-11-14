/**
 * 加载动画组件
 */

import React from 'react';
import styles from './LoadingDots.module.css';

export const LoadingDots: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
      <div className={styles.dot}></div>
    </div>
  );
};

export default LoadingDots;
