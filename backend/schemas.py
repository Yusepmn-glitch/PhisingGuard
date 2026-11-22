from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Optional

class ScanRequest(BaseModel):
    url: str = Field(..., description="Target URL string to be inspected")

    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        trimmed = v.strip() if isinstance(v, str) else ""
        if not trimmed:
            raise ValueError("Input URL cannot be empty or whitespace.")
        if len(trimmed) < 4:
            raise ValueError("Input URL is too short to be a valid domain or IP.")
        # Minimal format check: must contain a dot or valid IP separator
        if '.' not in trimmed and ':' not in trimmed:
            raise ValueError("Input URL must contain a valid domain extension or IP address.")
        return trimmed

class ProbabilityDistribution(BaseModel):
    legitimate: float = Field(..., description="Legitimate confidence probability percentage (0-100)")
    phishing: float = Field(..., description="Phishing threat probability percentage (0-100)")

class ScanResponse(BaseModel):
    id: str = Field(..., description="Unique inspection log UUID")
    url: str
    prediction: str = Field(..., description="'LEGITIMATE' or 'PHISHING_DETECTED'")
    label: int = Field(..., description="Numeric class: 1 for Legitimate, 0 for Phishing")
    probability: ProbabilityDistribution
    risk_level: str = Field(..., description="'LOW', 'MEDIUM', or 'HIGH'")
    features: Dict[str, Any] = Field(..., description="16 extracted static lexical features")
    processing_time_ms: float
    model_version: str = "3.0"
    scanned_at: str

class HealthResponse(BaseModel):
    status: str
    model_status: str
    model_version: str
    features_count: int
    environment: str

class ModelInfoResponse(BaseModel):
    algorithm: str
    model_version: str
    features_count: int
    features_names: List[str]
    target_mapping: Dict[str, str]
    dataset_name: str
    hyperparameters: Dict[str, Any]

class EvaluationResponse(BaseModel):
    model_version: str
    dataset_name: str
    total_samples: int
    test_samples: int
    accuracy: float
    macro_f1: float
    weighted_f1: float
    precision_phishing: float
    recall_phishing: float
    f1_phishing: float
    precision_legitimate: float
    recall_legitimate: float
    f1_legitimate: float
    confusion_matrix: Dict[str, Any]

class HistoryItem(BaseModel):
    id: str
    url: str
    prediction: str
    label: int
    prob_legitimate: float
    prob_phishing: float
    risk_level: str
    processing_time_ms: float
    scanned_at: str
    features: Optional[Dict[str, Any]] = None

class HistoryResponse(BaseModel):
    total: int
    history: List[HistoryItem]
