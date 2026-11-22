# LAPORAN PENGUJIAN BACKEND REST API PHISHINGGUARD (TAHAP 3.0)
**Proyek:** PhishingGuard — UAS Keamanan Informasi Universitas Siliwangi  
**Framework:** FastAPI & Uvicorn  
**Model Terintegrasi:** `models/final/random_forest_model.joblib` (16 Fitur Deterministik)  
**Database:** SQLite (`backend/history.db`)  
**Status Pengujian:** 10/10 Test Case Sukses (100% Pass)

---

## 1. Struktur File Backend yang Dibuat

```
backend/
├── main.py                     # Entry point FastAPI, route definition & CORS
├── schemas.py                  # Pydantic schema validation & risk level definition
├── requirements.txt            # Daftar pustaka Python backend
├── history.db                  # Database SQLite lokal audit log
├── services/
│   ├── model_service.py        # Singleton model loader (memuat model 1x saat startup)
│   ├── prediction_service.py   # Ekstraksi fitur leksikal & inferensi Random Forest
│   └── db_service.py           # SQLite persistence untuk GET /api/history
└── README.md                   # Panduan instalasi dan dokumentasi teknis
```

---

## 2. Hasil Pengujian Endpoint REST API

Pengujian dilakukan secara otomatis menggunakan skrip pengujian komprehensif `test_api_endpoints.py`:

| No | Endpoint & Metode | Test Case / Parameter Input | Hasil Response HTTP | Status Prediksi / Output |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `GET /api/health` | Status engine & model | **200 OK** | `status: healthy`, `model_status: ready`, `features: 16` |
| 2 | `GET /api/model-info` | Metadata algoritma & fitur | **200 OK** | `RandomForestClassifier`, 16 fitur, 100 estimators |
| 3 | `GET /api/evaluation` | Metrik evaluasi aktual | **200 OK** | `Accuracy: 99.55%`, `Macro F1: 99.54%`, Confusion Matrix riil |
| 4 | `POST /api/scan` | `https://www.google.com` | **200 OK** | `LEGITIMATE` (Legit: 99.76%, Phish: 0.24%, Risk: LOW) |
| 5 | `POST /api/scan` | `https://secure-login-account-update.example.xyz` | **200 OK** | `PHISHING_DETECTED` (Phish: 58.00%, Risk: MEDIUM) |
| 6 | `POST /api/scan` | `http://192.168.1.1/login` | **200 OK** | `PHISHING_DETECTED` (Phish: 100.00%, Risk: HIGH) |
| 7 | `POST /api/scan` | `""` (URL Kosong) | **422 Unprocessable** | Ditolak: *"Input URL cannot be empty or whitespace."* |
| 8 | `POST /api/scan` | `"abc"` (Input Terlalu Pendek) | **422 Unprocessable** | Ditolak: *"Input URL is too short to be a valid domain or IP."* |
| 9 | `GET /api/history` | Mengambil daftar log scan | **200 OK** | 3 data riwayat scan tersimpan di SQLite |
| 10 | `GET /api/history/{id}` | Detail scan berdasarkan ID | **200 OK** | Mengembalikan detail utuh 16 fitur leksikal & probabilitas |

---

## 3. Contoh Respons JSON Aktual dari Endpoint Utama

### A. Endpoint `POST /api/scan`
```json
{
  "id": "scan-c4d4194cfac8",
  "url": "https://www.google.com",
  "prediction": "LEGITIMATE",
  "label": 1,
  "probability": {
    "legitimate": 99.76,
    "phishing": 0.24
  },
  "risk_level": "LOW",
  "features": {
    "URLLength": 22,
    "DomainLength": 14,
    "IsDomainIP": 0,
    "TLDLength": 3,
    "NoOfSubDomain": 1,
    "NoOfLettersInURL": 17,
    "LetterRatioInURL": 0.7727,
    "NoOfDegitsInURL": 0,
    "DegitRatioInURL": 0.0,
    "NoOfEqualsInURL": 0,
    "NoOfQMarkInURL": 0,
    "NoOfAmpersandInURL": 0,
    "NoOfOtherSpecialCharsInURL": 5,
    "SpacialCharRatioInURL": 0.2273,
    "IsHTTPS": 1,
    "CharContinuationRate": 0.3529
  },
  "processing_time_ms": 1.45,
  "model_version": "3.0",
  "scanned_at": "2026-11-19 05:31:29"
}
```

### B. Endpoint `GET /api/evaluation`
```json
{
  "model_version": "Final-Consistent-v3.0",
  "dataset_name": "PhiUSIIL Phishing URL Dataset (Deduplicated, Raw URL Extracted)",
  "total_samples": 235370,
  "test_samples": 47074,
  "accuracy": 0.9955,
  "macro_f1": 0.9954,
  "weighted_f1": 0.9955,
  "precision_phishing": 0.9964,
  "recall_phishing": 0.9931,
  "f1_phishing": 0.9948,
  "precision_legitimate": 0.9949,
  "recall_legitimate": 0.9973,
  "f1_legitimate": 0.9961,
  "confusion_matrix": {
    "raw": [[19966, 138], [72, 26898]],
    "true_positive": 19966,
    "false_negative": 138,
    "false_positive": 72,
    "true_negative": 26898
  }
}
```

---

## 4. Keamanan & Kepatuhan Validasi
- **Zero-Network Isolation**: Server backend tidak pernah memanggil URL target melalui jaringan (tidak ada koneksi HTTP keluar).
- **Penanganan Input Malformed**: Input non-domain, URL kosong, atau whitespace ditangani secara deterministik oleh validator Pydantic dengan status HTTP 422.
- **Model Caching (Singleton)**: Model Scikit-learn dimuat hanya sekali ke dalam RAM saat aplikasi Uvicorn melakukan inisialisasi awal.
