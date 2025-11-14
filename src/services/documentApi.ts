/**
 * 文档相关 API
 */

import apiClient from './apiClient';
import {
  UploadDocumentResponse,
  ListDocumentsResponse,
} from '@/types';
import logger from '@/utils/logger';

export const documentApi = {
  /**
   * 上传文档
   */
  async upload(file: File): Promise<UploadDocumentResponse> {
    logger.info('Uploading document', { filename: file.name, size: file.size });
    return apiClient.upload<UploadDocumentResponse>('/upload', file);
  },

  /**
   * 获取文档列表
   */
  async list(): Promise<ListDocumentsResponse> {
    logger.debug('Fetching document list');
    return apiClient.get<ListDocumentsResponse>('/documents');
  },
};

export default documentApi;
