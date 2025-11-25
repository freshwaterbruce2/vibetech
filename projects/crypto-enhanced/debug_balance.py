import asyncio
import aiohttp
import hashlib
import hmac
import base64
import time
import os
import json
import urllib.parse
from dotenv import load_dotenv

load_dotenv(override=True)

API_KEY = os.getenv('KRAKEN_API_KEY')
API_SECRET = os.getenv('KRAKEN_API_SECRET')
BASE_URL = 'https://api.kraken.com'

# Load nonce
try:
    with open('nonce_state.json', 'r') as f:
        last_nonce = json.load(f)['last_nonce']
except:
    last_nonce = int(time.time() * 1000000)

def get_nonce():
    global last_nonce
    last_nonce += 1
    with open('nonce_state.json', 'w') as f:
        json.dump({'last_nonce': last_nonce, 'timestamp': time.time()}, f)
    return str(last_nonce)

def get_signature(urlpath, data):
    postdata = urllib.parse.urlencode(data)
    encoded = (str(data['nonce']) + postdata).encode()
    message = urlpath.encode() + hashlib.sha256(encoded).digest()
    signature = hmac.new(base64.b64decode(API_SECRET), message, hashlib.sha512)
    return base64.b64encode(signature.digest()).decode()

async def test_balance():
    print("=" * 60)
    print("TESTING BALANCE API CALL")
    print("=" * 60)
    print(f"API Key: {API_KEY[:20]}...")
    print(f"Using nonce: {last_nonce}")
    
    data = {'nonce': get_nonce()}
    url = f"{BASE_URL}/0/private/Balance"
    headers = {
        'API-Key': API_KEY,
        'API-Sign': get_signature("/0/private/Balance", data)
    }
    
    print(f"\nCalling {url}")
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, data=data) as resp:
            result = await resp.json()
            
            print(f"\nRaw API Response:")
            print(json.dumps(result, indent=2))
            
            if 'error' in result and result['error']:
                print(f"\n❌ ERROR: {result['error']}")
            
            if 'result' in result:
                print(f"\n✅ Result found:")
                for key, value in result['result'].items():
                    print(f"  {key}: {value}")
                
                usd = float(result['result'].get('ZUSD', 0))
                xlm = float(result['result'].get('XXLM', 0))
                print(f"\nParsed Balance:")
                print(f"  USD: ${usd:.2f}")
                print(f"  XLM: {xlm:.2f}")

if __name__ == "__main__":
    asyncio.run(test_balance())
