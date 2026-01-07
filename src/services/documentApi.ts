/**
 * 文档相关 API
 */

import apiClient from './apiClient';
import {
  UploadDocumentResponse,
  ListDocumentsResponse,
  UploadTaskStatus,
  UpdateIndexResponse,
  UpdateTaskStatus,
} from '@/types';
import config from '@/config';
import logger from '@/utils/logger';
import { showNotification } from '@/lib/tauri';

export const documentApi = {
  /**
   * 上传文档
   * @param file 文件对象
   * @param label 文档标签，默认为 'general'
   */
  async upload(file: File, label: string = 'general'): Promise<UploadDocumentResponse> {
    logger.info('Uploading document', { filename: file.name, size: file.size, label });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('label', label);

    return apiClient.post<UploadDocumentResponse>(
      config.endpoints.documentUpload,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: config.timeout.upload,
      }
    );
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
            if (status.status === 'completed') {
              void showNotification('文档上传成功', '文件已处理完成');
            } else {
              void showNotification('文档上传失败', '文件处理失败，请检查后端状态');
            }
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

  /**
   * 提交更新向量库任务
   */
  async updateIndex(): Promise<UpdateIndexResponse> {
    logger.info('Submitting update index task');
    return apiClient.post<UpdateIndexResponse>(
      config.endpoints.updateIndex,
      {},
      { timeout: config.timeout.default }
    );
  },

  /**
   * 查询更新任务状态
   */
  async getUpdateStatus(taskId: string): Promise<UpdateTaskStatus> {
    logger.debug('Fetching update status', { taskId });
    return apiClient.get<UpdateTaskStatus>(
      `${config.endpoints.updateIndexStatus}/${taskId}`
    );
  },

  /**
   * 轮询更新任务状态
   * @param taskId 任务ID
   * @param onProgress 进度回调
   * @param interval 轮询间隔(ms)，默认 2000
   */
  async pollUpdateStatus(
    taskId: string,
    onProgress?: (status: UpdateTaskStatus) => void,
    interval: number = 2000
  ): Promise<UpdateTaskStatus> {
    logger.info('Starting update status polling', { taskId });

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getUpdateStatus(taskId);
          onProgress?.(status);

          // 终止条件：completed 或 failed
          if (status.status === 'completed' || status.status === 'failed') {
            logger.info('Update polling finished', {
              taskId,
              finalStatus: status.status,
            });
            if (status.status === 'completed') {
              void showNotification('向量库更新完成', '索引已完成更新');
            } else {
              void showNotification('向量库更新失败', '请检查后端任务状态');
            }
            resolve(status);
            return;
          }

          // 继续轮询
          setTimeout(poll, interval);
        } catch (error) {
          logger.error('Poll update status failed', error);
          reject(error);
        }
      };

      poll();
    });
  },
};

export default documentApi;
