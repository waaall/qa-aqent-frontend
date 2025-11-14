/**
 * 系统相关 API
 */

import apiClient from './apiClient';
import { HealthResponse, StatsResponse } from '@/types';
import logger from '@/utils/logger';

export const systemApi = {
  /**
   * 健康检查
   */
  async checkHealth(): Promise<HealthResponse> {
    logger.debug('Checking system health');
    return apiClient.get<HealthResponse>('/health');
  },

  /**
   * 获取系统统计
   */
  async getStats(): Promise<StatsResponse> {
    logger.debug('Fetching system stats');
    return apiClient.get<StatsResponse>('/stats');
  },
};

export default systemApi;
