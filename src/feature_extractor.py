import re
from urllib.parse import urlparse
from typing import Dict, Any, List

# 16 Fitur Leksikal Murni yang Dapat Dihitung Deterministik dari URL Mentah
FEATURE_NAMES: List[str] = [
    'URLLength',
    'DomainLength',
    'IsDomainIP',
    'TLDLength',
    'NoOfSubDomain',
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
    'CharContinuationRate'
]

def extract_features(raw_url: str) -> Dict[str, Any]:
    """
    Ekstraksi 16 fitur leksikal murni dan deterministik langsung dari URL mentah.
    Sama persis digunakan untuk training, testing, dan real-time inference.
    Tidak menggunakan akses jaringan, DNS lookup, atau database whitelist eksternal.
    """
    url = raw_url.strip() if isinstance(raw_url, str) else ""
    url_length = len(url)

    # 1. Parsing Skema dan Hostname
    # Normalisasi untuk parsing tanpa merusak URL asli
    if not url.startswith(('http://', 'https://')):
        parse_target = 'http://' + url
    else:
        parse_target = url

    try:
        parsed = urlparse(parse_target)
        netloc = parsed.netloc or parsed.path.split('/')[0]
    except Exception:
        netloc = url.split('/')[0]

    # Bersihkan port jika ada (contoh: 192.168.1.1:8080 => 192.168.1.1)
    domain = netloc.split(':')[0]
    domain_length = len(domain)

    # 2. IsDomainIP (IPv4)
    ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    is_domain_ip = 1 if re.match(ip_pattern, domain) else 0

    # 3. TLDLength & NoOfSubDomain
    parts = domain.split('.')
    if is_domain_ip or len(parts) <= 1:
        tld_length = 0
        no_of_subdomain = 0
    else:
        tld_length = len(parts[-1])
        # Tingkat subdomain di atas domain utama (apex domain)
        no_of_subdomain = max(0, len(parts) - 2)

    # 4. Letters (Huruf Alfabet)
    no_of_letters = sum(1 for c in url if c.isalpha())
    letter_ratio = round(no_of_letters / url_length, 4) if url_length > 0 else 0.0

    # 5. Digits (Angka)
    no_of_digits = sum(1 for c in url if c.isdigit())
    digit_ratio = round(no_of_digits / url_length, 4) if url_length > 0 else 0.0

    # 6. Delimiter Spesifik
    no_of_equals = url.count('=')
    no_of_qmark = url.count('?')
    no_of_ampersand = url.count('&')

    # 7. Karakter Khusus Lainnya (di luar alfanumerik dan = ? &)
    explicit_delims = {'=', '?', '&'}
    no_of_other_special_chars = sum(1 for c in url if not c.isalnum() and c not in explicit_delims)
    
    all_special = no_of_equals + no_of_qmark + no_of_ampersand + no_of_other_special_chars
    special_char_ratio = round(all_special / url_length, 4) if url_length > 0 else 0.0

    # 8. IsHTTPS Protocol Flag
    is_https = 1 if url.lower().startswith('https://') else 0

    # 9. CharContinuationRate
    # Rasio panjang blok alfabet kontinu terpanjang terhadap total huruf di URL
    letter_blocks = re.findall(r'[a-zA-Z]+', url)
    if letter_blocks and no_of_letters > 0:
        max_block = max(len(b) for b in letter_blocks)
        char_continuation_rate = round(max_block / no_of_letters, 4)
    else:
        char_continuation_rate = 1.0 if url_length > 0 else 0.0

    return {
        'URLLength': url_length,
        'DomainLength': domain_length,
        'IsDomainIP': is_domain_ip,
        'TLDLength': tld_length,
        'NoOfSubDomain': no_of_subdomain,
        'NoOfLettersInURL': no_of_letters,
        'LetterRatioInURL': letter_ratio,
        'NoOfDegitsInURL': no_of_digits,
        'DegitRatioInURL': digit_ratio,
        'NoOfEqualsInURL': no_of_equals,
        'NoOfQMarkInURL': no_of_qmark,
        'NoOfAmpersandInURL': no_of_ampersand,
        'NoOfOtherSpecialCharsInURL': no_of_other_special_chars,
        'SpacialCharRatioInURL': special_char_ratio,
        'IsHTTPS': is_https,
        'CharContinuationRate': char_continuation_rate
    }

def extract_features_vector(raw_url: str) -> List[float]:
    """Mengembalikan nilai fitur sebagai list numerik sesuai urutan FEATURE_NAMES."""
    feat_dict = extract_features(raw_url)
    return [float(feat_dict[k]) for k in FEATURE_NAMES]
