# LAPORAN AUDIT VALIDITAS MODEL FINAL (TAHAP 2.9)
**Proyek:** PhishingGuard — UAS Keamanan Informasi Universitas Siliwangi  
**Model Dievaluasi:** `models/final/random_forest_model.joblib` (Final Consistent Model v3.0)  
**Tanggal Audit:** 19 November 2026  
**Auditor:** Senior Software Architect & ML Engineer (Antigravity AI)

---

## 1. Status Kelengkapan Artefak Model

Pemeriksaan integritas fisik file, ukuran, dan deserialisasi objek menghasilkan data berikut:

| Nama File Artefak | Ukuran File | Status Keberadaan | Status Keterbacaan | Keterangan |
| :--- | :---: | :---: | :---: | :--- |
| `models/final/random_forest_model.joblib` | 5,702,547 bytes (~5.7 MB) | **Ada** | **Valid / Readable** | Serialized Scikit-learn RandomForestClassifier |
| `models/final/feature_schema.json` | 641 bytes | **Ada** | **Valid / Readable** | Skema 16 fitur deterministik & metadata target |
| `models/final/evaluation_metrics.json` | 7,498 bytes | **Ada** | **Valid / Readable** | Laporan metrik testing & verifikasi URL |
| `models/final/training_metadata.json` | 366 bytes | **Ada** | **Valid / Readable** | Catatan runtime, environment & hyperparameter |
| `src/feature_extractor.py` | 4,215 bytes | **Ada** | **Valid / Readable** | Modul ekstraksi 16 fitur deterministik |
| `train_model_final.py` | 14,286 bytes | **Ada** | **Valid / Readable** | Skrip pelatihan ulang mandiri & reproducible |
| `models/final/confusion_matrix.png` | 109,345 bytes | **Ada** | **Valid / Readable** | Visualisasi matriks uji stratified split |
| `models/final/feature_importance.png` | 183,967 bytes | **Ada** | **Valid / Readable** | Barplot bobot Gini Impurity 16 fitur |

> **Kesimpulan Artefak:** Seluruh artefak tersedia 100%, tidak ada file rusak (*corrupted*), dan model lama di `models/` maupun `models/clean/` tetap utuh tanpa tertimpa.

---

## 2. Hasil Audit 16 Fitur & Konsistensi Ekstraksi

Pemeriksaan komparatif dilakukan antara skema JSON, atribut model Scikit-learn (`model.feature_names_in_`), dan fungsi `extract_features()` pada `src/feature_extractor.py`:

```python
[
    'URLLength', 'DomainLength', 'IsDomainIP', 'TLDLength', 'NoOfSubDomain',
    'NoOfLettersInURL', 'LetterRatioInURL', 'NoOfDegitsInURL', 'DegitRatioInURL',
    'NoOfEqualsInURL', 'NoOfQMarkInURL', 'NoOfAmpersandInURL',
    'NoOfOtherSpecialCharsInURL', 'SpacialCharRatioInURL', 'IsHTTPS',
    'CharContinuationRate'
]
```

- **Jumlah Fitur:** Tepat **16 Fitur**.
- **Urutan dan Penamaan:** 100% Cocok identik antara `model.feature_names_in_`, `feature_schema.json`, dan `FEATURE_NAMES`.
- **Independensi Jaringan (*Zero-Network Quarantine*):** Seluruh 16 fitur diekstrak secara murni melalui parsing string leksikal statis (`urllib.parse` & regex). **Tidak memerlukan koneksi internet, DNS lookup, WHOIS, maupun database whitelist eksternal.**
- **Penanganan Input:** URL kosong (`""`) dan karakter non-URL acak ditolak secara aman oleh validasi awal sebelum inferensi untuk mencegah kalkulasi yang tidak bermakna.

---

## 3. Hasil Verifikasi Domain-Group Split (Generalisasi Domain Baru)

Pemeriksaan langsung terhadap proses `GroupShuffleSplit` pada `train_model_final.py`:

- **Kolom Pengelompokan:** Kolom `Domain` dari dataset PhiUSIIL setelah deduplikasi (235.370 URL unik).
- **Jumlah Domain Total:** **220.086 domain unik**.
- **Domain di Training Set:** **176.068 domain** (80.00%).
- **Domain di Testing Set:** **44.018 domain** (20.00%).
- **Jumlah Domain Overlap:** **0 DOMAIN (NIL / ZERO OVERLAP)**.
- **Hasil Pengujian Domain Baru:**
  - **Akurasi Pengujian Domain Baru:** **99.53%**
  - **Macro F1-Score:** **99.52%**
  - **Confusion Matrix Testing:** $TP = 19.600 \quad|\quad FN = 109 \quad|\quad FP = 109 \quad|\quad TN = 26.814$
