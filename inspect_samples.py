import pandas as pd
import re

df = pd.read_csv('dataset/PhiUSIIL_Phishing_URL_Dataset.csv', nrows=5)
features = [
    'URLLength', 'DomainLength', 'IsDomainIP', 'TLDLength', 'NoOfSubDomain',
    'HasObfuscation', 'NoOfObfuscatedChar', 'ObfuscationRatio',
    'NoOfLettersInURL', 'LetterRatioInURL', 'NoOfDegitsInURL', 'DegitRatioInURL',
    'NoOfEqualsInURL', 'NoOfQMarkInURL', 'NoOfAmpersandInURL',
    'NoOfOtherSpecialCharsInURL', 'SpacialCharRatioInURL', 'IsHTTPS',
    'CharContinuationRate'
]

for i in range(3):
    row = df.iloc[i]
    print(f"--- SAMPLE {i+1} ---")
    print("URL:", row['URL'])
    print("Domain:", row['Domain'], "TLD:", row['TLD'])
    for f in features:
        print(f"  {f:28}: {row[f]}")
