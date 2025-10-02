"""
Configuration management module for prompt-engineer.

Provides centralized configuration handling with:
- Environment variable overrides
- User config overlay
- Runtime modification
- Validation
"""

from .config_manager import ConfigManager, ConfigSchema

# Global configuration instance
config_manager = ConfigManager()

# Convenience functions
def get_config() -> ConfigSchema:
    """Get the current configuration."""
    return config_manager.config

def get(path: str, default=None):
    """Get configuration value by dot-notation path."""
    return config_manager.get(path, default)

def set(path: str, value):
    """Set configuration value at runtime."""
    config_manager.set(path, value)

def reload():
    """Reload configuration from files."""
    config_manager.reload()

__all__ = [
    'ConfigManager',
    'ConfigSchema',
    'config_manager',
    'get_config',
    'get',
    'set',
    'reload'
]