- **Analisis Kritis:** Verifikasi ini membuktikan bahwa model tidak menghafal nama domain yang ada di data latih, melainkan mengenali pola rasio angka, karakter simbol, dan kedalaman subdomain secara struktural.

---

## 4. Hasil Uji Prediksi 5 Target URL

Hasil pemanggilan inferensi langsung terhadap file `models/final/random_forest_model.joblib`:

| Target URL | Prediksi Model | Prob. Legit | Prob. Phish | Latensi Inferensi | Analisis Teknis |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `https://www.google.com` | **LEGITIMATE** | **99.76%** | 0.24% | 559.53 ms | Struktur domain legal pendek terverifikasi aman |
| `https://www.wikipedia.org` | **LEGITIMATE** | **99.85%** | 0.15% | 1,868.37 ms | Struktur apex domain kredibel terverifikasi aman |
| `https://example.com` | **PHISHING_DETECTED** | 0.00% | **100.00%** | 653.21 ms | *False Alert:* Domain netral pendek tanpa path/query |
| `http://192.168.1.1/login` | **PHISHING_DETECTED** | 0.00% | **100.00%** | 1,880.06 ms | `IsDomainIP=1`, tanpa TLS HTTPS, endpoint `/login` |
| `https://secure-login-account-update.example.xyz` | **PHISHING_DETECTED** | 42.00% | **58.00%** | 1,227.31 ms | Panjang domain (39), TLD `.xyz`, multi-hyphen |

---

## 5. Hasil Pengujian Ketahanan Input (Robustness Test)

| Skenario Uji | Status Sistem | Respons / Hasil |
| :--- | :---: | :--- |
| **URL Kosong (`""`)** | **REJECTED** | Ditolak dengan pesan: *"Input tidak valid: URL kosong atau format tidak memiliki domain/host yang valid."* |
| **URL Whitespace (`"   "`)** | **REJECTED** | Ditolak dengan pesan validasi input |
| **String Acak Non-URL (`"not-a-valid-url"`)** | **REJECTED** | Ditolak (tidak memiliki format titik/domain) |
| **URL Tanpa Skema (`"google.com"`)** | **PROCESSED** | Berhasil diekstrak (fallback otomatis menambahkan `http://` untuk parsing netloc) |
| **URL dengan Port (`localhost:8080`)** | **REJECTED** | Port internal tanpa dot domain ditolak oleh filter sanitasi |
| **URL dengan Query & Fragment** | **PROCESSED** | Berhasil diekstrak tanpa crash |
| **URL Subdomain Panjang (>15 tingkat)** | **PROCESSED** | Berhasil diekstrak, `NoOfSubDomain` terhitung akurat |
| **URL Simbol Khusus & Auth Token** | **PROCESSED** | Karakter `@`, `:`, `?`, `&` terhitung dengan benar tanpa crash |

---

## 6. Keterbatasan Model & Catatan Akademis Penting

Berdasarkan pengujian empiris objektif:
1. **Bias Dominasi Fitur `IsHTTPS` (39.30% Gini Importance):**
   Pada dataset pelatihan PhiUSIIL, hampir seluruh link legitimate menggunakan HTTPS. Akibatnya, URL yang menggunakan protokol HTTP polos secara otomatis memiliki probabilitas phishing yang sangat tinggi.
2. **Keterbatasan Analisis Leksikal Statis Murni:**
   - Deteksi berbasis leksikal statis tidak memeriksa status sertifikat SSL asli, usia domain (WHOIS), reputasi IP, maupun konten halaman web.
   - Domain netral yang sangat pendek seperti `https://example.com` dapat terklasifikasi sebagai phishing karena karakteristiknya berbeda dengan rata-rata domain legitimate pada dataset yang memiliki variasi token lebih kaya.
3. **Pernyataan Probabilitas:**
   Hasil klasifikasi adalah **estimasi probabilitas pohon keputusan Machine Learning**, bukan vonis mutlak keamanan siber dunia nyata.

---

## 7. Kesimpulan Kesiapan Integrasi API

- **Status Validitas:** **TERVERIFIKASI & MEMENUHI STANDAR AKADEMIK UAS**.
- **Model Final:** `models/final/random_forest_model.joblib` bebas dari data leakage `URLSimilarityIndex`, memiliki konsistensi ekstraktor fitur 100%, dan terbukti tidak crash pada berbagai variasi input.
- **Rekomendasi Tahap Selanjutnya:** Model siap dihubungkan ke service REST API (FastAPI / Flask) untuk melayani antarmuka PhishingGuard Frontend.
