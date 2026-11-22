import os
import json
import pandas as pd
import numpy as np

print("="*70)
print("AUDIT VALIDITAS MODEL & FITUR PHISHINGGUARD")
print("="*70)

# Load dataset
data_path = os.path.join("dataset", "PhiUSIIL_Phishing_URL_Dataset.csv")
df = pd.read_csv(data_path)

# 1. Analisis Fitur Spesifik: URLSimilarityIndex, TLDLegitimateProb, URLCharProb
target_feats = ['URLSimilarityIndex', 'TLDLegitimateProb', 'URLCharProb']
print("\n--- 1. ANALISIS STATISTIK FITUR KRUSIAL TERHADAP LABEL ---")
for f in target_feats:
    print(f"\nFitur: {f}")
    print(df.groupby('label')[f].describe())

# Check correlation with label
corr = df[target_feats + ['label']].corr()['label']
print("\nKorelasi Pearson dengan label (0=Phishing, 1=Legit):")
print(corr)

# Check separability of URLSimilarityIndex
print("\nBerapa banyak sample dengan URLSimilarityIndex == 100 per kelas?")
print(pd.crosstab(df['URLSimilarityIndex'] == 100, df['label'], rownames=['Is_100'], colnames=['Label']))

# 2. Periksa Duplikasi URL dan Domain
print("\n--- 2. ANALISIS DUPLIKASI URL DAN DOMAIN ---")
total_rows = len(df)
unique_urls = df['URL'].nunique()
unique_domains = df['Domain'].nunique() if 'Domain' in df.columns else "N/A"
print(f"Total rows       : {total_rows:,}")
print(f"Unique URLs      : {unique_urls:,} (Duplikat: {total_rows - unique_urls})")
print(f"Unique Domains   : {unique_domains:,} (Duplikat: {total_rows - unique_domains})")

# Periksa apakah URL duplikat memiliki label berbeda (kontradiksi label)
url_label_counts = df.groupby('URL')['label'].nunique()
conflicting_urls = url_label_counts[url_label_counts > 1]
print(f"URL dengan label ganda/kontradiktif: {len(conflicting_urls)}")

# 3. Analisis 22 Fitur: Kemampuan Dihitung Statis Murni vs Fitur Eksternal
print("\n--- 3. INSPEKSI SEMUA 22 FITUR ---")
feature_cols = [
    'URLLength', 'DomainLength', 'IsDomainIP', 'TLDLength', 'NoOfSubDomain',
    'HasObfuscation', 'NoOfObfuscatedChar', 'ObfuscationRatio',
    'NoOfLettersInURL', 'LetterRatioInURL', 'NoOfDegitsInURL', 'DegitRatioInURL',
    'NoOfEqualsInURL', 'NoOfQMarkInURL', 'NoOfAmpersandInURL',
    'NoOfOtherSpecialCharsInURL', 'SpacialCharRatioInURL', 'IsHTTPS',
    'CharContinuationRate', 'URLSimilarityIndex', 'TLDLegitimateProb', 'URLCharProb'
]

print("Contoh 3 baris dari 22 fitur untuk Legitimate (label=1):")
print(df[df['label']==1][feature_cols].head(3).T)

print("\nContoh 3 baris dari 22 fitur untuk Phishing (label=0):")
print(df[df['label']==0][feature_cols].head(3).T)
