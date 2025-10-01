"""
Unit tests for nonce manager
Tests thread safety, uniqueness, and persistence
"""

import pytest
import asyncio
import time
import tempfile
from pathlib import Path
import sys
import threading
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, str(Path(__file__).parent.parent))

from nonce_manager import NonceManager


class TestNonceManager:
    """Test suite for NonceManager"""

    @pytest.fixture
    def temp_nonce_file(self):
        """Create temporary nonce state file"""
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            temp_path = f.name
        yield temp_path
        Path(temp_path).unlink(missing_ok=True)

    def test_nonce_generation(self):
        """Test basic nonce generation"""
        manager = NonceManager()

        nonce1 = manager.get_nonce()
        time.sleep(0.01)  # Small delay
        nonce2 = manager.get_nonce()

        # Nonces should be unique and increasing
        assert nonce1 != nonce2
        assert int(nonce2) > int(nonce1)

    def test_nonce_uniqueness(self):
        """Test that nonces are always unique"""
        manager = NonceManager()
        nonces = set()

        # Generate many nonces quickly
        for _ in range(100):
            nonce = manager.get_nonce()
            assert nonce not in nonces
            nonces.add(nonce)

    def test_thread_safety(self):
        """Test nonce generation is thread-safe"""
        manager = NonceManager()
        nonces = []
        lock = threading.Lock()

        def generate_nonces(count):
            for _ in range(count):
                nonce = manager.get_nonce()
                with lock:
                    nonces.append(nonce)

        # Run from multiple threads
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(generate_nonces, 10) for _ in range(10)]
            for future in futures:
                future.result()

        # All nonces should be unique
        assert len(nonces) == 100
        assert len(set(nonces)) == 100

        # Nonces should be monotonically increasing
        nonces_int = [int(n) for n in nonces]
        assert nonces_int == sorted(nonces_int)

    def test_nonce_persistence(self, temp_nonce_file):
        """Test nonce state persistence"""
        # Create manager with temp file
        manager1 = NonceManager(state_file=temp_nonce_file)

        # Generate some nonces
        last_nonce = None
        for _ in range(5):
            last_nonce = manager1.get_nonce()

        # Create new manager with same file
        manager2 = NonceManager(state_file=temp_nonce_file)
        new_nonce = manager2.get_nonce()

        # Should continue from last nonce
        assert int(new_nonce) > int(last_nonce)

    def test_nonce_format(self):
        """Test nonce format is correct"""
        manager = NonceManager()
        nonce = manager.get_nonce()

        # Should be string of digits
        assert isinstance(nonce, str)
        assert nonce.isdigit()

        # Should be millisecond timestamp
        assert len(nonce) >= 13  # At least millisecond precision

    def test_microsecond_precision(self):
        """Test that rapid nonce generation uses microseconds"""
        manager = NonceManager()
        nonces = []

        # Generate nonces as fast as possible
        for _ in range(10):
            nonces.append(manager.get_nonce())

        # All should be unique even without delays
        assert len(set(nonces)) == 10

        # Check they have microsecond precision (more than 13 digits)
        for nonce in nonces:
            assert len(nonce) >= 16  # Microsecond precision

    def test_concurrent_async_generation(self):
        """Test async concurrent nonce generation"""
        manager = NonceManager()

        async def generate_nonces_async(count):
            nonces = []
            for _ in range(count):
                nonce = await asyncio.get_event_loop().run_in_executor(
                    None, manager.get_nonce
                )
                nonces.append(nonce)
            return nonces

        async def test():
            tasks = [generate_nonces_async(20) for _ in range(5)]
            results = await asyncio.gather(*tasks)
            all_nonces = []
            for nonces in results:
                all_nonces.extend(nonces)

            # All should be unique
            assert len(all_nonces) == 100
            assert len(set(all_nonces)) == 100
            return all_nonces

        all_nonces = asyncio.run(test())

        # Verify all unique
        assert len(set(all_nonces)) == len(all_nonces)

    def test_recovery_from_future_nonce(self):
        """Test recovery when system time goes backwards"""
        manager = NonceManager()

        # Get current nonce
        nonce1 = manager.get_nonce()

        # Manually set a future nonce (simulating time sync issue)
        future_time = int(time.time() * 1000000) + 1000000000  # 1000 seconds in future
        manager.last_nonce = future_time

        # Should still generate increasing nonces
        nonce2 = manager.get_nonce()
        assert int(nonce2) > future_time

    def test_high_frequency_generation(self):
        """Test nonce generation under high frequency"""
        manager = NonceManager()
        duration = 0.1  # 100ms test
        start_time = time.time()
        nonces = []

        while time.time() - start_time < duration:
            nonces.append(manager.get_nonce())

        # All should be unique
        assert len(nonces) == len(set(nonces))

        # Should generate many nonces quickly
        assert len(nonces) > 100  # At least 1000/sec

    def test_state_file_corruption_recovery(self, temp_nonce_file):
        """Test recovery from corrupted state file"""
        # Write corrupted data
        with open(temp_nonce_file, 'w') as f:
            f.write("corrupted data not json")

        # Should handle gracefully
        manager = NonceManager(state_file=temp_nonce_file)
        nonce = manager.get_nonce()
        assert nonce is not None
        assert nonce.isdigit()

    def test_multiple_manager_instances(self):
        """Test multiple NonceManager instances don't conflict"""
        manager1 = NonceManager()
        manager2 = NonceManager()

        # Generate from both
        nonces1 = [manager1.get_nonce() for _ in range(10)]
        nonces2 = [manager2.get_nonce() for _ in range(10)]

        # Each manager's nonces should be unique
        assert len(set(nonces1)) == 10
        assert len(set(nonces2)) == 10

        # But they might overlap (unless using shared state)
        # This is expected behavior for separate instances

    def test_nonce_string_sorting(self):
        """Test that nonces sort correctly as strings"""
        manager = NonceManager()
        nonces = []

        for _ in range(20):
            nonces.append(manager.get_nonce())
            time.sleep(0.001)  # Small delay

        # String sorting should match numeric sorting for our nonces
        nonces_sorted = sorted(nonces)
        assert nonces == nonces_sorted

    @pytest.mark.parametrize("delay_ms", [0, 1, 10, 100])
    def test_various_delays(self, delay_ms):
        """Test nonce generation with various delays"""
        manager = NonceManager()
        nonces = []

        for _ in range(5):
            nonces.append(manager.get_nonce())
            if delay_ms > 0:
                time.sleep(delay_ms / 1000)

        # All should be unique regardless of delay
        assert len(set(nonces)) == 5

        # Should be increasing
        for i in range(1, len(nonces)):
            assert int(nonces[i]) > int(nonces[i-1])


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])