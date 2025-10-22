"""Test which API keys are actually loaded"""
import os
from pathlib import Path

# Clear any cached env vars
if 'KRAKEN_API_KEY' in os.environ:
    del os.environ['KRAKEN_API_KEY']
if 'KRAKEN_API_SECRET' in os.environ:
    del os.environ['KRAKEN_API_SECRET']

from dotenv import load_dotenv

# Force reload
load_dotenv(override=True)

api_key = os.getenv('KRAKEN_API_KEY')
api_secret = os.getenv('KRAKEN_API_SECRET')

print("="*60)
print("CURRENT API KEYS LOADED:")
print("="*60)
print(f"API Key: {api_key[:30]}...")
print(f"API Secret: {api_secret[:30]}...")
print()

# Check which account this is
if api_key.startswith('G4mTx44'):
    print("✅ CORRECT! Using $134 account keys")
elif api_key.startswith('sFRfee'):
    print("❌ WRONG! Using $0 account keys")
else:
    print("⚠️ Unknown API key!")

print()
print(".env file location:", Path('.env').absolute())
print(".env exists:", Path('.env').exists())
