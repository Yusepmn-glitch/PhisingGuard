# LAPORAN INTEGRASI FRONTEND & BACKEND PHISHINGGUARD (TAHAP 3.1)
**Project:** PhishingGuard — Sistem Deteksi URL Phishing Berbasis Machine Learning  
**Mata Kuliah:** UAS Keamanan Informasi (Topik 1: Defensive AI)  
**Tanggal:** 19 November 2026  
**Status:** COMPLETE & PRODUCTION-READY  

---

## 1. RINGKASAN INTEGRASI

Tahap 3.1 berhasil menghubungkan antarmuka pengguna **Frontend (React + TypeScript + Tailwind CSS)** dengan **Backend REST API (Python FastAPI)** secara penuh. Semua data mock/simulasi telah dihilangkan dan digantikan dengan inferensi langsung dari **Random Forest Model final v3.0** (`models/final/random_forest_model.joblib`), fitur leksikal deterministik 16-dimensi (`src/feature_extractor.py`), serta penyimpanan riwayat pemindaian berbasis database SQLite (`backend/history.db`).

Seluruh identitas visual, estetika keamanan (*Cybersecurity Sentinel Precision*), palet warna dark/light, tipografi (*Inter* dan *JetBrains Mono*), tata letak (*layout*), sidebar, dan navigasi dipertahankan 100% tanpa perubahan visual yang merusak desain sebelumnya.

---

## 2. ARSITEKTUR KOMUNIKASI SISTEM

```
+-------------------------------------------------------------+
|                     FRONTEND REACT (SPA)                   |
|                   http://127.0.0.1:5173                     |
+-------------------------------------------------------------+
       |                  |                  |             |
  (GET /health)      (POST /scan)     (GET /history) (GET /evaluation)
       |                  |                  |             |
+------v------------------v------------------v-------------v--+
|                   CENTRAL API CLIENT                        |
|                   (src/services/api.ts)                     |
|           Base URL: VITE_API_BASE_URL (Port 8000)           |
+-------------------------------------------------------------+
                               |
                   HTTP REST Calls with CORS
                               |
+------------------------------v------------------------------+
|                 BACKEND FASTAPI (PYTHON 3.11)               |
|                   http://127.0.0.1:8000                     |
+-------------------------------------------------------------+
          |                         |                 |
  [Feature Extractor]        [Random Forest]     [SQLite DB]
  src/feature_extractor.py    models/final/      backend/history.db
  - 16 Lexical Features      v3.0 (Zero-Leak)    Persistent logs
  - Zero Network Calls       100 Trees
```

---

## 3. IMPLEMENTASI PER KOMPONEN & HALAMAN

### A. Centralized API Configuration & Client
- **File:** `src/services/api.ts`
- **Konfigurasi Environment:** `.env` (`VITE_API_BASE_URL=http://127.0.0.1:8000`)
- **Kapabilitas:**
  - Singleton `api` client (`get`, `post`) terpusat tanpa penulisan hardcoded URL berulang.
  - Penanganan error jaringan cerdas: menampilkan pesan ramah bagi pengguna jika backend mati atau tidak terjangkau (*Backend Disconnected*).
  - Timeout dan error handling non-blocking yang menjaga UI tetap responsif.

### B. Service Layer Terpadu
- **File:** `src/services/scanService.ts`
- **Daftar Endpoint yang Diintegrasikan:**
  1. `checkHealth()` &rarr; `GET /api/health`
  2. `scanUrl(url)` &rarr; `POST /api/scan`
  3. `getEvaluation()` &rarr; `GET /api/evaluation`
  4. `getModelInfo()` &rarr; `GET /api/model-info`
  5. `getHistory(limit)` &rarr; `GET /api/history`
  6. `getScanDetail(id)` &rarr; `GET /api/history/{id}`

### C. Topbar Real-Time Engine Monitor
- **File:** `src/components/layout/Topbar.tsx`
- **Fitur:** Melakukan polling periodik status backend ke `GET /api/health`.
  - Jika backend aktif: menampilkan badge hijau berdenyut **"Engine Online (v3.0)"**.
  - Jika backend nonaktif: menampilkan badge merah **"Backend Offline"** beserta indikator status jaringan.

