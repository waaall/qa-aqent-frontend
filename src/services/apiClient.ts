/**
 * API 客户端 - Axios 封装
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import config from '@/config';
import logger from '@/utils/logger';
import { ApiError } from '@/types';
import { getBackendUrl, isTauriEnv } from '@/lib/tauri';

class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;
  private initPromise: Promise<void>;

  constructor() {
    // 初始化流程：
    // 1. 使用默认配置创建 Axios 实例（Web 环境使用此默认值）
    // 2. 设置请求/响应拦截器
    // 3. 启动异步初始化（Tauri 环境下从 Store 加载后端地址）
    // 4. 所有 API 方法通过 ready() 等待初始化完成
    this.baseURL = config.apiBaseUrl;
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout.default,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.initPromise = this.init();
  }

  private async init() {
    if (!isTauriEnv()) {
      return;
    }

    try {
      const storedUrl = await getBackendUrl();
      this.updateBaseURL(storedUrl);
    } catch (error) {
      logger.warn('Failed to load backend URL from Tauri store', error);
    }
  }

  private async ready() {
    await this.initPromise;
  }

  public updateBaseURL(url: string) {
    this.baseURL = url;
    this.instance.defaults.baseURL = url;
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        logger.debug('API Request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private handleError(error: AxiosError) {
    // 只记录日志，不显示错误提示，由各API层决定是否显示
    logger.error('API Error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });
  }

  private transformError(error: AxiosError): ApiError {
    return {
      message: error.message,
      status: error.response?.status,
      code: error.code,
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ready();
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    await this.ready();
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    await this.ready();
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
