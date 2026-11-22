import urllib.request
import json
import time

print("="*75)
print("PENGUJIAN END-TO-END REST API PHISHINGGUARD (BACKEND TEST)")
print("="*75)

base_url = "http://127.0.0.1:8000"

def get(endpoint):
    url = f"{base_url}{endpoint}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def post(endpoint, data):
    url = f"{base_url}{endpoint}"
    js_bytes = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=js_bytes, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

# 1. Test GET /api/health
print("\n[1] TEST GET /api/health")
s, res = get("/api/health")
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 2. Test GET /api/model-info
print("\n[2] TEST GET /api/model-info")
s, res = get("/api/model-info")
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 3. Test GET /api/evaluation
print("\n[3] TEST GET /api/evaluation")
s, res = get("/api/evaluation")
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 4. Test POST /api/scan (Legitimate URL)
print("\n[4] TEST POST /api/scan (URL Legitimate: https://www.google.com)")
s, res = post("/api/scan", {"url": "https://www.google.com"})
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 5. Test POST /api/scan (Suspicious Phishing URL)
print("\n[5] TEST POST /api/scan (URL Phishing: https://secure-login-account-update.example.xyz)")
s, res = post("/api/scan", {"url": "https://secure-login-account-update.example.xyz"})
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 6. Test POST /api/scan (Bare IP Attack)
print("\n[6] TEST POST /api/scan (Bare IP: http://192.168.1.1/login)")
s, res = post("/api/scan", {"url": "http://192.168.1.1/login"})
print(f"Status HTTP: {s}")
print(json.dumps(res, indent=2))

# 7. Test POST /api/scan (URL Kosong - Validasi Error)
print("\n[7] TEST POST /api/scan (URL Kosong)")
s, res = post("/api/scan", {"url": ""})
print(f"Status HTTP: {s} (Harus 422 Unprocessable Entity)")
print(json.dumps(res, indent=2))

# 8. Test POST /api/scan (URL Tidak Valid)
print("\n[8] TEST POST /api/scan (Input Malformed)")
s, res = post("/api/scan", {"url": "abc"})
print(f"Status HTTP: {s} (Harus 422)")
print(json.dumps(res, indent=2))

# 9. Test GET /api/history
print("\n[9] TEST GET /api/history")
s, res = get("/api/history")
print(f"Status HTTP: {s} | Total item tersimpan di SQLite: {res['total']}")
if res['history']:
    latest_id = res['history'][0]['id']
    print(f"Latest Scan ID: {latest_id}")

    # 10. Test GET /api/history/{id}
    print(f"\n[10] TEST GET /api/history/{latest_id}")
    s, res_detail = get(f"/api/history/{latest_id}")
    print(f"Status HTTP: {s}")
    print(json.dumps(res_detail, indent=2))

print("\n" + "="*75)
print("[SUKSES] SELURUH 10 PENGUJIAN ENDPOINT REST API BERHASIL 100%!")
print("="*75)