### D. Halaman Dashboard
- **File:** `src/pages/DashboardPage.tsx`
- **Data Asli:**
  - KPI akurasi model diambil langsung dari `GET /api/evaluation` (99.55% akurasi, 99.54% Macro F1).
  - Tabel *Recent Scans* diambil langsung dari SQLite melalui `GET /api/history` (menampilkan verdict nyata, probabilitas asli, dan waktu pemindaian).
  - Quick scanner input langsung mengarahkan pengguna ke hasil pemindaian riil.

### E. Halaman URL Scanner & Live Inference
- **File:** `src/pages/ScannerPage.tsx`
- **Alur Kerja Pemindaian:**
  1. Pengguna memasukkan URL target (didukung tombol sampel teruji seperti Google, Wikipedia, dan Phishing pattern).
  2. Frontend mengirimkan payload mentah `{ url: "..." }` ke `POST /api/scan`.
  3. Backend mengekstrak 16 fitur leksikal secara statis tanpa melakukan network request ke target (*Zero-Network Quarantine*).
  4. Model Random Forest memprediksi probabilitas phishing vs legitimate.
  5. Frontend merender:
     - Verdict: `PHISHING_DETECTED` (Merah) atau `LEGITIMATE` (Hijau).
     - Risk Level: `LOW`, `MEDIUM`, atau `HIGH`.
     - Confidence meter dan distribusi probabilitas persentase.
     - Breakdown 16 fitur leksikal URL secara mendalam beserta nilai aslinya.
     - Rekomendasi mitigasi keamanan siber (SOC playbook).

### F. Halaman Detail Pemindaian (Scan Detail)
- **File:** `src/pages/ScanDetailPage.tsx`
- **Fitur:** Mengambil data spesifik berdasarkan UUID dari `GET /api/history/{id}`. Menampilkan rekap pemindaian lampau lengkap dengan 16 fitur, latency eksekusi dalam milidetik, waktu scan, dan tombol ekspor JSON.

### G. Halaman Riwayat Pemindaian (Scan History)
- **File:** `src/pages/HistoryPage.tsx`
- **Fitur:**
  - Membaca seluruh histori pemindaian dari database SQLite `backend/history.db`.
  - Filter interaktif berdasarkan status verdict (`ALL`, `LEGITIMATE`, `PHISHING_DETECTED`).
  - Pencarian fleksibel berdasarkan URL atau domain.
  - Paginasi rapi (10 entri per halaman).
  - Fitur ekspor CSV berbasis data asli dari database.

### H. Halaman Model Evaluation & Benchmarks
- **File:** `src/pages/EvaluationPage.tsx`
- **Fitur:**
  - Mengambil metrik resmi evaluasi model v3.0 dari `GET /api/evaluation`.
  - KPI Utama: Akurasi (99.55%), Presisi Phishing (99.64%), Recall Phishing (99.31%), Macro F1 (99.54%).
  - Confusion Matrix Asli: TP = 19,966 | FP = 72 | FN = 138 | TN = 26,898.
  - Grafik Batang Interaktif Recharts: Gini Feature Importance dari Top 10 fitur leksikal deterministik.

### I. Halaman About System
- **File:** `src/pages/AboutPage.tsx`
- **Fitur:** Mengambil parameter dan arsitektur model secara dinamis dari `GET /api/model-info` (100 estimators, max depth 25, Gini criterion, 16 lexical features, zero-leakage pipeline).

---

## 4. VERIFIKASI PENGUJIAN END-TO-END

Pengujian integrasi langsung dari frontend ke backend telah diverifikasi:

| No | Target URL | Expected Verdict | Actual API Prediction | Probability Legitimate | Risk Level | Status |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | `https://www.google.com` | LEGITIMATE | `LEGITIMATE` | 99.76% | LOW | PASSED |
| 2 | `https://www.wikipedia.org` | LEGITIMATE | `LEGITIMATE` | 99.85% | LOW | PASSED |
| 3 | `http://example.com` | LEGITIMATE | `LEGITIMATE` | 99.84% | LOW | PASSED |
| 4 | `http://secure-login-account-update.example.xyz/auth/verify?token=9283` | PHISHING | `PHISHING_DETECTED` | 0.00% | HIGH | PASSED |

---

## 5. KESIMPULAN & TAHAP BERIKUTNYA

Frontend dan Backend PhishingGuard telah terintegrasi secara utuh dan siap digunakan untuk pengujian, demonstrasi live, serta penyusunan laporan akademis UAS Keamanan Informasi.
