# PhishingGuard: Sistem Deteksi & Mitigasi URL Phishing Berbasis Machine Learning

PhishingGuard adalah platform deteksi URL phishing secara statis (*Zero-Network Quarantine*) yang dikembangkan untuk tugas **UAS Keamanan Informasi (Topik 1: Defensive AI)**. Aplikasi ini mengintegrasikan model Machine Learning **Random Forest** dengan antarmuka web modern (*Cybersecurity Sentinel Precision UI*).

---

## 🛡️ Fitur Utama

- **Deteksi Phishing Tanpa Akses Jaringan (*Zero-Network Quarantine*):** Menganalisis URL mentah secara murni leksikal tanpa mengunjungi atau melakukan crawling ke server tujuan, menjamin keamanan perangkat analis.
- **Ensemble Random Forest v3.0 (Zero-Leakage):** Dilatih pada 235.795 sampel URL dari dataset PhiUSIIL menggunakan 16 fitur leksikal deterministik dan pembagian *GroupShuffleSplit* berdasarkan domain untuk mencegah domain leakage.
- **Akurasi Tinggi & Teruji:**
  - **Akurasi:** 99.55%
  - **Macro F1-Score:** 99.54%
  - **Precision (Phishing):** 99.64%
  - **Recall (Phishing):** 99.31%
- **Interactive Sentinel Dashboard & Live URL Scanner:**
  - Analisis probabilitas ancaman (Legitimate vs Phishing).
  - Klasifikasi tingkat risiko (*LOW*, *MEDIUM*, *HIGH*).
  - Rekomendasi mitigasi dan playbook SOC (*Security Operations Center*).
  - Breakdown mendalam dari 16 fitur leksikal URL.
- **Riwayat Pemindaian & Ekspor CSV:** Pencatatan otomatis log pemindaian berbasis SQLite dengan filter pencarian dan ekspor laporan.
- **Benchmark & Evaluasi Model Interaktif:** Menampilkan matriks konfusi (Confusion Matrix) dan visualisasi Gini Feature Importance interaktif.

---

## 🏛️ Arsitektur Teknologi

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Vite.
- **Backend:** Python FastAPI, Uvicorn, Pydantic, SQLite.
- **Machine Learning Engine:** Scikit-learn (`RandomForestClassifier`), Joblib, NumPy, Pandas.

---

## 📂 Struktur Repositori & Penjelasan File

```text
UASKI/
├── backend/                   # Backend REST API (FastAPI)
│   ├── main.py                # Entrypoint server FastAPI & konfigurasi CORS
│   ├── schemas.py             # Schema Pydantic untuk request & response
│   ├── requirements.txt       # Dependensi backend Python
│   └── services/
│       ├── model_service.py   # Loader model ML & verifikasi schema fitur
│       ├── prediction_service.py # Logika ekstraksi fitur & klasifikasi RF
│       └── db_service.py      # Penyimpanan log pemindaian ke SQLite
│
├── src/                       # Frontend Web Application (React + Vite)
│   ├── components/            # Komponen UI (Sidebar, Topbar, StatusBadge, dll.)
│   ├── pages/                 # Halaman (Dashboard, Scanner, History, Evaluation, About)
│   ├── services/              # Client API terpusat (api.ts & scanService.ts)
│   └── feature_extractor.py   # Modul ekstraksi 16 fitur leksikal deterministik
│
├── models/                    # Artefak Model Machine Learning
│   ├── final/                 # Model Final v3.0 yang digunakan di production
│   │   ├── random_forest_model.joblib # Bobot model terlatih (5.7 MB)
│   │   ├── feature_schema.json        # Schema 16 fitur leksikal
│   │   └── evaluation_metrics.json    # Metrik evaluasi resmi & Confusion Matrix
│   ├── clean/                 # Iterasi model clean v2.0 (arsip audit)
│   └── random_forest_model.joblib # Model iterasi awal v1.0 (arsip audit)
│
├── dataset/                   # Dataset PhiUSIIL (di-ignore dari git jika >50MB)
├── reports/                   # Laporan audit model, API, dan integrasi frontend
│
├── train_model_final.py       # Script training pipeline Model Final v3.0 (Zero-Leakage)
├── train_model_clean.py       # Script training iterasi clean model v2.0
├── train_model.py             # Script training baseline v1.0
├── run_audit_2_9.py           # Script verifikasi konsistensi model & leakage audit
├── audit_dataset.py           # Script audit distribusi dan kualitas dataset mentah
├── audit_validity.py          # Script audit validitas fitur PhiUSIIL
├── audit_final_verification.py# Script validasi domain-group split
├── test_api_endpoints.py      # Automated test script untuk endpoint backend
│
├── requirements.txt           # Dependensi Python level root (untuk deployment)
├── package.json               # Dependensi Node.js frontend
├── .env                       # Konfigurasi environment (VITE_API_BASE_URL)
└── README.md                  # Dokumentasi proyek
```

---

## 🚀 Panduan Menjalankan di Lingkungan Lokal

### 1. Prasyarat
- Python 3.10+
- Node.js 18+ dan npm

### 2. Menjalankan Backend (FastAPI)
```bash
# 1. Install dependensi Python
pip install -r requirements.txt

# 2. Jalankan server backend Uvicorn
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API akan aktif di `http://127.0.0.1:8000`. Dokumentasi OpenAPI Swagger dapat diakses di `http://127.0.0.1:8000/docs`.

### 3. Menjalankan Frontend (React + Vite)
Buka terminal baru:
```bash
# 1. Install dependensi Node.js
npm install

# 2. Jalankan Vite Development Server
npm run dev
```
Aplikasi web dapat dibuka di browser pada `http://localhost:5173`. Indikator status di Topbar akan menyala hijau: **"Engine Online (v3.0)"**.

---

## 🌐 Panduan Deployment

### Opsi Deployment Rekomendasi (Render.com)

1. **Deploy Backend (Web Service):**
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Salin URL backend yang dihasilkan (contoh: `https://phishingguard-api.onrender.com`).

2. **Deploy Frontend (Static Site / Vercel):**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
   - **Environment Variable:**  
     Tambahkan `VITE_API_BASE_URL` dengan nilai URL backend yang telah dibuat di langkah 1 (contoh: `https://phishingguard-api.onrender.com`).

---

## 🧪 Validasi & Pengujian

Untuk menjalankan pengujian otomatis terhadap endpoint backend dan inferensi model:
```bash
python test_api_endpoints.py
```

Untuk memverifikasi integritas model dan ekstraktor fitur:
```bash
python run_audit_2_9.py
```

---

## 👥 Tim Pengembang

Proyek ini disusun untuk pemenuhan tugas **UAS Keamanan Informasi**, Program Studi Informatika, Universitas Siliwangi.
