import pandas as pd
import os

print("="*60)
print("AUDIT FILE 1: phishing_site_urls.csv")
print("="*60)

f1 = "dataset/phishing_site_urls.csv"
if os.path.exists(f1):
    size_mb = os.path.getsize(f1) / (1024*1024)
    print(f"File Size: {size_mb:.2f} MB")
    df1 = pd.read_csv(f1)
    print(f"Shape: {df1.shape} (Rows: {df1.shape[0]}, Cols: {df1.shape[1]})")
    print("\nColumns and Dtypes:")
    print(df1.dtypes)
    print("\nFirst 3 rows:")
    print(df1.head(3))
    print("\nMissing values:")
    print(df1.isnull().sum())
    print("\nDuplicate rows count:", df1.duplicated().sum())
    print("Duplicate URLs count:", df1['URL'].duplicated().sum() if 'URL' in df1.columns else "N/A")
    print("\nClass distribution:")
    print(df1['Label'].value_counts() if 'Label' in df1.columns else "No 'Label' column")
    print(df1['Label'].value_counts(normalize=True) * 100 if 'Label' in df1.columns else "")
else:
    print("File not found!")

print("\n" + "="*60)
print("AUDIT FILE 2: PhiUSIIL_Phishing_URL_Dataset.csv")
print("="*60)

f2 = "dataset/PhiUSIIL_Phishing_URL_Dataset.csv"
if os.path.exists(f2):
    size_mb = os.path.getsize(f2) / (1024*1024)
    print(f"File Size: {size_mb:.2f} MB")
    df2 = pd.read_csv(f2)
    print(f"Shape: {df2.shape} (Rows: {df2.shape[0]}, Cols: {df2.shape[1]})")
    print("\nColumns and Dtypes:")
    print(df2.dtypes)
    print("\nFirst 2 rows:")
    print(df2.head(2))
    print("\nMissing values (columns with >0 nulls):")
    nulls = df2.isnull().sum()
    print(nulls[nulls > 0] if (nulls > 0).any() else "No missing values across all columns!")
    print("\nDuplicate rows count:", df2.duplicated().sum())
    if 'URL' in df2.columns:
        print("Duplicate URLs count:", df2['URL'].duplicated().sum())
    
    # Check target candidate columns
    for col in ['label', 'Label', 'CLASS_LABEL', 'Result', 'target']:
        if col in df2.columns:
            print(f"\nClass distribution for '{col}':")
            print(df2[col].value_counts())
            print(df2[col].value_counts(normalize=True) * 100)
else:
    print("File not found!")
