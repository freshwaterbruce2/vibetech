#!/usr/bin/env python3
"""Simple API test - just check if credentials work"""
import os
import time
import hashlib
import hmac
import base64
import urllib.parse
import requests
from dotenv import load_dotenv

load_dotenv(override=True)  # Force override existing environment variables

API_KEY = os.getenv('KRAKEN_API_KEY', '').strip()
API_SECRET = os.getenv('KRAKEN_API_SECRET', '').strip()

print(f"API Key length: {len(API_KEY)}")
print(f"API Secret length: {len(API_SECRET)}")
print(f"API Key starts with: {API_KEY[:10]}...")
print(f"API Secret is valid base64: ", end="")

try:
    decoded = base64.b64decode(API_SECRET)
    print(f"YES ({len(decoded)} bytes)")
except Exception as e:
    print(f"NO - {e}")
    exit(1)

# Simple balance request
def get_balance():
    url = "https://api.kraken.com/0/private/Balance"

    # Nonce: current time in milliseconds
    nonce = str(int(time.time() * 1000))
    print(f"\nUsing nonce: {nonce}")

    # POST data
    data = {'nonce': nonce}
    postdata = urllib.parse.urlencode(data)

    # Signature
    urlpath = '/0/private/Balance'
    encoded = (nonce + postdata).encode()
    message = urlpath.encode() + hashlib.sha256(encoded).digest()
    signature = hmac.new(
        base64.b64decode(API_SECRET),
        message,
        hashlib.sha512
    )
    sigdigest = base64.b64encode(signature.digest()).decode()

    # Headers
    headers = {
        'API-Key': API_KEY,
        'API-Sign': sigdigest
    }

    print(f"Signature: {sigdigest[:20]}...")
    print("\nSending request...")

    response = requests.post(url, data=data, headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    return response.json()

if __name__ == "__main__":
    result = get_balance()

    if result.get('error'):
        print(f"\n[ERROR] {result['error']}")
        exit(1)
    else:
        print("\n[SUCCESS] API keys work!")
        if result.get('result'):
            print(f"Balances: {result['result']}")
