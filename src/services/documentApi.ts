/**
 * 文档相关 API
 */

import apiClient from './apiClient';
import {
  UploadDocumentResponse,
  ListDocumentsResponse,
  UploadTaskStatus,
} from '@/types';
import config from '@/config';
import logger from '@/utils/logger';

export const documentApi = {
  /**
   * 上传文档
   */
  async upload(file: File): Promise<UploadDocumentResponse> {
    logger.info('Uploading document', { filename: file.name, size: file.size });
    return apiClient.upload<UploadDocumentResponse>(config.endpoints.documentUpload, file);
  },

  /**
   * 获取文档列表
   */
  async list(): Promise<ListDocumentsResponse> {
    logger.debug('Fetching document list');
    return apiClient.get<ListDocumentsResponse>(config.endpoints.documentList);
  },

  /**
   * 查询上传任务状态
   */
  async getUploadStatus(taskId: string): Promise<UploadTaskStatus> {
    logger.debug('Fetching upload status', { taskId });
    return apiClient.get<UploadTaskStatus>(`${config.endpoints.uploadStatus}/${taskId}`);
  },

  /**
   * 轮询上传状态（工具方法）
   * @param taskId 任务ID
   * @param onProgress 进度回调
   * @param interval 轮询间隔(ms)，默认 2000
   */
  async pollUploadStatus(
    taskId: string,
    onProgress?: (status: UploadTaskStatus) => void,
    interval: number = 2000
  ): Promise<UploadTaskStatus> {
    logger.info('Starting upload status polling', { taskId });

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getUploadStatus(taskId);
          onProgress?.(status);

          // 终止条件：completed 或 failed
          if (status.status === 'completed' || status.status === 'failed') {
            logger.info('Upload polling finished', { taskId, finalStatus: status.status });
            resolve(status);
            return;
          }

          // 继续轮询
          setTimeout(poll, interval);
        } catch (error) {
          logger.error('Poll upload status failed', error);
          reject(error);
        }
      };

      poll();
    });
  },
};

export default documentApi;
