"""
Configuration module for Crypto Enhanced Trading System
"""

import os
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """System configuration"""

    def __init__(self, config_file: Optional[str] = None):
        # Default config file is trading_config.json
        if config_file is None:
            config_file = 'trading_config.json'

        # Load from JSON file first
        if Path(config_file).exists():
            with open(config_file, 'r') as f:
                config_data = json.load(f)

                # Load trading pairs
                self.trading_pairs = config_data.get(
                    'trading_pairs', ['XBT/USD', 'ETH/USD']
                )

                # Load risk management
                risk = config_data.get('risk_management', {})
                self.max_position_size = risk.get('max_position_size', 30)
                self.max_total_exposure = risk.get('max_total_exposure', 90)
                self.max_positions = risk.get('max_positions', 3)
                self.max_risk_score = risk.get('max_risk_score', 0.8)
                self.min_balance_required = risk.get(
                    'min_balance_required', 15
                )

                # Load trading parameters
                params = config_data.get('trading_parameters', {})
                self.engine_loop_interval = params.get(
                    'engine_loop_interval', 30
                )
                self.slippage_tolerance = params.get(
                    'slippage_tolerance', 0.001
                )
                self.default_order_type = params.get(
                    'default_order_type', 'limit'
                )

                # Load fees
                fees = config_data.get('fees', {})
                self.maker_fee = fees.get('maker_fee', 0.0016)
                self.taker_fee = fees.get('taker_fee', 0.0026)

                # Load monitoring
                monitoring = config_data.get('monitoring', {})
                self.enable_monitoring = monitoring.get(
                    'enable_monitoring', True
                )
                self.monitoring_interval = monitoring.get(
                    'monitoring_interval', 60
                )
                self.min_balance_alert = monitoring.get(
                    'min_balance_alert', 50
                )

                # Load websocket settings
                ws = config_data.get('websocket', {})
                self.ws_reconnect_interval = ws.get('reconnect_interval', 5)
                self.ws_heartbeat_interval = ws.get('heartbeat_interval', 30)

                # Load XLM-specific settings
                xlm = config_data.get('xlm_specific', {})
                self.xlm_min_order_size = xlm.get('min_order_size', 20)
                self.xlm_price_range_min = xlm.get('price_range_min', 0.33)
                self.xlm_price_range_max = xlm.get('price_range_max', 0.43)
                self.xlm_stop_loss_price = xlm.get('stop_loss_price', 0.35)
                self.xlm_take_profit_price = xlm.get('take_profit_price', 0.41)
                self.xlm_cooldown_minutes = xlm.get('cooldown_minutes', 5)
        else:
            # Fallback to environment variables if no config file
            self._load_from_env()

        # Load multiple API credentials from environment for nonce isolation
        # Primary key for trading operations
        self.kraken_api_key = os.getenv('KRAKEN_API_KEY', '')
        self.kraken_api_secret = os.getenv('KRAKEN_API_SECRET', '')

        # Secondary key for status/balance checks to avoid nonce conflicts
        self.kraken_api_key_2 = os.getenv('KRAKEN_API_KEY_2', self.kraken_api_key)
        self.kraken_api_secret_2 = os.getenv('KRAKEN_API_SECRET_2', self.kraken_api_secret)

        # WebSocket token
        self.ws_auth_token = os.getenv('KRAKEN_WS_TOKEN', '')

        # Nonce window for error tolerance (10000+ recommended for 2025)
        self.nonce_window = int(os.getenv('KRAKEN_NONCE_WINDOW', '10000'))

        # Database and logging always from environment
        self.db_path = os.getenv('DB_PATH', 'trading.db')
        self.log_level = os.getenv('LOG_LEVEL', 'INFO')
        self.base_currency = os.getenv('BASE_CURRENCY', 'USD')

    def _load_from_env(self):
        """Load configuration from environment variables as fallback"""
        # Trading Configuration
        pairs_str = os.getenv('TRADING_PAIRS', 'XBT/USD,ETH/USD')
        self.trading_pairs = pairs_str.split(',')

        # Risk Management
        self.max_position_size = float(os.getenv('MAX_POSITION_SIZE', '10'))
        self.max_total_exposure = float(os.getenv('MAX_TOTAL_EXPOSURE', '10'))
        self.max_positions = int(os.getenv('MAX_POSITIONS', '1'))
        self.max_risk_score = float(os.getenv('MAX_RISK_SCORE', '0.6'))
        self.min_balance_alert = float(
            os.getenv('MIN_BALANCE_ALERT', '50')
        )
        self.min_balance_required = float(
            os.getenv('MIN_BALANCE_REQUIRED', '15')
        )

        # XLM-specific defaults
        self.xlm_min_order_size = 20
        self.xlm_price_range_min = 0.33
        self.xlm_price_range_max = 0.43
        self.xlm_stop_loss_price = 0.35
        self.xlm_take_profit_price = 0.41
        self.xlm_cooldown_minutes = 5

        # Trading Fees
        self.maker_fee = float(os.getenv('MAKER_FEE', '0.0016'))
        self.taker_fee = float(os.getenv('TAKER_FEE', '0.0026'))

        # System Configuration
        self.engine_loop_interval = int(
            os.getenv('ENGINE_LOOP_INTERVAL', '30')
        )

        # WebSocket Configuration
        self.ws_reconnect_interval = int(
            os.getenv('WS_RECONNECT_INTERVAL', '5')
        )
        self.ws_heartbeat_interval = int(
            os.getenv('WS_HEARTBEAT_INTERVAL', '30')
        )

        # Order Configuration
        self.default_order_type = os.getenv('DEFAULT_ORDER_TYPE', 'limit')
        self.slippage_tolerance = float(
            os.getenv('SLIPPAGE_TOLERANCE', '0.001')
        )

        # Monitoring
        monitoring_env = os.getenv('ENABLE_MONITORING', 'true').lower()
        self.enable_monitoring = monitoring_env == 'true'
        self.monitoring_interval = int(
            os.getenv('MONITORING_INTERVAL', '60')
        )

    def validate(self) -> bool:
        """Validate configuration"""
        errors = []

        # Check required fields
        if not self.kraken_api_key:
            errors.append("KRAKEN_API_KEY not set")
        if not self.kraken_api_secret:
            errors.append("KRAKEN_API_SECRET not set")

        # Warn if secondary keys not configured (not required but recommended)
        if self.kraken_api_key_2 == self.kraken_api_key:
            print("WARNING: Using same API key for both operations. Consider setting KRAKEN_API_KEY_2 for better nonce isolation.")

        # Check nonce window
        if self.nonce_window < 1000:
            errors.append("KRAKEN_NONCE_WINDOW should be at least 1000 for reliability")
        if not self.trading_pairs:
            errors.append("No trading pairs configured")

        # Check value ranges
        if self.max_position_size <= 0:
            errors.append("MAX_POSITION_SIZE must be positive")
        if self.max_total_exposure <= 0:
            errors.append("MAX_TOTAL_EXPOSURE must be positive")
        if self.max_positions <= 0:
            errors.append("MAX_POSITIONS must be positive")
        if not 0 <= self.max_risk_score <= 1:
            errors.append("MAX_RISK_SCORE must be between 0 and 1")

        if errors:
            print("Configuration errors:")
            for error in errors:
                print(f"  - {error}")
            return False

        return True

    def save(self, filepath: str):
        """Save configuration to file"""
        config_dict = {
            key: value for key, value in self.__dict__.items()
            if not key.startswith('_')
            and not key.endswith('_secret')
            and not key.endswith('_key')
        }

        with open(filepath, 'w') as f:
            json.dump(config_dict, f, indent=2)

    def __str__(self) -> str:
        """String representation"""
        safe_config = {
            key: value for key, value in self.__dict__.items()
            if not key.endswith('_secret') and not key.endswith('_key')
        }
        return json.dumps(safe_config, indent=2)
