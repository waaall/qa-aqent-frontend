/**
 * 验证和清理用户输入
 */

/**
 * 验证和清理用户输入
 */
export const validateUserInput = (input: string): string => {
  let cleaned = input.trim();

  // 限制长度
  const MAX_LENGTH = 10000;
  if (cleaned.length > MAX_LENGTH) {
    cleaned = cleaned.substring(0, MAX_LENGTH);
  }

  return cleaned;
};

/**
 * 验证URL是否安全
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
