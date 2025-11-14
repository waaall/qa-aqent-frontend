/**
 * API 请求和响应类型定义
 */

export type QueryType = 'knowledge' | 'sql' | 'api' | 'general';

export interface ChatRequest {
  query: string;
  session_id?: string;
  query_type?: QueryType;
  create_session?: boolean;
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
  filename?: string;
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
  ollama?: {
    running: boolean;
    model_available: boolean;
    model_loaded: boolean;
    current_model: string;
    running_models: string[];
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

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
