# PhishingGuard — REST API Backend Engine

Backend REST API untuk aplikasi **PhishingGuard** (UAS Keamanan Informasi Universitas Siliwangi — Topik 1: Defensive AI).

Dibangun menggunakan **FastAPI** dan mengintegrasikan model Machine Learning **Random Forest Classifier** hasil training bersih (*Zero-Leakage & 16 Deterministik Lexical Features*).

---

## 1. Arsitektur File Backend

```
backend/
├── main.py                     # Entry point FastAPI, routing, & CORS setup
├── schemas.py                  # Pydantic data schemas & request validators
├── requirements.txt            # Dependensi Python
├── history.db                  # Database SQLite lokal untuk riwayat scan
├── services/
│   ├── model_service.py        # Singleton loader model Scikit-learn & skema
│   ├── prediction_service.py   # Pipeline ekstraksi fitur leksikal & inferensi
│   └── db_service.py           # SQLite persistence untuk audit log
└── README.md                   # Dokumentasi teknis
```

---

## 2. Cara Instalasi & Menjalankan Server

### Prasyarat
- Python 3.10+ (atau Python 3.14)
- Virtual environment (opsional namun disarankan)

### Instalasi Dependensi
```bash
pip install -r backend/requirements.txt
```

### Menjalankan Server API
Jalankan server Uvicorn pada host `127.0.0.1` dan port `8000`:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Server akan aktif di: `http://127.0.0.1:8000`  
Dokumentasi interaktif Swagger UI tersedia di: `http://127.0.0.1:8000/docs`

---

## 3. Daftar Endpoint API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status kesehatan backend, status model, dan jumlah fitur |
| `POST` | `/api/scan` | Menganalisis URL mentah & mengembalikan hasil klasifikasi RF |
| `GET` | `/api/evaluation` | Mengambil metrik evaluasi aktual dari training |
| `GET` | `/api/model-info` | Informasi algoritma, parameter, dan skema fitur model |
| `GET` | `/api/history` | Riwayat log inspeksi URL (SQLite) |
| `GET` | `/api/history/{id}` | Detail inspeksi berdasarkan scan ID |

---

## 4. Contoh Request & Response

### POST `/api/scan`
**Request Body:**
```json
{
  "url": "https://secure-login-account-update.example.xyz"
}
```

**Response (200 OK):**
```json
{
  "id": "scan-939e9444f23b",
  "url": "https://secure-login-account-update.example.xyz",
  "prediction": "PHISHING_DETECTED",
  "label": 0,
  "probability": {
    "legitimate": 42.0,
    "phishing": 58.0
  },
  "risk_level": "MEDIUM",
  "features": {
    "URLLength": 47,
    "DomainLength": 39,
    "IsDomainIP": 0,
    "TLDLength": 3,
    "NoOfSubDomain": 1,
    "NoOfLettersInURL": 38,
    "LetterRatioInURL": 0.8085,
    "NoOfDegitsInURL": 0,
    "DegitRatioInURL": 0.0,
    "NoOfEqualsInURL": 0,
    "NoOfQMarkInURL": 0,
    "NoOfAmpersandInURL": 0,
    "NoOfOtherSpecialCharsInURL": 8,
    "SpacialCharRatioInURL": 0.1702,
    "IsHTTPS": 1,
    "CharContinuationRate": 0.3684
  },
  "processing_time_ms": 1.45,
  "model_version": "3.0",
  "scanned_at": "2026-11-19 05:00:00"
}
```

---

## 5. Keamanan & Prinsip Zero-Network
1. **Zero-Network Quarantine**: Server backend tidak pernah melakukan request HTTP/TCP ke URL target. Analisis murni dilakukan secara statis melalui ekstraksi leksikal string URL.
2. **Input Sanitization**: URL kosong, whitespace, dan string acak tanpa struktur domain ditolak dengan HTTP 422.
3. **No Dynamic Eval**: Tidak ada fungsi `eval()` atau eksekusi kode dinamis.
