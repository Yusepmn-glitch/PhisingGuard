import sys
import os

# Tambahkan root workspace ke sys.path agar impor src.feature_extractor berjalan lancar
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.schemas import (
    ScanRequest, ScanResponse, HealthResponse,
    ModelInfoResponse, EvaluationResponse, HistoryResponse, HistoryItem
)
from backend.services.model_service import model_service
from backend.services.prediction_service import prediction_service
from backend.services.db_service import db_service

app = FastAPI(
    title="PhishingGuard Defensive AI REST API",
    description="Machine Learning REST API untuk Deteksi dan Klasifikasi URL Phishing menggunakan Algoritma Random Forest (Topik 1 — Defensive AI).",
    version="3.0.0"
)

# CORS Middleware: Izinkan semua origin (Vercel, Railway, Localhost) untuk API publik
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OPTIONS catch-all handler untuk browser preflight requests
@app.options("/{rest_of_path:path}")
def preflight_handler(rest_of_path: str):
    return JSONResponse(content={"status": "preflight-ok"}, status_code=200)

@app.get("/api/health", response_model=HealthResponse, tags=["System Health"])
def get_health():
    """Mengembalikan status engine backend, status model, versi, dan jumlah fitur."""
    return HealthResponse(
        status="healthy",
        model_status="ready" if model_service.is_loaded else f"error: {model_service.load_error}",
        model_version="3.0",
        features_count=len(model_service.feature_names),
        environment="production-ready (local)"
    )

@app.post("/api/scan", response_model=ScanResponse, tags=["Inspection"])
def scan_url(payload: ScanRequest):
    """
    Menganalisis URL mentah menggunakan 16 fitur leksikal deterministik 
    dan melakukan estimasi klasifikasi melalui Random Forest Classifier.
    """
    try:
        result = prediction_service.analyze_url(payload.url)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(val_err))
    except RuntimeError as r_err:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(r_err))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal analysis error")

@app.get("/api/evaluation", response_model=EvaluationResponse, tags=["Model Benchmarks"])
def get_evaluation():
    """Mengembalikan metrik evaluasi aktual model Random Forest dari models/final/evaluation_metrics.json."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model artifacts not available")
    
    eval_raw = model_service.get_evaluation()
    strat = eval_raw.get("stratified_test_metrics", {})
    phish_cls = strat.get("phishing_class_0", {})
    legit_cls = strat.get("legitimate_class_1", {})

    return EvaluationResponse(
        model_version=eval_raw.get("model_version", "3.0"),
        dataset_name=eval_raw.get("dataset_name", "PhiUSIIL Phishing URL Dataset"),
        total_samples=eval_raw.get("deduplicated_samples", 235370),
        test_samples=eval_raw.get("test_samples", 47074),
        accuracy=strat.get("accuracy", 0.0),
        macro_f1=strat.get("macro_average", {}).get("f1_score", 0.0),
        weighted_f1=strat.get("weighted_average", {}).get("f1_score", 0.0),
        precision_phishing=phish_cls.get("precision", 0.0),
        recall_phishing=phish_cls.get("recall", 0.0),
        f1_phishing=phish_cls.get("f1_score", 0.0),
        precision_legitimate=legit_cls.get("precision", 0.0),
        recall_legitimate=legit_cls.get("recall", 0.0),
        f1_legitimate=legit_cls.get("f1_score", 0.0),
        confusion_matrix=strat.get("confusion_matrix", {})
    )

@app.get("/api/model-info", response_model=ModelInfoResponse, tags=["Model Info"])
def get_model_info():
    """Mengembalikan arsitektur model, parameter, dan skema fitur yang digunakan."""
    if not model_service.is_loaded:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model metadata not loaded")
    return model_service.get_info()

@app.get("/api/history", response_model=HistoryResponse, tags=["Audit Logs"])
def get_history(limit: int = 50):
    """Mengambil riwayat log pemeriksaan URL dari database SQLite lokal."""
    records = db_service.get_all_scans(limit=limit)
    items = [HistoryItem(**r) for r in records]
    return HistoryResponse(total=len(items), history=items)

@app.get("/api/history/{scan_id}", response_model=HistoryItem, tags=["Audit Logs"])
def get_history_detail(scan_id: str):
    """Mengambil detail hasil inspeksi tertentu berdasarkan ID scan."""
    record = db_service.get_scan_by_id(scan_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scan record '{scan_id}' not found")
    return HistoryItem(**record)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
