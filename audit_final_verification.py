import os
import json
import joblib
import pandas as pd
import numpy as np
from src.feature_extractor import extract_features, extract_features_vector, FEATURE_NAMES
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, confusion_matrix

print("="*75)
print("PHISHINGGUARD — TAHAP 2.7: FINAL VERIFICATION CLEAN MODEL")
print("="*75)

# -------------------------------------------------------------
# 1. FEATURE EXTRACTION VALIDATION
# -------------------------------------------------------------
print("\n[1] FEATURE EXTRACTION VALIDATION PADA SAMPEL DATASET")
df = pd.read_csv('dataset/PhiUSIIL_Phishing_URL_Dataset.csv', nrows=5)

for i in range(3):
    row = df.iloc[i]
    url = row['URL']
    extracted = extract_features(url)
    print(f"\n--- Sampel {i+1}: {url} ---")
    differences = []
    for f in FEATURE_NAMES:
        ds_val = row[f]
        ex_val = extracted[f]
        # toleransi float pembulatan
        if isinstance(ds_val, float) or isinstance(ex_val, float):
            match = np.isclose(float(ds_val), float(ex_val), atol=1e-2)
        else:
            match = (ds_val == ex_val)
        if not match:
            differences.append((f, ds_val, ex_val))
    if not differences:
        print("  => 100% Cocok Sempurna pada seluruh 19 fitur!")
    else:
        print(f"  => Ada perbedaan pada {len(differences)} fitur:")
        for f, ds_val, ex_val in differences:
            print(f"     * {f:25}: Dataset={ds_val} vs Extracted={ex_val}")

# Uji Edge Cases: Empty, malformed, IP address, Port, Query, No HTTPS
edge_cases = [
    ("", "Empty string"),
    ("malformed://%%", "Malformed URL"),
    ("http://192.168.1.1:8080/admin?user=test#hash", "IP with Port & Query & Hash"),
    ("http://example.com", "Plain HTTP without subdomains"),
    ("https://a.b.c.d.sub.domain.co.id/path/to/page?id=1&name=test=2", "Complex Subdomains and Query")
]

print("\n--- Uji Edge Cases pada Feature Extractor ---")
for u, desc in edge_cases:
    try:
        vec = extract_features_vector(u)
        assert len(vec) == 19
        assert not any(np.isnan(vec))
        assert not any(np.isinf(vec))
        print(f"  [OK] {desc} => 19 fitur numerik valid (no NaN/Inf).")
    except Exception as e:
        print(f"  [FAIL] {desc} => Exception: {e}")

# -------------------------------------------------------------
# 2. DOMAIN-GROUP OVERLAP VALIDATION
# -------------------------------------------------------------
print("\n[2] DOMAIN-GROUP OVERLAP VALIDATION")
df_full = pd.read_csv('dataset/PhiUSIIL_Phishing_URL_Dataset.csv')
df_clean = df_full.drop_duplicates(subset=['URL']).copy().reset_index(drop=True)

gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
train_idx, test_idx = next(gss.split(df_clean, df_clean['label'], groups=df_clean['Domain']))

train_domains = set(df_clean.loc[train_idx, 'Domain'])
test_domains = set(df_clean.loc[test_idx, 'Domain'])
overlap = train_domains.intersection(test_domains)

print(f"  • Unique Domains Total        : {df_clean['Domain'].nunique():,}")
print(f"  • Unique Domains Training Set : {len(train_domains):,}")
print(f"  • Unique Domains Testing Set  : {len(test_domains):,}")
print(f"  • Domain Overlap Count        : {len(overlap)} (Target: 0)")
if len(overlap) == 0:
    print("  => VERIFIKASI BERHASIL: Tidak ada kebocoran domain antara train dan test.")
else:
    print(f"  => PERINGATAN: Ada overlap {len(overlap)} domain!")

# -------------------------------------------------------------
# 3. MODEL VALIDATION & LOADING FROM models/clean/
# -------------------------------------------------------------
print("\n[3] MODEL VALIDATION & LOADING DARI models/clean/")
clean_model_path = os.path.join("models", "clean", "random_forest_model.joblib")
clean_schema_path = os.path.join("models", "clean", "feature_schema.json")
clean_eval_path = os.path.join("models", "clean", "evaluation_metrics.json")

model = joblib.load(clean_model_path)
with open(clean_schema_path) as f:
    schema = json.load(f)
with open(clean_eval_path) as f:
    eval_metrics = json.load(f)

print(f"  • Model Type Loaded           : {type(model).__name__}")
print(f"  • Number of Estimators        : {model.n_estimators}")
print(f"  • Number of Features Expected : {model.n_features_in_} (Schema: {schema['n_features']})")
print(f"  • Model Feature Names         : {list(model.feature_names_in_)}")
print(f"  • Stratified Test Accuracy    : {eval_metrics['stratified_test_metrics']['accuracy'] * 100:.2f}%")
print(f"  • Phishing F1-Score           : {eval_metrics['stratified_test_metrics']['phishing_class_0']['f1_score'] * 100:.2f}%")
print(f"  • Legit F1-Score              : {eval_metrics['stratified_test_metrics']['legitimate_class_1']['f1_score'] * 100:.2f}%")

# -------------------------------------------------------------
# 4. INFERENCE TEST ON NEW MOCK URLs (NO NETWORK CALLS)
# -------------------------------------------------------------
print("\n[4] INFERENCE TEST ON 5 TARGET URLs (ZERO-NETWORK QUARANTINE)")
test_urls = [
    "https://www.google.com",
    "https://www.wikipedia.org",
    "http://example.com",
    "https://secure-login-account-update.example.xyz",
    "http://192.168.1.1/login"
]

inference_results = []
for u in test_urls:
    feat_dict = extract_features(u)
    # Gunakan DataFrame dengan nama kolom persis sama agar kompatibel tanpa warning
    feat_df = pd.DataFrame([feat_dict], columns=FEATURE_NAMES)
    pred_class = int(model.predict(feat_df)[0])
    pred_proba = model.predict_proba(feat_df)[0]
    
    # 0 = Phishing, 1 = Legitimate
    class_label = "LEGITIMATE" if pred_class == 1 else "PHISHING_DETECTED"
    prob_phish = float(pred_proba[0])
    prob_legit = float(pred_proba[1])

    print(f"\n=======================================================")
    print(f"URL: {u}")
    print(f"Extracted Features Summary:")
    print(f"  - Length: {feat_dict['URLLength']} | DomainLen: {feat_dict['DomainLength']} | IsHTTPS: {feat_dict['IsHTTPS']} | IsIP: {feat_dict['IsDomainIP']}")
    print(f"  - Subdomains: {feat_dict['NoOfSubDomain']} | SpecialChars: {feat_dict['NoOfOtherSpecialCharsInURL']} | Digits: {feat_dict['NoOfDegitsInURL']}")
    print(f"Prediksi Model       : {class_label} (Class {pred_class})")
    print(f"Probabilitas Model   : Phishing: {prob_phish*100:.2f}% | Legitimate: {prob_legit*100:.2f}%")

print("\n" + "="*75)
print("[STATUS] AUDIT FINAL TAHAP 2.7 SELESAI!")
print("="*75)
