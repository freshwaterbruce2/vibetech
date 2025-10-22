"""
Startup Validator - Comprehensive Pre-Flight Checks
Run this before starting live trading to catch issues early

Addresses issues identified in learning insights:
- Connection fix failures (15 occurrences)
- Port binding conflicts (WinError 10048)
- Validation failures (7 occurrences)
- Authentication issues

Usage:
    python startup_validator.py
    python startup_validator.py --quick  # Skip slow tests
"""

import asyncio
import sys
import logging
from pathlib import Path
from typing import List, Tuple
from api_validator import (
    KrakenAPIValidator,
    PortValidator,
    RateLimitValidator,
    EdgeCaseValidator,
    ValidationResult
)
from instance_lock import check_instance_lock

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

logger = logging.getLogger(__name__)


class StartupValidator:
    """Comprehensive startup validation"""
    
    def __init__(self, quick_mode: bool = False):
        self.quick_mode = quick_mode
        self.results: List[Tuple[str, ValidationResult]] = []
        self.critical_failures = 0
        self.warnings = 0
        
    def print_header(self, text: str):
        """Print a section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{text:^70}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")
    
    def print_result(self, name: str, result: ValidationResult, critical: bool = False):
        """Print a validation result"""
        if result.is_valid:
            status = f"{Colors.GREEN}✓ PASS{Colors.END}"
        else:
            if critical:
                status = f"{Colors.RED}✗ CRITICAL{Colors.END}"
                self.critical_failures += 1
            else:
                status = f"{Colors.YELLOW}⚠ WARNING{Colors.END}"
                self.warnings += 1
        
        print(f"{status:20} {name}")
        if not result.is_valid:
            print(f"               {result.message}")
            if result.details:
                for key, value in result.details.items():
                    print(f"               • {key}: {value}")
        
        self.results.append((name, result))
    
    async def run_all_checks(self):
        """Run all validation checks"""
        print(f"\n{Colors.BOLD}Starting Pre-Flight Validation...{Colors.END}")
        print(f"Quick Mode: {self.quick_mode}\n")
        
        # 1. Instance Lock Check
        self.print_header("1. INSTANCE LOCK CHECK")
        self._check_instance_lock()
        
        # 2. Port Availability
        self.print_header("2. PORT AVAILABILITY")
        self._check_ports()
        
        # 3. WebSocket Endpoints
        self.print_header("3. WEBSOCKET ENDPOINT VALIDATION")
        self._check_websocket_endpoints()
        
        # 4. Configuration Files
        self.print_header("4. CONFIGURATION FILES")
        self._check_config_files()
        
        # 5. API Credentials
        self.print_header("5. API CREDENTIALS")
        self._check_api_credentials()
        
        # 6. Database
        self.print_header("6. DATABASE CHECK")
        self._check_database()
        
        # 7. Rate Limits
        self.print_header("7. RATE LIMIT CONFIGURATION")
        self._check_rate_limits()
        
        # 8. Network Connectivity (skip in quick mode)
        if not self.quick_mode:
            self.print_header("8. NETWORK CONNECTIVITY")
            await self._check_network()
        
        # 9. Required Python Packages
        self.print_header("9. PYTHON DEPENDENCIES")
        self._check_dependencies()
        
        # Summary
        self._print_summary()
    
    def _check_instance_lock(self):
        """Check if another instance is running"""
        try:
            lock_available = check_instance_lock()
            if lock_available:
                result = ValidationResult(
                    is_valid=True,
                    message="No other instance detected"
                )
            else:
                result = ValidationResult(
                    is_valid=False,
                    message="Another instance may be running"
                )
            self.print_result("Instance Lock", result, critical=True)
        except Exception as e:
            result = ValidationResult(
                is_valid=False,
                message=f"Failed to check instance lock: {e}"
            )
            self.print_result("Instance Lock", result, critical=True)
    
    def _check_ports(self):
        """Check critical port availability"""
        ports_to_check = [
            (8001, "API Server", True),
            (8000, "Alternative API", False),
            (5000, "Dashboard", False),
        ]
        
        for port, name, critical in ports_to_check:
            result = PortValidator.is_port_available(port)
            
            if not result.is_valid and not critical:
                # Try to find alternative
                alt_port = PortValidator.find_alternative_port(port)
                if alt_port:
                    result.details['alternative_port'] = alt_port
                    result.message += f" (alternative: {alt_port})"
            
            self.print_result(f"Port {port} ({name})", result, critical=critical)
    
    def _check_websocket_endpoints(self):
        """Validate WebSocket endpoint URLs"""
        # Public endpoint
        result = KrakenAPIValidator.validate_websocket_url(
            "wss://ws.kraken.com/v2",
            is_private=False
        )
        self.print_result("Public WebSocket URL", result, critical=True)
        
        # Private endpoint
        result = KrakenAPIValidator.validate_websocket_url(
            "wss://ws-auth.kraken.com/v2",
            is_private=True
        )
        self.print_result("Private WebSocket URL", result, critical=True)
        
        # Test subscription message format
        test_msg = {
            "method": "subscribe",
            "params": {
                "channel": "ticker",
                "symbol": ["XLM/USD"]
            }
        }
        result = KrakenAPIValidator.validate_subscription_message(test_msg)
        self.print_result("Subscription Format", result, critical=True)
    
    def _check_config_files(self):
        """Check for required configuration files"""
        required_files = [
            (".env", True),
            ("config.json", False),
            ("trading.db", False),
        ]
        
        for filename, critical in required_files:
            filepath = Path(__file__).parent / filename
            if filepath.exists():
                result = ValidationResult(
                    is_valid=True,
                    message=f"Found at {filepath}"
                )
            else:
                result = ValidationResult(
                    is_valid=False,
                    message=f"Not found at {filepath}"
                )
            self.print_result(f"Config: {filename}", result, critical=critical)
    
    def _check_api_credentials(self):
        """Check API credentials are configured"""
        try:
            from dotenv import load_dotenv
            import os
            
            load_dotenv()
            
            # Check for required env vars
            required_vars = [
                ("KRAKEN_API_KEY", True),
                ("KRAKEN_API_SECRET", True),
            ]
            
            for var_name, critical in required_vars:
                value = os.getenv(var_name)
                if value and len(value) > 10:  # Basic check
                    result = ValidationResult(
                        is_valid=True,
                        message="Configured (length check passed)"
                    )
                else:
                    result = ValidationResult(
                        is_valid=False,
                        message="Not configured or too short"
                    )
                self.print_result(var_name, result, critical=critical)
                
        except ImportError:
            result = ValidationResult(
                is_valid=False,
                message="python-dotenv not installed"
            )
            self.print_result("Environment Loader", result, critical=True)
        except Exception as e:
            result = ValidationResult(
                is_valid=False,
                message=f"Error checking credentials: {e}"
            )
            self.print_result("Credentials Check", result, critical=True)
    
    def _check_database(self):
        """Check database file and integrity"""
        db_path = Path(__file__).parent / "trading.db"
        
        if not db_path.exists():
            result = ValidationResult(
                is_valid=False,
                message=f"Database not found at {db_path}",
                details={"note": "Will be created on first run"}
            )
            self.print_result("Database File", result, critical=False)
            return
        
        # Check if we can read it
        try:
            import sqlite3
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            
            # Check for required tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            required_tables = ["trades", "orders", "balances"]
            missing_tables = [t for t in required_tables if t not in tables]
            
            conn.close()
            
            if missing_tables:
                result = ValidationResult(
                    is_valid=False,
                    message=f"Missing tables: {', '.join(missing_tables)}"
                )
            else:
                result = ValidationResult(
                    is_valid=True,
                    message=f"All required tables present ({len(tables)} total)"
                )
            
            self.print_result("Database Integrity", result, critical=False)
            
        except Exception as e:
            result = ValidationResult(
                is_valid=False,
                message=f"Cannot read database: {e}"
            )
            self.print_result("Database Access", result, critical=True)
    
    def _check_rate_limits(self):
        """Validate rate limit configuration"""
        rate_limiter = RateLimitValidator()
        
        # Test each category
        for category in ["public", "private", "websocket_connection"]:
            result = rate_limiter.can_make_request(category)
            self.print_result(f"Rate Limit: {category}", result, critical=False)
    
    async def _check_network(self):
        """Check network connectivity to Kraken"""
        print("   Testing network connectivity (this may take a few seconds)...\n")
        
        # Test REST API
        result = await KrakenAPIValidator.test_rest_endpoint("Time", timeout=10.0)
        self.print_result("REST API - Time Endpoint", result, critical=False)
        
        if result.is_valid and result.details:
            print(f"               Server time: {result.details.get('sample_response', {}).get('result', {}).get('unixtime', 'N/A')}")
    
    def _check_dependencies(self):
        """Check required Python packages"""
        required_packages = [
            ("websockets", True),
            ("aiohttp", True),
            ("asyncio", True),
            ("pydantic", True),
            ("dotenv", True),
            ("aiosqlite", False),
        ]
        
        for package_name, critical in required_packages:
            try:
                __import__(package_name)
                result = ValidationResult(
                    is_valid=True,
                    message="Installed"
                )
            except ImportError:
                result = ValidationResult(
                    is_valid=False,
                    message="Not installed"
                )
            
            self.print_result(f"Package: {package_name}", result, critical=critical)
    
    def _print_summary(self):
        """Print validation summary"""
        self.print_header("VALIDATION SUMMARY")
        
        total_checks = len(self.results)
        passed = sum(1 for _, r in self.results if r.is_valid)
        failed = total_checks - passed
        
        print(f"Total Checks: {total_checks}")
        print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
        
        if self.warnings > 0:
            print(f"{Colors.YELLOW}Warnings: {self.warnings}{Colors.END}")
        
        if self.critical_failures > 0:
            print(f"{Colors.RED}Critical Failures: {self.critical_failures}{Colors.END}")
        
        print()
        
        # Final verdict
        if self.critical_failures > 0:
            print(f"{Colors.RED}{Colors.BOLD}❌ VALIDATION FAILED{Colors.END}")
            print(f"{Colors.RED}Fix critical issues before starting trading!{Colors.END}")
            return False
        elif self.warnings > 0:
            print(f"{Colors.YELLOW}{Colors.BOLD}⚠ VALIDATION PASSED WITH WARNINGS{Colors.END}")
            print(f"{Colors.YELLOW}Review warnings but safe to proceed.{Colors.END}")
            return True
        else:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ ALL CHECKS PASSED{Colors.END}")
            print(f"{Colors.GREEN}System is ready for trading!{Colors.END}")
            return True


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate trading system before startup")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Skip slow network tests"
    )
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.WARNING,  # Only show warnings/errors during validation
        format='%(levelname)s: %(message)s'
    )
    
    # Run validation
    validator = StartupValidator(quick_mode=args.quick)
    success = await validator.run_all_checks()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
