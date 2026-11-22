import os
import json
import time
import joblib
import pandas as pd
import numpy as np
from src.feature_extractor import extract_features, extract_features_vector, FEATURE_NAMES

print("="*80)
print("AUDIT SKRIP TAHAP 2.9: VERIFIKASI LANGSUNG ARTEFAK & EKSEKUSI MODEL FINAL")
print("="*80)

# 1. Audit Artefak
files_to_check = [
    "models/final/random_forest_model.joblib",
    "models/final/feature_schema.json",
    "models/final/evaluation_metrics.json",
    "models/final/training_metadata.json",
    "src/feature_extractor.py",
    "train_model_final.py"
]

print("\n--- 1. AUDIT ARTEFAK FILE ---")
artifact_status = {}
for f in files_to_check:
    exists = os.path.exists(f)
    size = os.path.getsize(f) if exists else 0
    readable = False
    if exists:
        try:
            if f.endswith('.json'):
                with open(f, 'r', encoding='utf-8') as jf:
                    json.load(jf)
                readable = True
            elif f.endswith('.joblib'):
                joblib.load(f)
                readable = True
            elif f.endswith('.py'):
                with open(f, 'r', encoding='utf-8') as pyf:
                    pyf.read()
                readable = True
        except Exception as e:
            readable = False
    artifact_status[f] = {"exists": exists, "size_bytes": size, "readable": readable}
    print(f"  [{'OK' if exists and readable else 'FAIL'}] {f} | Size: {size:,} bytes | Readable: {readable}")

# 2. Audit Konsistensi Fitur
print("\n--- 2. AUDIT KONSISTENSI 16 FITUR ---")
with open("models/final/feature_schema.json", 'r', encoding='utf-8') as f:
    schema = json.load(f)

model = joblib.load("models/final/random_forest_model.joblib")
model_feats = list(model.feature_names_in_)
schema_feats = schema["features"]
extractor_feats = FEATURE_NAMES

print(f"  • Jumlah Fitur pada Model        : {len(model_feats)}")
print(f"  • Jumlah Fitur pada Schema       : {len(schema_feats)}")
print(f"  • Jumlah Fitur pada Extractor    : {len(extractor_feats)}")
assert len(model_feats) == 16, "Model feature count must be exactly 16"
assert model_feats == schema_feats, "Model features do not match schema"
assert model_feats == extractor_feats, "Model features do not match extractor"
print("  => 100% KONSISTEN: Nama dan urutan 16 fitur identik.")

# 3. Uji Prediksi 5 Target URL
print("\n--- 4. UJI PREDIKSI 5 TARGET URL ---")
test_urls = [
    "https://www.google.com",
    "https://www.wikipedia.org",
    "https://example.com",
    "http://192.168.1.1/login",
    "https://secure-login-account-update.example.xyz"
]

prediction_results = []
for u in test_urls:
    t0 = time.perf_counter()
    feat_dict = extract_features(u)
    feat_df = pd.DataFrame([feat_dict], columns=FEATURE_NAMES)
    pred = int(model.predict(feat_df)[0])
    proba = model.predict_proba(feat_df)[0]
    dt_ms = (time.perf_counter() - t0) * 1000

    pred_label = "LEGITIMATE" if pred == 1 else "PHISHING_DETECTED"
    prob_phish = float(proba[0])
    prob_legit = float(proba[1])

    res = {
        "url": u,
        "prediction": pred_label,
        "class_index": pred,
        "prob_legit": prob_legit,
        "prob_phish": prob_phish,
        "latency_ms": round(dt_ms, 2),
        "features": feat_dict
    }
    prediction_results.append(res)
    print(f"URL: {u}")
    print(f"  • Prediksi: {pred_label} (Class {pred})")
    print(f"  • Probabilitas Legit: {prob_legit*100:.2f}% | Phishing: {prob_phish*100:.2f}%")
    print(f"  • Latency: {dt_ms:.2f} ms")

# 5. Uji Ketahanan Input (Robustness Test)
print("\n--- 5. UJI KETAHANAN INPUT & VALIDASI ---")
robustness_cases = [
    ("", "URL Kosong"),
    ("   ", "URL Whitespace"),
    ("google.com", "URL Tanpa Skema (google.com)"),
    ("http://localhost:8080/dashboard", "URL dengan Port (localhost:8080)"),
    ("https://subdomain.example.com/search?q=test&lang=en&page=2#top", "URL dengan Query & Fragment"),
    ("https://" + "sub."*15 + "example.com/deep/path", "URL dengan Subdomain Panjang"),
    ("https://user:pass@example.com:8443/test?a=1&b=2#sec", "URL dengan Karakter Khusus & Auth Token"),
    ("not-a-valid-url-at-all", "String Non-URL Acak")
]

robustness_results = []
for inp, desc in robustness_cases:
    # Uji validasi input
    is_valid = bool(inp and inp.strip() and len(inp.strip()) > 3 and '.' in inp.strip())
    error_msg = None
    if not is_valid:
        error_msg = "Input tidak valid: URL kosong atau format tidak memiliki domain/host yang valid."
        print(f"[{desc}] => INPUT DITOLAK: {error_msg}")
        robustness_results.append({"input": inp, "desc": desc, "status": "REJECTED", "error": error_msg})
        continue

    # Jika valid, jalankan ekstraksi & prediksi
    try:
        t0 = time.perf_counter()
        f_dict = extract_features(inp)
        f_df = pd.DataFrame([f_dict], columns=FEATURE_NAMES)
        pred = int(model.predict(f_df)[0])
        proba = model.predict_proba(f_df)[0]
        dt = (time.perf_counter() - t0) * 1000
        p_label = "LEGITIMATE" if pred == 1 else "PHISHING_DETECTED"
        print(f"[{desc}] => OK ({dt:.2f}ms) | Prediksi: {p_label} (Legit: {proba[1]*100:.1f}%, Phish: {proba[0]*100:.1f}%)")
        robustness_results.append({
            "input": inp, "desc": desc, "status": "PROCESSED",
            "prediction": p_label, "prob_legit": round(float(proba[1]), 4),
            "prob_phish": round(float(proba[0]), 4), "latency_ms": round(dt, 2)
        })
    except Exception as e:
        print(f"[{desc}] => CRASH/ERROR: {e}")
        robustness_results.append({"input": inp, "desc": desc, "status": "ERROR", "error": str(e)})

# Simpan hasil pengujian sementara untuk diekspor ke laporan md
output_audit = {
    "artifact_status": artifact_status,
    "predictions": prediction_results,
    "robustness": robustness_results
}

with open("reports/audit_raw_results.json", 'w', encoding='utf-8') as f:
    json.dump(output_audit, f, indent=2)

print("\nAudit selesai. Data mentah tersimpan di reports/audit_raw_results.json.")
