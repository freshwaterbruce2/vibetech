import yaml
from pathlib import Path
from typing import Dict, Any, Optional, List
import os
from dataclasses import dataclass
import logging

@dataclass
class ConfigSchema:
    """Type-safe configuration schema."""
    analysis: Dict[str, Any]
    security: Dict[str, Any]
    performance: Dict[str, Any]
    ui: Dict[str, Any]
    features: Dict[str, Any]
    logging: Dict[str, Any]

class ConfigManager:
    """
    Advanced configuration management with:
    - Environment variable override
    - User config overlay
    - Runtime modification
    - Validation
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or self._find_config_file()
        self._config = self._load_config()
        self._setup_logging()
        
    def _find_config_file(self) -> Path:
        """Find configuration file in standard locations."""
        search_paths = [
            Path.cwd() / 'config.yaml',
            Path.cwd() / 'config' / 'config.yaml',
            Path.home() / '.prompt_engineer' / 'config.yaml',
            Path(__file__).parent / 'default_config.yaml'
        ]
        
        for path in search_paths:
            if path.exists():
                return path
        
        # Fallback to default
        return Path(__file__).parent / 'default_config.yaml'
    
    def _load_config(self) -> ConfigSchema:
        """Load and merge configurations with precedence."""
        # Load default config
        default_path = Path(__file__).parent / 'default_config.yaml'
        with open(default_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Overlay user config if exists
        if self.config_path != default_path and self.config_path.exists():
            with open(self.config_path, 'r') as f:
                user_config = yaml.safe_load(f)
                config = self._deep_merge(config, user_config)
        
        # Override with environment variables
        config = self._apply_env_overrides(config)
        
        # Validate and return
        return self._validate_config(config)
    
    def _deep_merge(self, base: Dict, overlay: Dict) -> Dict:
        """Deep merge two dictionaries."""
        result = base.copy()
        
        for key, value in overlay.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        
        return result
    
    def _apply_env_overrides(self, config: Dict) -> Dict:
        """Apply environment variable overrides (PROMPT_ENGINEER_*)."""
        for key, value in os.environ.items():
            if key.startswith('PROMPT_ENGINEER_'):
                config_path = key[16:].lower().split('__')
                self._set_nested(config, config_path, value)
        
        return config
    
    def _set_nested(self, dict_obj: Dict, path: List[str], value: Any):
        """Set nested dictionary value from path."""
        for key in path[:-1]:
            dict_obj = dict_obj.setdefault(key, {})
        dict_obj[path[-1]] = value
    
    def _validate_config(self, config: Dict) -> ConfigSchema:
        """Validate configuration against schema."""
        # Add validation logic here
        return ConfigSchema(**config)
    
    def _setup_logging(self):
        """Configure logging based on config."""
        log_config = self._config.logging
        
        # Create logs directory if it doesn't exist
        log_file = Path(log_config['file'])
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=getattr(logging, log_config['level']),
            format=log_config['format'],
            handlers=[
                logging.FileHandler(log_config['file']),
                logging.StreamHandler()
            ]
        )
    
    def get(self, path: str, default: Any = None) -> Any:
        """Get configuration value by dot-notation path."""
        keys = path.split('.')
        value = self._config.__dict__
        
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                value = getattr(value, key, None)
            
            if value is None:
                return default
        
        return value
    
    def set(self, path: str, value: Any):
        """Set configuration value at runtime."""
        keys = path.split('.')
        target = self._config.__dict__
        
        for key in keys[:-1]:
            if key not in target:
                target[key] = {}
            target = target[key]
        
        target[keys[-1]] = value
    
    def reload(self):
        """Reload configuration from files."""
        self._config = self._load_config()
        self._setup_logging()
    
    def save_user_config(self, user_config_path: Optional[str] = None):
        """Save current configuration as user config."""
        if not user_config_path:
            user_config_path = Path.home() / '.prompt_engineer' / 'config.yaml'
        
        user_config_path = Path(user_config_path)
        user_config_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert config to dict for serialization
        config_dict = {
            'analysis': self._config.analysis,
            'security': self._config.security,
            'performance': self._config.performance,
            'ui': self._config.ui,
            'features': self._config.features,
            'logging': self._config.logging
        }
        
        with open(user_config_path, 'w') as f:
            yaml.dump(config_dict, f, default_flow_style=False, indent=2)
    
    @property
    def config(self) -> ConfigSchema:
        """Get the current configuration."""
        return self._config