/**
 * 自动滚动 Hook
 */

import { useEffect, useRef } from 'react';

export function useAutoScroll<T>(dependency: T) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dependency]);

  return endRef;
}

export default useAutoScroll;
