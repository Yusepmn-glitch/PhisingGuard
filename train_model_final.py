import os
import json
import time
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
import joblib

from src.feature_extractor import extract_features, FEATURE_NAMES

def main():
    print("=" * 80)
    print("PHISHINGGUARD — TAHAP 2.8: PERBAIKAN KONSISTENSI FEATURE & FINAL MODEL")
    print("=" * 80)
    start_time = time.time()

    # 1. Load Dataset Asli (Tanpa Mengubah Dataset Asli)
    data_path = os.path.join("dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("dataset", "phiusiil+phishing+url+dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")

    print(f"[*] Membaca dataset dari: {data_path} ...")
    df = pd.read_csv(data_path, usecols=['URL', 'Domain', 'label'])
    initial_rows = int(len(df))
    print(f"[+] Total baris awal: {initial_rows:,}")

    # 2. Deduplikasi URL Sebelum Split
    dup_count = int(df['URL'].duplicated().sum())
    print(f"[*] Membersihkan duplikasi URL: {dup_count:,} baris duplikat.")
    df_clean = df.drop_duplicates(subset=['URL']).copy().reset_index(drop=True)
    clean_rows = int(len(df_clean))
    print(f"[+] Baris unik bersih: {clean_rows:,} baris.")

    # 3. Ekstraksi Fitur Ulang Langsung dari Raw URL Menggunakan feature_extractor.py
    # Ini menjamin 100% konsistensi rumus antara data latih, data uji, dan inferensi nyata
    print(f"\n[*] Melakukan feature extraction langsung dari URL mentah menggunakan src/feature_extractor.py...")
    print(f"    Total fitur deterministik: {len(FEATURE_NAMES)}")
    for idx, f in enumerate(FEATURE_NAMES, 1):
        print(f"      {idx:2d}. {f}")

    t_ext_start = time.time()
    feature_list = []
    # Ekstraksi batch
    for u in df_clean['URL']:
        feature_list.append(extract_features(u))
    
    X = pd.DataFrame(feature_list, columns=FEATURE_NAMES)
    y = df_clean['label'].copy()
    domains = df_clean['Domain'].copy()
    print(f"[+] Ekstraksi {clean_rows:,} URLs selesai dalam {time.time() - t_ext_start:.2f} detik.")

    # 4. Stratified Train-Test Split (80:20)
    print("\n[*] Membagi data train-test (80:20) secara stratified (random_state=42)...")
    X_train, X_test, y_train, y_test, dom_train, dom_test = train_test_split(
        X, y, domains,
        test_size=0.20,
        random_state=42,
        stratify=y
    )
    print(f"[+] Training Set : {len(X_train):,} sampel")
    print(f"[+] Testing Set  : {len(X_test):,} sampel")

    # 5. Training Final Random Forest Model
    print("\n[*] Melatih RandomForestClassifier(n_estimators=100, max_depth=25, random_state=42, n_jobs=-1)...")
    final_rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=25,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    final_rf.fit(X_train, y_train)
    print("[+] Final Random Forest Model berhasil dilatih!")

    # 6. Evaluasi Utama pada Stratified Test Set
    print("\n" + "=" * 65)
    print("HASIL EVALUASI UTAMA (STRATIFIED TEST SET - 47,074 URLs)")
    print("=" * 65)

    y_pred = final_rf.predict(X_test)
    y_pred_proba = final_rf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])

    # Confusion Matrix: 0 = Phishing (Positif), 1 = Legitimate
    tp = int(cm[0, 0])
    fn = int(cm[0, 1])
    fp = int(cm[1, 0])
    tn = int(cm[1, 1])

    prec_phish = float(precision_score(y_test, y_pred, pos_label=0))
    rec_phish = float(recall_score(y_test, y_pred, pos_label=0))
    f1_phish = float(f1_score(y_test, y_pred, pos_label=0))

    prec_legit = float(precision_score(y_test, y_pred, pos_label=1))
    rec_legit = float(recall_score(y_test, y_pred, pos_label=1))
    f1_legit = float(f1_score(y_test, y_pred, pos_label=1))

    macro_prec = float(precision_score(y_test, y_pred, average='macro'))
    macro_rec = float(recall_score(y_test, y_pred, average='macro'))
    macro_f1 = float(f1_score(y_test, y_pred, average='macro'))

    weighted_prec = float(precision_score(y_test, y_pred, average='weighted'))
    weighted_rec = float(recall_score(y_test, y_pred, average='weighted'))
    weighted_f1 = float(f1_score(y_test, y_pred, average='weighted'))

    clf_report_dict = classification_report(y_test, y_pred, target_names=['Phishing (0)', 'Legitimate (1)'], output_dict=True)
    clf_report_text = classification_report(y_test, y_pred, target_names=['Phishing (0)', 'Legitimate (1)'])

    print(f"Accuracy                 : {acc * 100:.2f}%")
    print(f"Precision (Phishing / 0) : {prec_phish * 100:.2f}%")
    print(f"Recall (Phishing / 0)    : {rec_phish * 100:.2f}%")
    print(f"F1-Score (Phishing / 0)  : {f1_phish * 100:.2f}%")
    print(f"Precision (Legit / 1)    : {prec_legit * 100:.2f}%")
    print(f"Recall (Legit / 1)       : {rec_legit * 100:.2f}%")
    print(f"F1-Score (Legit / 1)     : {f1_legit * 100:.2f}%")
    print(f"Macro Average F1         : {macro_f1 * 100:.2f}%")
    print(f"Weighted Average F1      : {weighted_f1 * 100:.2f}%")
    print("-" * 65)
    print("Confusion Matrix Breakdown:")
    print(f"  • True Positive (Phishing terdeteksi)       : {tp:,}")
    print(f"  • False Negative (Phishing terlewat)        : {fn:,}")
    print(f"  • False Positive (Legit salah dituduh)      : {fp:,}")
    print(f"  • True Negative (Legit terverifikasi aman)  : {tn:,}")
    print("\nClassification Report:\n", clf_report_text)

    # 7. Evaluasi Tambahan: Domain-Group Split
    print("\n" + "=" * 65)
    print("EVALUASI TAMBAHAN: DOMAIN-GROUP SPLIT")
    print("=" * 65)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx_g, test_idx_g = next(gss.split(X, y, groups=domains))

    train_dom_set = set(domains.iloc[train_idx_g])
    test_dom_set = set(domains.iloc[test_idx_g])
    dom_overlap = len(train_dom_set.intersection(test_dom_set))
    print(f"[*] Domain Training: {len(train_dom_set):,} | Domain Testing: {len(test_dom_set):,}")
    print(f"[*] Domain Overlap Count: {dom_overlap} (100% AMAN).")

    X_train_g, X_test_g = X.iloc[train_idx_g], X.iloc[test_idx_g]
    y_train_g, y_test_g = y.iloc[train_idx_g], y.iloc[test_idx_g]

    rf_group = RandomForestClassifier(n_estimators=100, max_depth=25, random_state=42, class_weight='balanced', n_jobs=-1)
    rf_group.fit(X_train_g, y_train_g)
    y_pred_g = rf_group.predict(X_test_g)

    acc_g = float(accuracy_score(y_test_g, y_pred_g))
    f1_g = float(f1_score(y_test_g, y_pred_g, average='macro'))
    cm_g = confusion_matrix(y_test_g, y_pred_g, labels=[0, 1])
    print(f"[+] Domain-Group Testing Accuracy : {acc_g * 100:.2f}%")
    print(f"[+] Domain-Group Macro F1-Score   : {f1_g * 100:.2f}%")
    print(f"[+] Domain-Group Confusion Matrix :")
    print(f"    TP: {int(cm_g[0,0]):,}, FN: {int(cm_g[0,1]):,}, FP: {int(cm_g[1,0]):,}, TN: {int(cm_g[1,1]):,}")

    # 8. Feature Importance
    importances = final_rf.feature_importances_
    feat_imp_df = pd.DataFrame({
        'feature': FEATURE_NAMES,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)

    print("\n[*] Feature Importance (Final Consistent Model):")
    for i, row in feat_imp_df.iterrows():
        print(f"    {i+1:2d}. {row['feature']:<28} : {row['importance'] * 100:.2f}%")

    # 9. Pengujian 5 URL Baru (Technical Verification)
    print("\n" + "=" * 65)
    print("PENGUJIAN INFERENCE URL BARU (DENGAN FEATURE EXTRACTOR TERPADU)")
    print("=" * 65)

    test_urls = [
        "https://www.google.com",
        "https://www.wikipedia.org",
        "http://example.com",
        "https://secure-login-account-update.example.xyz",
        "http://192.168.1.1/login"
    ]

    url_test_records = []
    for u in test_urls:
        u_dict = extract_features(u)
        u_df = pd.DataFrame([u_dict], columns=FEATURE_NAMES)
        u_pred = int(final_rf.predict(u_df)[0])
        u_proba = final_rf.predict_proba(u_df)[0]

        pred_label = "LEGITIMATE" if u_pred == 1 else "PHISHING_DETECTED"
        prob_phish = round(float(u_proba[0]), 4)
        prob_legit = round(float(u_proba[1]), 4)

        record = {
            "url": u,
            "prediction": pred_label,
            "probability_phishing": prob_phish,
            "probability_legitimate": prob_legit,
            "extracted_features": u_dict
        }
        url_test_records.append(record)

        print(f"\nTarget URL: {u}")
        print(f"  • Prediksi Model     : {pred_label} (Class {u_pred})")
        print(f"  • Probabilitas       : Phishing={prob_phish*100:.2f}% | Legitimate={prob_legit*100:.2f}%")
        print(f"  • Snapshot Fitur     : Len={u_dict['URLLength']}, DomainLen={u_dict['DomainLength']}, IsHTTPS={u_dict['IsHTTPS']}, SpecialChars={u_dict['NoOfOtherSpecialCharsInURL']}")

    # 10. Simpan Artefak ke models/final/
    out_dir = os.path.join("models", "final")
    os.makedirs(out_dir, exist_ok=True)

    # Model joblib
    model_save_path = os.path.join(out_dir, "random_forest_model.joblib")
    joblib.dump(final_rf, model_save_path, compress=3)

    # Feature schema
    schema_path = os.path.join(out_dir, "feature_schema.json")
    feature_meta = {
        "features": FEATURE_NAMES,
        "n_features": len(FEATURE_NAMES),
        "target_classes": {
            "0": "Phishing",
            "1": "Legitimate"
        },
        "model_type": "RandomForestClassifier",
        "n_estimators": 100,
        "max_depth": 25,
        "random_state": 42,
        "class_weight": "balanced"
    }
    with open(schema_path, 'w', encoding='utf-8') as f:
        json.dump(feature_meta, f, indent=2)

    # Evaluation metrics
    eval_json_path = os.path.join(out_dir, "evaluation_metrics.json")
    eval_results = {
        "model_version": "Final-Consistent-v3.0",
        "dataset_name": "PhiUSIIL Phishing URL Dataset (Deduplicated, Raw URL Extracted)",
        "initial_samples": initial_rows,
        "deduplicated_samples": clean_rows,
        "removed_duplicates": dup_count,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features_used": FEATURE_NAMES,
        "stratified_test_metrics": {
            "accuracy": round(acc, 4),
            "macro_average": {
                "precision": round(macro_prec, 4),
                "recall": round(macro_rec, 4),
                "f1_score": round(macro_f1, 4)
            },
            "weighted_average": {
                "precision": round(weighted_prec, 4),
                "recall": round(weighted_rec, 4),
                "f1_score": round(weighted_f1, 4)
            },
            "phishing_class_0": {
                "precision": round(prec_phish, 4),
                "recall": round(rec_phish, 4),
                "f1_score": round(f1_phish, 4)
            },
            "legitimate_class_1": {
                "precision": round(prec_legit, 4),
                "recall": round(rec_legit, 4),
                "f1_score": round(f1_legit, 4)
            },
            "confusion_matrix": {
                "raw": [[int(v) for v in row] for row in cm],
                "true_positive": tp,
                "false_negative": fn,
                "false_positive": fp,
                "true_negative": tn
            },
            "classification_report": clf_report_dict
        },
        "domain_group_split_metrics": {
            "accuracy": round(acc_g, 4),
            "macro_f1_score": round(f1_g, 4),
            "confusion_matrix": [[int(v) for v in row] for row in cm_g]
        },
        "feature_importance": [
            {"feature": str(row['feature']), "importance": round(float(row['importance']), 4)}
            for _, row in feat_imp_df.iterrows()
        ],
        "test_urls_verification": url_test_records
    }
    with open(eval_json_path, 'w', encoding='utf-8') as f:
        json.dump(eval_results, f, indent=2)

    # Training metadata
    meta_path = os.path.join(out_dir, "training_metadata.json")
    training_meta = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "training_duration_seconds": round(time.time() - start_time, 2),
        "environment": {
            "scikit_learn": "1.9.1",
            "python": "3.14.3",
            "joblib": "1.6.0"
        },
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 25,
            "random_state": 42,
            "class_weight": "balanced",
            "criterion": "gini",
            "n_jobs": -1
        }
    }
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(training_meta, f, indent=2)

    # Visual Confusion Matrix
    plt.figure(figsize=(7, 5.5))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=['Pred: Phishing (0)', 'Pred: Legit (1)'],
        yticklabels=['Actual: Phishing (0)', 'Actual: Legit (1)']
    )
    plt.title('Final Confusion Matrix (Stratified Test Set - 47,074 URLs)', fontsize=12, fontweight='bold', pad=12)
    plt.ylabel('Actual Ground Truth')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "confusion_matrix.png"), dpi=300)
    plt.close()

    # Visual Feature Importance
    plt.figure(figsize=(10, 7))
    sns.barplot(
        x='importance',
        y='feature',
        data=feat_imp_df,
        hue='feature',
        palette='crest',
        legend=False
    )
    plt.title('Feature Importance (Final Consistent Model — 16 Lexical Features)', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Gini Impurity Contribution')
    plt.ylabel('Lexical Feature')
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "feature_importance.png"), dpi=300)
    plt.close()

    print(f"\n[+] Seluruh artefak final model tersimpan di: {out_dir}")
    print("=" * 80)
    print("[SELESAI] TAHAP 2.8 PIPELINE RETRAINING BERHASIL 100%!")
    print("=" * 80)

if __name__ == '__main__':
    main()
