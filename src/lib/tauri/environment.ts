import { isTauri } from '@tauri-apps/api/core';

export const isTauriEnv = (): boolean => isTauri();

export const getPlatform = async (): Promise<string> => {
  if (!isTauri()) {
    return 'web';
  }

  try {
    // 在 Tauri V2 中，平台信息通过 navigator 获取
    // 或者可以使用 window.__TAURI_INTERNALS__
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  } catch {
    return 'unknown';
  }
};
