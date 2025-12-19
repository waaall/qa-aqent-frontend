/**
 * API 请求和响应类型定义
 */

export type QueryType = 'knowledge' | 'sql' | 'api' | 'general';

export interface ChatRequest {
  query: string;
  session_id?: string;
  query_type?: QueryType;
  create_session?: boolean;
  stream_thoughts?: boolean;  // 是否启用思考流
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  session_id: string;
  query_type: string;
  engines_used?: string[];
  confidence?: number;
  enhancement_applied?: boolean;
  error?: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  message?: string;
  task_id?: string;        // 新增：任务ID
  filename?: string;
  file_type?: string;      // 新增：文件类型
  status_url?: string;     // 新增：状态查询URL
  doc_count?: number;
  error?: string;
}

export interface Document {
  filename: string;
  size: number;
  modified: number;
}

export interface ListDocumentsResponse {
  success: boolean;
  documents: Document[];
  count: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  llm?: {
    provider: string;
    ready: boolean;
    current_model: string;
  };
  timestamp: string;
}

export interface StatsResponse {
  success: boolean;
  stats: {
    vector_store: {
      collection_name: string;
      document_count: number;
    };
    version: string;
  };
}

export interface SessionHistoryResponse {
  success: boolean;
  session_id: string;
  history: Array<{
    role: string;
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>;
  count: number;
}

// /api/react_query 接口
export interface ReactQueryRequest {
  query: string;
  reset?: boolean;
}

export interface ReactQueryResponse {
  success: boolean;
  answer: string;
  raw?: string;
  fallback_triggered?: boolean;
  fallback_reason?: string;
}

// /upload/status/{task_id} 接口
export interface UploadTaskStatus {
  success: boolean;
  task_id: string;
  status: 'pending' | 'preprocessing' | 'indexing' | 'completed' | 'failed';
  stage: string | null;
  filename: string;
  file_type: string;
  needs_preprocessing: boolean;
  created_at: string;
  progress: {
    preprocessing: 'in_progress' | 'completed' | 'failed' | 'skipped' | null;
    indexing: 'in_progress' | 'completed' | 'failed' | null;
  };
  errors: Array<{
    stage: string;
    message: string;
    timestamp: string;
  }>;
  doc_count?: number;
  total_count?: number;
  mode?: string;
  completed_at?: string;
}

// /context/{session_id}/info 接口
export interface ContextInfoResponse {
  success: boolean;
  context: {
    session_id: string;
    messages: Array<{
      role: string;
      content: string;
      timestamp: number;
      metadata?: Record<string, unknown>;
    }>;
    created_at?: number;
    last_accessed?: number;
    metadata?: Record<string, unknown>;
  };
}

// 通用成功响应
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// /database/info 接口
export interface DatabaseInfoResponse {
  success: boolean;
  info: {
    [key: string]: unknown;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
