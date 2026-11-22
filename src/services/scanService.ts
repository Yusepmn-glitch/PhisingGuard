import { api } from './api';
import { 
  ScanResult, 
  HealthStatus, 
  ModelInfo, 
  EvaluationMetrics, 
  HistoryResponse, 
  HistoryItem 
} from '../types';

export const scanService = {
  // GET /api/health
  async checkHealth(): Promise<HealthStatus> {
    return api.get<HealthStatus>('/api/health');
  },

  // POST /api/scan
  async scanUrl(url: string): Promise<ScanResult> {
    return api.post<ScanResult>('/api/scan', { url });
  },

  // GET /api/evaluation
  async getEvaluation(): Promise<EvaluationMetrics> {
    return api.get<EvaluationMetrics>('/api/evaluation');
  },

  // GET /api/model-info
  async getModelInfo(): Promise<ModelInfo> {
    return api.get<ModelInfo>('/api/model-info');
  },

  // GET /api/history
  async getHistory(limit: number = 50): Promise<HistoryResponse> {
    return api.get<HistoryResponse>(`/api/history?limit=${limit}`);
  },

  // GET /api/history/{id}
  async getScanDetail(id: string): Promise<HistoryItem> {
    return api.get<HistoryItem>(`/api/history/${id}`);
  }
};
