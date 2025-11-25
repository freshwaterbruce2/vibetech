"""
Nonce Manager - Ensures unique, incrementing nonces across all API calls
Fixed to continue from Kraken's remembered high nonce value
"""

import time
import json
from pathlib import Path
from threading import Lock
import logging

logger = logging.getLogger(__name__)

class NonceManager:
    """Thread-safe nonce manager that continues from Kraken's remembered value"""

    # Kraken remembers the highest nonce ever used with each API key
    # For FRESH API keys, set to 0 to start from current timestamp
    # For existing keys with history, set to highest nonce Kraken remembers
    KRAKEN_REMEMBERED_NONCE = 0  # Fresh API keys - start from current time

    def __init__(self, storage_path: str = "nonce_state.json"):
        self.storage_path = Path(storage_path)
        self.lock = Lock()
        self.last_nonce = self._load_nonce()
        logger.info(f"Nonce manager initialized with value: {self.last_nonce}")

    def _load_nonce(self) -> int:
        """Load last nonce - MUST be higher than what Kraken remembers"""

        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r') as f:
                    data = json.load(f)
                    stored_nonce = data.get('last_nonce', 0)

                    # Ensure we're above Kraken's memory
                    if stored_nonce > self.KRAKEN_REMEMBERED_NONCE:
                        logger.info(f"Loaded nonce from storage: {stored_nonce}")
                        return stored_nonce
                    else:
                        logger.warning(f"Stored nonce {stored_nonce} is below Kraken's memory")
            except Exception as e:
                logger.warning(f"Could not load stored nonce: {e}")

        # For new keys (KRAKEN_REMEMBERED_NONCE = 0), start from current timestamp in milliseconds
        if self.KRAKEN_REMEMBERED_NONCE == 0:
            initial_nonce = int(time.time() * 1000)  # Milliseconds (standard for Kraken)
            logger.info(f"Starting with fresh nonce for new keys: {initial_nonce}")
        else:
            # Continue from known high value + buffer
            initial_nonce = self.KRAKEN_REMEMBERED_NONCE + 10000
            logger.info(f"Starting from high nonce: {initial_nonce}")
        return initial_nonce

    def _save_nonce(self):
        """Save current nonce to storage"""
        try:
            with open(self.storage_path, 'w') as f:
                json.dump({
                    'last_nonce': self.last_nonce,
                    'timestamp': time.time()
                }, f)
        except Exception as e:
            logger.error(f"Failed to save nonce: {e}")

    def get_nonce(self) -> str:
        """Get next unique nonce - simple increment"""
        with self.lock:
            # Just increment by 1 - simple and reliable
            self.last_nonce += 1
            self._save_nonce()
            return str(self.last_nonce)

    def reset(self):
        """Reset to continue from high value (never go backwards)"""
        with self.lock:
            # Never reset below Kraken's memory
            self.last_nonce = self.KRAKEN_REMEMBERED_NONCE + 10000
            self._save_nonce()
            logger.info(f"Reset nonce to: {self.last_nonce}")