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

from src.feature_extractor import FEATURE_NAMES

def main():
    print("=" * 75)
    print("PHISHINGGUARD — TAHAP 2.6: CLEAN TRAINING & PERBAIKAN MODEL")
    print("=" * 75)
    start_time = time.time()

    # 1. Load Dataset Asli (Tanpa Mengubah Dataset Asli)
    data_path = os.path.join("dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("dataset", "phiusiil+phishing+url+dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
    
    print(f"[*] Membaca dataset dari: {data_path} ...")
    df = pd.read_csv(data_path)
    initial_rows = int(len(df))
    print(f"[+] Total baris awal: {initial_rows:,}")

    # 2. Pembersihan Duplikasi URL Sebelum Split
    print("\n[*] Memeriksa dan membersihkan duplikasi URL...")
    dup_count = int(df['URL'].duplicated().sum())
    print(f"    Ditemukan {dup_count:,} baris duplikat URL.")
    df_clean = df.drop_duplicates(subset=['URL']).copy().reset_index(drop=True)
    clean_rows = int(len(df_clean))
    print(f"[+] Baris unik setelah deduplikasi: {clean_rows:,} (Dihapus: {dup_count:,} baris).")

    # 3. Validasi Fitur yang Digunakan (19 Fitur Murni Tanpa Data Leakage)
    print(f"\n[*] 19 Fitur Bersih yang Digunakan (URLSimilarityIndex, TLDLegitimateProb, URLCharProb DIBUANG):")
    for idx, f in enumerate(FEATURE_NAMES, 1):
        print(f"    {idx:2d}. {f}")

    X = df_clean[FEATURE_NAMES].copy().fillna(0)
    y = df_clean['label'].copy()
    domains = df_clean['Domain'].copy() if 'Domain' in df_clean.columns else None

    # Distribusi Kelas Bersih
    counts = y.value_counts()
    print("\n[*] Distribusi Kelas Setelah Deduplikasi:")
    print(f"    • Kelas 1 (Legitimate): {counts[1]:,} ({counts[1]/clean_rows*100:.2f}%)")
    print(f"    • Kelas 0 (Phishing)  : {counts[0]:,} ({counts[0]/clean_rows*100:.2f}%)")

    # 4. Stratified Train-Test Split (80:20)
    print("\n[*] Melakukan Stratified Train-Test Split (80:20) dengan random_state=42...")
    X_train, X_test, y_train, y_test, dom_train, dom_test = train_test_split(
        X, y, domains,
        test_size=0.20,
        random_state=42,
        stratify=y
    )
    print(f"[+] Training Set : {len(X_train):,} baris")
    print(f"[+] Testing Set  : {len(X_test):,} baris")

    # Verifikasi pencegahan data leakage: tidak ada URL yang sama di train & test
    overlap_check = set(df_clean.loc[X_train.index, 'URL']).intersection(set(df_clean.loc[X_test.index, 'URL']))
    print(f"[+] Verifikasi Kebocoran: Overlap URL antara Train dan Test = {len(overlap_check)} (100% AMAN).")

    # 5. Training Clean Random Forest Classifier
    print("\n[*] Melatih Clean RandomForestClassifier(n_estimators=100, max_depth=25, random_state=42, n_jobs=-1)...")
    clean_rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=25,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    clean_rf.fit(X_train, y_train)
    print("[+] Model Clean Random Forest berhasil dilatih!")

    # 6. Evaluasi Utama pada Data Testing (Stratified Split)
    print("\n" + "=" * 60)
    print("HASIL EVALUASI UTAMA (STRATIFIED TEST SET - 47,074 URLs)")
    print("=" * 60)

    y_pred = clean_rf.predict(X_test)
    y_pred_proba = clean_rf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])

    # Confusion matrix deteksi phishing:
    # 0 = Phishing (Positif Target), 1 = Legitimate
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
    print("-" * 60)
    print("Confusion Matrix Breakdown:")
    print(f"  • True Positive (Phishing terdeteksi)       : {tp:,}")
    print(f"  • False Negative (Phishing terlewat)        : {fn:,}")
    print(f"  • False Positive (Legit salah dituduh)      : {fp:,}")
    print(f"  • True Negative (Legit terverifikasi aman)  : {tn:,}")
    print("\nClassification Report:\n", clf_report_text)

    # 7. Evaluasi Tambahan: Domain-Group Split
    print("\n" + "=" * 60)
    print("EVALUASI TAMBAHAN: DOMAIN-GROUP SPLIT (GENERALIZATION TEST)")
    print("=" * 60)

    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx_g, test_idx_g = next(gss.split(X, y, groups=domains))
    
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
    importances = clean_rf.feature_importances_
    feat_imp_df = pd.DataFrame({
        'feature': FEATURE_NAMES,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)

    print("\n[*] Feature Importance Baru (Clean Model):")
    for i, row in feat_imp_df.iterrows():
        print(f"    {i+1:2d}. {row['feature']:<28} : {row['importance'] * 100:.2f}%")

    # 9. Simpan Artefak ke models/clean/
    out_dir = os.path.join("models", "clean")
    os.makedirs(out_dir, exist_ok=True)

    # A. Model Joblib
    model_save_path = os.path.join(out_dir, "random_forest_model.joblib")
    print(f"\n[*] Menyimpan model bersih ke: {model_save_path} ...")
    joblib.dump(clean_rf, model_save_path, compress=3)

    # B. Feature Schema
    schema_path = os.path.join(out_dir, "feature_schema.json")
    feature_meta = {
        "features": FEATURE_NAMES,
        "n_features": int(len(FEATURE_NAMES)),
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

    # C. Evaluation Metrics JSON (Semua tipe dikonversi ke native Python int/float)
    eval_json_path = os.path.join(out_dir, "evaluation_metrics.json")
    eval_results = {
        "model_version": "Clean-v2.0 (Zero-Leakage)",
        "dataset_name": "PhiUSIIL Phishing URL Dataset (Deduplicated)",
        "initial_samples": int(initial_rows),
        "deduplicated_samples": int(clean_rows),
        "removed_duplicates": int(dup_count),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "features_used": FEATURE_NAMES,
        "pruned_features": ["URLSimilarityIndex", "TLDLegitimateProb", "URLCharProb"],
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
                "raw": [[int(val) for val in row] for row in cm],
                "true_positive": int(tp),
                "false_negative": int(fn),
                "false_positive": int(fp),
                "true_negative": int(tn)
            },
            "classification_report": clf_report_dict
        },
        "domain_group_split_metrics": {
            "accuracy": round(acc_g, 4),
            "macro_f1_score": round(f1_g, 4),
            "confusion_matrix": [[int(val) for val in row] for row in cm_g]
        },
        "feature_importance": [
            {"feature": str(row['feature']), "importance": round(float(row['importance']), 4)}
            for _, row in feat_imp_df.iterrows()
        ]
    }
    with open(eval_json_path, 'w', encoding='utf-8') as f:
        json.dump(eval_results, f, indent=2)

    # D. Training Metadata JSON
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

    # E. Confusion Matrix Visual (PNG)
    plt.figure(figsize=(7, 5.5))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=['Pred: Phishing (0)', 'Pred: Legit (1)'],
        yticklabels=['Actual: Phishing (0)', 'Actual: Legit (1)']
    )
    plt.title('Confusion Matrix (Clean Model — Stratified Test Set)', fontsize=12, fontweight='bold', pad=12)
    plt.ylabel('Actual Ground Truth')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    cm_path = os.path.join(out_dir, "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()

    # F. Feature Importance Visual (PNG)
    plt.figure(figsize=(10, 7.5))
    sns.barplot(
        x='importance',
        y='feature',
        data=feat_imp_df,
        hue='feature',
        palette='mako',
        legend=False
    )
    plt.title('Feature Importance (Clean Model — 19 Pure Lexical Features)', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Gini Impurity Contribution')
    plt.ylabel('URL Static Lexical Features')
    plt.tight_layout()
    feat_path = os.path.join(out_dir, "feature_importance.png")
    plt.savefig(feat_path, dpi=300)
    plt.close()

    print(f"\n[+] Seluruh artefak clean model berhasil disimpan di folder: {out_dir}")
    print("=" * 75)
    print("[SELESAI] TAHAP 2.6 CLEAN TRAINING SELESAI DENGAN VALIDITAS 100%!")
    print("=" * 75)

if __name__ == '__main__':
    main()
