import { invoke } from '@tauri-apps/api/core';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import config from '@/config';
import logger from '@/utils/logger';
import { isTauriEnv } from './environment';
import type { BackendTestResult, FileDialogFilter, FileSelectionResult } from './types';

const ensureJsonFilename = (name: string) =>
  name.toLowerCase().endsWith('.json') ? name : `${name}.json`;

const buildAccept = (filters?: FileDialogFilter[]) => {
  if (!filters?.length) {
    return undefined;
  }
  const extensions = filters.flatMap((filter) => filter.extensions);
  if (!extensions.length) {
    return undefined;
  }
  return extensions
    .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
    .join(',');
};

const pickFileInBrowser = (filters?: FileDialogFilter[]): Promise<FileSelectionResult | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    const accept = buildAccept(filters);
    if (accept) {
      input.accept = accept;
    }
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? { file } : null);
    };
    input.click();
  });

const downloadJsonInBrowser = (data: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = ensureJsonFilename(filename);
  anchor.click();
  URL.revokeObjectURL(url);
};

export const getBackendUrl = async (): Promise<string> => {
  if (!isTauriEnv()) {
    return config.apiBaseUrl;
  }
  return invoke<string>('get_backend_url');
};

export const setBackendUrl = async (url: string): Promise<void> => {
  if (!isTauriEnv()) {
    return;
  }
  await invoke<void>('set_backend_url', { url });
};

export const testBackendConnection = async (url: string): Promise<BackendTestResult> => {
  return invoke<BackendTestResult>('test_backend_connection', { url });
};

export const fileOpenDialog = async (
  filters?: FileDialogFilter[]
): Promise<FileSelectionResult | null> => {
  if (isTauriEnv()) {
    const path = await invoke<string | null>('select_file', { filters });
    return path ? { path } : null;
  }

  return pickFileInBrowser(filters);
};

export const saveChatHistory = async (
  messages: unknown,
  filename: string
): Promise<string | null> => {
  if (isTauriEnv()) {
    return invoke<string | null>('save_chat_history', { messages, filename });
  }

  downloadJsonInBrowser(messages, filename);
  return null;
};

export const exportJsonToFile = async (
  data: unknown,
  filename: string
): Promise<string | null> => {
  if (isTauriEnv()) {
    return invoke<string | null>('export_to_json', { data, filename });
  }

  downloadJsonInBrowser(data, filename);
  return null;
};

export const showNotification = async (title: string, body?: string) => {
  if (isTauriEnv()) {
    const granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        logger.warn('通知权限被拒绝，无法发送通知', { title, body });
        return;
      }
    }
    sendNotification({ title, body });
    return;
  }

  // Web 环境回退到浏览器通知 API
  if (!('Notification' in window)) {
    logger.warn('浏览器不支持通知 API');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, body ? { body } : undefined);
    return;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, body ? { body } : undefined);
    } else {
      logger.warn('通知权限被拒绝', { title, body });
    }
  } else {
    logger.warn('通知权限已被拒绝', { title, body });
  }
};
