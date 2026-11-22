import os
import json
import re
from urllib.parse import urlparse
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
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

def main():
    print("=" * 70)
    print("PHISHINGGUARD — TAHAP 2: PREPROCESSING, TRAINING & EVALUASI")
    print("=" * 70)

    # 1. Load Dataset
    data_path = os.path.join("dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("dataset", "phiusiil+phishing+url+dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
    
    print(f"[*] Membaca dataset dari: {data_path} ...")
    df = pd.read_csv(data_path)
    print(f"[+] Dataset dimuat: {df.shape[0]:,} baris, {df.shape[1]} kolom.")

    # 2. Seleksi Fitur Leksikal Statis URL (Zero-Network Quarantine)
    # Menghindari data leakage dari identifier string dan fitur HTML web-content
    feature_cols = [
        'URLLength',
        'DomainLength',
        'IsDomainIP',
        'TLDLength',
        'NoOfSubDomain',
        'HasObfuscation',
        'NoOfObfuscatedChar',
        'ObfuscationRatio',
        'NoOfLettersInURL',
        'LetterRatioInURL',
        'NoOfDegitsInURL',
        'DegitRatioInURL',
        'NoOfEqualsInURL',
        'NoOfQMarkInURL',
        'NoOfAmpersandInURL',
        'NoOfOtherSpecialCharsInURL',
        'SpacialCharRatioInURL',
        'IsHTTPS',
        'CharContinuationRate',
        'URLSimilarityIndex',
        'TLDLegitimateProb',
        'URLCharProb'
    ]

    # Pastikan seluruh kolom tersedia
    missing_cols = [c for c in feature_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Kolom fitur tidak ditemukan dalam dataset: {missing_cols}")

    target_col = 'label'
    print(f"[*] Fitur yang digunakan ({len(feature_cols)} fitur leksikal statis):")
    for idx, f in enumerate(feature_cols, 1):
        print(f"    {idx}. {f}")

    # 3. Ekstraksi X dan y
    X = df[feature_cols].copy()
    y = df[target_col].copy()

    # Pastikan data bersih dari missing values
    X = X.fillna(0)

    print("\n[*] Distribusi Kelas Asli:")
    counts = y.value_counts()
    for val, count in counts.items():
        label_desc = "Legitimate" if val == 1 else "Phishing"
        print(f"    Kelas {val} ({label_desc}): {count:,} ({count/len(y)*100:.2f}%)")

    # 4. Stratified Train-Test Split (80:20) dengan random_state=42
    print("\n[*] Membagi data train-test (80:20) secara stratified...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )
    print(f"[+] Data Training : {X_train.shape[0]:,} baris")
    print(f"[+] Data Testing  : {X_test.shape[0]:,} baris")

    # 5. Training Random Forest Classifier
    print("\n[*] Melatih RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    rf_model.fit(X_train, y_train)
    print("[+] Model berhasil dilatih!")

    # 6. Evaluasi Aktual pada Data Testing (Unseen Data)
    print("\n[*] Melakukan evaluasi aktual pada data testing...")
    y_pred = rf_model.predict(X_test)
    y_pred_proba = rf_model.predict_proba(X_test)

    # Metrik
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average='macro'))
    rec_macro = float(recall_score(y_test, y_pred, average='macro'))
    f1_macro = float(f1_score(y_test, y_pred, average='macro'))

    # Metrik per kelas
    # Kelas 0: Phishing, Kelas 1: Legitimate
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    # cm:
    # row 0 (Actual 0 / Phishing): [TN_p, FP_p] => [Actual Phishing Pred Phishing, Actual Phishing Pred Legit]
    # row 1 (Actual 1 / Legit):    [FN_p, TP_p] => [Actual Legit Pred Phishing, Actual Legit Pred Legit]
    # Standar cybersecurity (Phishing adalah kelas Positif target deteksi):
    # True Positive (TP): Phishing terdeteksi Phishing = cm[0, 0]
    # False Negative (FN): Phishing lolos terprediksi Legit = cm[0, 1]
    # False Positive (FP): Legit salah dituduh Phishing = cm[1, 0]
    # True Negative (TN): Legit terprediksi Legit = cm[1, 1]
    
    tp_phish = int(cm[0, 0])
    fn_phish = int(cm[0, 1])
    fp_phish = int(cm[1, 0])
    tn_phish = int(cm[1, 1])

    prec_phish = float(precision_score(y_test, y_pred, pos_label=0))
    rec_phish = float(recall_score(y_test, y_pred, pos_label=0))
    f1_phish = float(f1_score(y_test, y_pred, pos_label=0))

    prec_legit = float(precision_score(y_test, y_pred, pos_label=1))
    rec_legit = float(recall_score(y_test, y_pred, pos_label=1))
    f1_legit = float(f1_score(y_test, y_pred, pos_label=1))

    clf_report = classification_report(y_test, y_pred, target_names=['Phishing (0)', 'Legitimate (1)'], output_dict=True)
    clf_report_text = classification_report(y_test, y_pred, target_names=['Phishing (0)', 'Legitimate (1)'])

    print("\n" + "=" * 50)
    print("HASIL EVALUASI AKTUAL (DATA TESTING):")
    print("=" * 50)
    print(f"Accuracy                 : {acc * 100:.2f}%")
    print(f"Precision (Phishing / 0) : {prec_phish * 100:.2f}%")
    print(f"Recall (Phishing / 0)    : {rec_phish * 100:.2f}%")
    print(f"F1-Score (Phishing / 0)  : {f1_phish * 100:.2f}%")
    print(f"\nPrecision (Legit / 1)    : {prec_legit * 100:.2f}%")
    print(f"Recall (Legit / 1)       : {rec_legit * 100:.2f}%")
    print(f"F1-Score (Legit / 1)     : {f1_legit * 100:.2f}%")
    print("-" * 50)
    print("Confusion Matrix Breakdown (Deteksi Phishing sebagai Positif Target):")
    print(f"  • True Positive (Phishing terdeteksi)       : {tp_phish:,}")
    print(f"  • False Negative (Phishing lolos / miss)    : {fn_phish:,}")
    print(f"  • False Positive (Legit salah dituduh)      : {fp_phish:,}")
    print(f"  • True Negative (Legit terverifikasi aman)  : {tn_phish:,}")
    print("\nClassification Report:\n", clf_report_text)

    # 7. Gini Feature Importance
    importances = rf_model.feature_importances_
    feat_imp_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)

    print("\n[*] Top 10 Feature Importance:")
    for i, row in feat_imp_df.head(10).iterrows():
        print(f"    {i+1}. {row['feature']:<25} : {row['importance'] * 100:.2f}%")

    # 8. Simpan Model & Metadata
    os.makedirs("models", exist_ok=True)
    model_path = os.path.join("models", "random_forest_model.joblib")
    print(f"\n[*] Menyimpan model ke: {model_path} ...")
    joblib.dump(rf_model, model_path, compress=3)

    # Simpan skema fitur & preprocessing metadata untuk inference
    feature_meta = {
        "features": feature_cols,
        "n_features": len(feature_cols),
        "target_classes": {
            "0": "Phishing",
            "1": "Legitimate"
        },
        "random_state": 42,
        "model_type": "RandomForestClassifier",
        "n_estimators": 100
    }
    feature_meta_path = os.path.join("models", "feature_schema.json")
    with open(feature_meta_path, 'w', encoding='utf-8') as f:
        json.dump(feature_meta, f, indent=2)

    # Simpan hasil evaluasi aktual ke JSON
    eval_results = {
        "dataset_name": "PhiUSIIL Phishing URL Dataset",
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision_macro": round(prec_macro, 4),
            "recall_macro": round(rec_macro, 4),
            "f1_score_macro": round(f1_macro, 4),
            "phishing": {
                "precision": round(prec_phish, 4),
                "recall": round(rec_phish, 4),
                "f1_score": round(f1_phish, 4)
            },
            "legitimate": {
                "precision": round(prec_legit, 4),
                "recall": round(rec_legit, 4),
                "f1_score": round(f1_legit, 4)
            }
        },
        "confusion_matrix": {
            "raw_matrix": cm.tolist(),
            "true_positive_phishing": tp_phish,
            "false_negative_phishing": fn_phish,
            "false_positive_phishing": fp_phish,
            "true_negative_phishing": tn_phish
        },
        "classification_report": clf_report,
        "feature_importance": [
            {"feature": row['feature'], "importance": round(float(row['importance']), 4)}
            for _, row in feat_imp_df.iterrows()
        ]
    }
    eval_json_path = os.path.join("models", "evaluation_metrics.json")
    with open(eval_json_path, 'w', encoding='utf-8') as f:
        json.dump(eval_results, f, indent=2)
    print(f"[+] Evaluasi JSON disimpan di: {eval_json_path}")

    # 9. Generate Grafik Confusion Matrix (PNG)
    plt.figure(figsize=(7, 5.5))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=['Pred: Phishing (0)', 'Pred: Legit (1)'],
        yticklabels=['Actual: Phishing (0)', 'Actual: Legit (1)']
    )
    plt.title('Actual Confusion Matrix — Random Forest Testing Set', fontsize=12, fontweight='bold', pad=12)
    plt.ylabel('Actual Ground Truth')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    cm_plot_path = os.path.join("models", "confusion_matrix.png")
    plt.savefig(cm_plot_path, dpi=300)
    plt.close()
    print(f"[+] Gambar Confusion Matrix disimpan di: {cm_plot_path}")

    # 10. Generate Grafik Feature Importance (PNG)
    plt.figure(figsize=(10, 6.5))
    top_feats = feat_imp_df.head(12)
    sns.barplot(
        x='importance',
        y='feature',
        data=top_feats,
        palette='viridis'
    )
    plt.title('Top 12 Gini Feature Importance — Random Forest Model', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Gini Importance (Relative Contribution)')
    plt.ylabel('Lexical Feature')
    plt.tight_layout()
    feat_plot_path = os.path.join("models", "feature_importance.png")
    plt.savefig(feat_plot_path, dpi=300)
    plt.close()
    print(f"[+] Gambar Feature Importance disimpan di: {feat_plot_path}")

    print("\n" + "=" * 70)
    print("[SUCCESS] PREPROCESSING, TRAINING & EVALUASI SELESAI DENGAN SEMPURNA!")
    print("=" * 70)

if __name__ == '__main__':
    main()
