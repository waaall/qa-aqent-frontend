/**
 * 数据库相关 API
 */
import apiClient from './apiClient';
import { DatabaseInfoResponse } from '@/types';
import config from '@/config';
import logger from '@/utils/logger';

export const databaseApi = {
  /**
   * 获取数据库信息
   * @param dbName 数据库名称（可选）
   * @param dbSource 数据源（可选：'clickhouse' | 其他）
   */
  async getInfo(dbName?: string, dbSource?: string): Promise<DatabaseInfoResponse> {
    logger.debug('Fetching database info', { dbName, dbSource });
    return apiClient.get<DatabaseInfoResponse>(config.endpoints.databaseInfo, {
      params: {
        db_name: dbName,
        db_source: dbSource,
      },
    });
  },
};

export default databaseApi;
