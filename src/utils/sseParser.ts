/**
 * SSE 流解析工具
 */

import { ThinkingEvent } from '@/types/thinking';
import logger from './logger';
import config from '@/config';

function normalizeTimestamp(ts: unknown): number {
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
}

/**
 * 解析单个 SSE 事件块
 * @param chunk SSE 原始文本块（包含 event: 和 data: 行）
 * @returns 解析后的事件对象，如果是心跳或解析失败则返回 null
 */
export function parseSseChunk(chunk: string): ThinkingEvent | null {
  const lines = chunk.split(/\r?\n/);
  let eventType = '';
  const dataLines: string[] = [];

  // 解析 event: 和 data: 行
  for (const line of lines) {
    // SSE 注释行（常用于心跳）
    if (line.startsWith(':')) continue;

    if (line.startsWith('event:')) {
      eventType = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.substring(5).trim());
    }
  }

  const data = dataLines.join('\n').trim();

  // 心跳：允许 event=heartbeat 但 data 为空（或仅注释行）
  if (eventType === 'heartbeat' && !data) {
    logger.debug('SSE heartbeat received');
    return {
      trace_id: '',
      step: 0,
      ts: Date.now(),
      type: 'heartbeat',
      content: '',
    };
  }

  // 数据为空则跳过（包含纯注释块）
  if (!data) return null;

  // 解析 JSON 数据
  try {
    const parsed = JSON.parse(data) as ThinkingEvent & { session_id?: string; ts?: unknown };

    // 兼容后端常用字段：session_id -> turn_id（旧字段）
    if (!parsed.turn_id && parsed.session_id) {
      parsed.turn_id = parsed.session_id;
    }

    // 规范化时间戳（后端可能是 ISO 字符串）
    parsed.ts = normalizeTimestamp(parsed.ts);

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
  const eventSeparator = /\r?\n\r?\n/;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // 追加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 按双换行符分割事件（SSE 协议规范）
      const chunks = buffer.split(eventSeparator);
      buffer = chunks.pop() || ''; // 保留最后不完整的块

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        const event = parseSseChunk(chunk);
        if (event) {
          yield event;
        }
      }
    }

    // 处理最后一个未以空行结尾的事件块
    buffer += decoder.decode();
    if (buffer.trim()) {
      const event = parseSseChunk(buffer);
      if (event) {
        yield event;
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
