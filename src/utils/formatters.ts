/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串（KB、MB、GB）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 格式化时间戳
 * @param timestamp Unix 时间戳（秒或毫秒）
 * @returns 格式化后的日期时间字符串
 */
export function formatTimestamp(timestamp: number): string {
  // 判断是秒还是毫秒
  const date = timestamp > 10000000000
    ? new Date(timestamp)
    : new Date(timestamp * 1000);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化相对时间（多久之前）
 * @param timestamp Unix 时间戳（秒或毫秒）
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number): string {
  const date = timestamp > 10000000000
    ? new Date(timestamp)
    : new Date(timestamp * 1000);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return formatTimestamp(timestamp);
}
