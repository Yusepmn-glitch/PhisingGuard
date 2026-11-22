import time
import uuid
import datetime
import pandas as pd
from typing import Dict, Any

from src.feature_extractor import extract_features, FEATURE_NAMES
from backend.services.model_service import model_service
from backend.services.db_service import db_service

class PredictionService:
    @staticmethod
    def calculate_risk_level(prob_phishing: float) -> str:
        """
        Kalkulasi Risk Level transparan berdasarkan probabilitas estimasi model:
        - HIGH   : Probabilitas phishing >= 70%
        - MEDIUM : Probabilitas phishing antara 40% s.d. < 70%
        - LOW    : Probabilitas phishing < 40% (didominasi pola legitimate)
        """
        if prob_phishing >= 70.0:
            return "HIGH"
        elif prob_phishing >= 40.0:
            return "MEDIUM"
        else:
            return "LOW"

    @classmethod
    def analyze_url(cls, raw_url: str) -> Dict[str, Any]:
        if not model_service.is_loaded:
            raise RuntimeError(f"Machine Learning model is not available: {model_service.load_error}")

        t_start = time.perf_counter()

        # 1. Ekstraksi 16 fitur deterministik langsung dari URL mentah (Zero-Network)
        features_dict = extract_features(raw_url)

        # 2. Susun DataFrame dengan urutan dan nama kolom yang persis sesuai feature_schema
        expected_features = model_service.feature_names
        features_df = pd.DataFrame([features_dict], columns=expected_features)

        # 3. Inferensi Random Forest (Predict & Predict Proba)
        raw_pred = int(model_service.model.predict(features_df)[0])
        raw_proba = model_service.model.predict_proba(features_df)[0]

        # Waktu pemrosesan
        dt_ms = round((time.perf_counter() - t_start) * 1000, 2)

        # Semantik Label Dataset PhiUSIIL:
        # Class 0: Phishing, Class 1: Legitimate
        # raw_proba[0] = probabilitas Phishing, raw_proba[1] = probabilitas Legitimate
        prob_phish = round(float(raw_proba[0]) * 100, 2)
        prob_legit = round(float(raw_proba[1]) * 100, 2)
        prediction_label = "LEGITIMATE" if raw_pred == 1 else "PHISHING_DETECTED"
        risk_level = cls.calculate_risk_level(prob_phish)

        scan_id = f"scan-{uuid.uuid4().hex[:12]}"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        response_data = {
            "id": scan_id,
            "url": raw_url,
            "prediction": prediction_label,
            "label": raw_pred,
            "probability": {
                "legitimate": prob_legit,
                "phishing": prob_phish
            },
            "risk_level": risk_level,
            "features": features_dict,
            "processing_time_ms": dt_ms,
            "model_version": "3.0",
            "scanned_at": now_str
        }

        # 4. Simpan ke SQLite History
        db_record = {
            "id": scan_id,
            "url": raw_url,
            "prediction": prediction_label,
            "label": raw_pred,
            "prob_legitimate": prob_legit,
            "prob_phishing": prob_phish,
            "risk_level": risk_level,
            "processing_time_ms": dt_ms,
            "scanned_at": now_str,
            "features": features_dict
        }
        db_service.save_scan(db_record)

        return response_data

prediction_service = PredictionService()
