/**
 * URL 拼接工具
 */

/**
 * 安全地组合 base URL 和路径，避免双重斜杠和前缀重复
 * @param baseUrl 基础 URL（可能包含或不包含尾部斜杠）
 * @param path 路径（可能包含或不包含前导斜杠）
 * @returns 组合后的 URL
 *
 * @example
 * joinUrl('http://api.com', '/users') => 'http://api.com/users'
 * joinUrl('http://api.com/', 'users') => 'http://api.com/users'
 * joinUrl('/api', '/users') => '/api/users'
 * joinUrl('/api', 'users') => '/api/users'
 * joinUrl('', '/users') => '/users'
 * joinUrl('/api', '/api/users') => '/api/users' (避免双重前缀)
 * joinUrl('http://api.com/v1', '/v1/users') => 'http://api.com/v1/users' (避免双重前缀)
 */
export function joinUrl(baseUrl: string, path: string): string {
  // 处理空值
  if (!baseUrl) return path;
  if (!path) return baseUrl;

  // 如果 path 是完整 URL（http/https开头），直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 移除 baseUrl 的尾部斜杠
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  // 确保 path 有前导斜杠
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 检测并移除重复的路径前缀
  // 例如: baseUrl='/api', path='/api/users' => '/api/users'
  // 而不是 '/api/api/users'
  if (normalizedBase && normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath;
  }

  return normalizedBase + normalizedPath;
}

export default joinUrl;
