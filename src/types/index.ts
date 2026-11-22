export interface UrlFeatures {
  URLLength: number;
  DomainLength: number;
  IsDomainIP: number;
  TLDLength: number;
  NoOfSubDomain: number;
  NoOfLettersInURL: number;
  LetterRatioInURL: number;
  NoOfDegitsInURL: number;
  DegitRatioInURL: number;
  NoOfEqualsInURL: number;
  NoOfQMarkInURL: number;
  NoOfAmpersandInURL: number;
  NoOfOtherSpecialCharsInURL: number;
  SpacialCharRatioInURL: number;
  IsHTTPS: number;
  CharContinuationRate: number;
  [key: string]: any;
}

export type ScanStatus = 'LEGITIMATE' | 'PHISHING_DETECTED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProbabilityDistribution {
  legitimate: number;
  phishing: number;
}

export interface ScanResult {
  id: string;
  url: string;
  prediction: ScanStatus;
  label: number;
  probability: ProbabilityDistribution;
  risk_level: RiskLevel;
  features: UrlFeatures;
  processing_time_ms: number;
  model_version: string;
  scanned_at: string;
}

export interface HealthStatus {
  status: string;
  model_status: string;
  model_version: string;
  features_count: number;
  environment: string;
}

export interface ModelInfo {
  algorithm: string;
  model_version: string;
  features_count: number;
  features_names: string[];
  target_mapping: Record<string, string>;
  dataset_name: string;
  hyperparameters: Record<string, any>;
}

export interface EvaluationMetrics {
  model_version: string;
  dataset_name: string;
  total_samples: number;
  test_samples: number;
  accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  precision_phishing: number;
  recall_phishing: number;
  f1_phishing: number;
  precision_legitimate: number;
  recall_legitimate: number;
  f1_legitimate: number;
  confusion_matrix: {
    raw: number[][];
    true_positive: number;
    false_negative: number;
    false_positive: number;
    true_negative: number;
  };
  feature_importance?: {
    feature: string;
    importance: number;
  }[];
}

export interface HistoryItem {
  id: string;
  url: string;
  prediction: ScanStatus;
  label: number;
  prob_legitimate: number;
  prob_phishing: number;
  risk_level: RiskLevel;
  processing_time_ms: number;
  scanned_at: string;
  features?: UrlFeatures;
}

export interface HistoryResponse {
  total: number;
  history: HistoryItem[];
}
