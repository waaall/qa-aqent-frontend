/**
 * SSE 流解析工具
 */

import { ThinkingEvent } from '@/types/thinking';
import logger from './logger';
import config from '@/config';

/**
 * 解析单个 SSE 事件块
 * @param chunk SSE 原始文本块（包含 event: 和 data: 行）
 * @returns 解析后的事件对象，如果是心跳或解析失败则返回 null
 */
export function parseSseChunk(chunk: string): ThinkingEvent | null {
  const lines = chunk.split('\n');
  let eventType = '';
  let data = '';

  // 解析 event: 和 data: 行
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      data = line.substring(5).trim();
    }
  }

  // 处理心跳事件（返回简化事件对象以重置计时器）
  if (eventType === 'heartbeat') {
    logger.debug('SSE heartbeat received');
    return {
      trace_id: '',
      step: 0,
      ts: Date.now(),
      type: 'heartbeat',
      content: '',
    } as ThinkingEvent;
  }

  // 数据为空则跳过
  if (!data) return null;

  // 解析 JSON 数据
  try {
    const parsed = JSON.parse(data) as ThinkingEvent;

    // 截断过长的 preview（避免 UI 卡顿）
    if (parsed.extra?.preview && typeof parsed.extra.preview === 'string') {
      const maxLen = config.thinkingStream.previewMaxLength;
      if (parsed.extra.preview.length > maxLen) {
        parsed.extra.preview = parsed.extra.preview.substring(0, maxLen) + '...';
      }
    }

    return parsed;
  } catch (error) {
    logger.error('Failed to parse SSE data', { data, error });
    return null;
  }
}

/**
 * SSE 流读取器（基于 fetch + ReadableStream）
 * @param response Fetch Response 对象
 * @yields 解析后的思考事件
 */
export async function* readSseStream(
  response: Response
): AsyncGenerator<ThinkingEvent, void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // 追加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按双换行符分割事件（SSE 协议规范）
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || ''; // 保留最后不完整的块

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        const event = parseSseChunk(chunk);
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 检测浏览器是否支持 SSE 流式功能
 * @returns 是否支持
 */
export function isStreamSupported(): boolean {
  return (
    typeof fetch !== 'undefined' &&
    typeof ReadableStream !== 'undefined'
  );
}
