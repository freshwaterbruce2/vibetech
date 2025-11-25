#!/usr/bin/env python3
"""
Configuration Manager

Handles loading and managing configuration from YAML files with environment 
variable overrides and validation.
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, Union, List
from dataclasses import dataclass
import logging

@dataclass
class AnalysisConfig:
    """Configuration for analysis operations."""
    max_files_default: int = 200
    timeout_seconds: int = 30
    enable_caching: bool = True
    cache_ttl_hours: int = 24
    incremental_analysis: bool = True
    ignore_patterns: List[str] = None
    file_extensions: Dict[str, List[str]] = None
    
    def __post_init__(self):
        if self.ignore_patterns is None:
            self.ignore_patterns = [
                'node_modules', '.git', 'dist', 'build', '__pycache__', 
                '.pytest_cache', 'venv', '.venv'
            ]
        
        if self.file_extensions is None:
            self.file_extensions = {
                'code': ['.py', '.js', '.jsx', '.ts', '.tsx', '.go', '.rs', '.java'],
                'config': ['.json', '.yaml', '.yml', '.toml'],
                'docs': ['.md', '.rst', '.txt']
            }

@dataclass 
class SecurityConfig:
    """Configuration for security analysis."""
    enabled: bool = True
    check_secrets: bool = True
    check_eval: bool = True
    check_xss: bool = True
    check_sql_injection: bool = True
    secret_patterns: List[Dict[str, Any]] = None
    severity_weights: Dict[str, float] = None
    
    def __post_init__(self):
        if self.secret_patterns is None:
            self.secret_patterns = [
                {'pattern': 'api[_-]?key', 'severity': 'critical', 'description': 'API key detected'},
                {'pattern': 'password', 'severity': 'high', 'description': 'Password field detected'},
                {'pattern': 'token', 'severity': 'high', 'description': 'Token detected'}
            ]
        
        if self.severity_weights is None:
            self.severity_weights = {
                'critical': 15,
                'high': 3,
                'medium': 1,
                'low': 0.5
            }

@dataclass
class PerformanceConfig:
    """Configuration for performance and async operations."""
    async_enabled: bool = True
    max_workers: Optional[int] = None
    chunk_size: int = 50
    memory_limit_mb: int = 512
    timeout_per_file_ms: int = 5000
    cache_enabled: bool = True
    cache_directory: str = ".prompt_engineer_cache"
    cache_max_size_mb: int = 100
    parallel_processing_enabled: bool = True
    thread_pool_size: int = 4

@dataclass
class UIConfig:
    """Configuration for UI components."""
    theme_default: str = "auto"
    primary_color: str = "#3b82f6"
    success_color: str = "#10b981"
    warning_color: str = "#f59e0b"
    error_color: str = "#ef4444"
    animations_enabled: bool = True
    animations_duration_ms: int = 300
    charts_default_type: str = "interactive"
    export_formats: List[str] = None
    
    def __post_init__(self):
        if self.export_formats is None:
            self.export_formats = ['json', 'markdown', 'html', 'csv']

class ConfigManager:
    """Manages application configuration with YAML loading and environment overrides."""
    
    def __init__(self, config_path: Optional[Union[str, Path]] = None):
        """Initialize configuration manager."""
        self.config_path = self._find_config_file(config_path)
        self._config_data = {}
        self._load_config()
        
        # Create structured config objects
        self.analysis = self._create_analysis_config()
        self.security = self._create_security_config()
        self.performance = self._create_performance_config()
        self.ui = self._create_ui_config()
    
    def _find_config_file(self, config_path: Optional[Union[str, Path]]) -> Path:
        """Find configuration file in standard locations."""
        if config_path:
            path = Path(config_path)
            if path.exists():
                return path
        
        # Search standard locations
        search_paths = [
            Path.cwd() / "config" / "analysis_config.yaml",
            Path.cwd() / "analysis_config.yaml",
            Path(__file__).parent.parent.parent / "config" / "analysis_config.yaml"
        ]
        
        for path in search_paths:
            if path.exists():
                return path
        
        # Return default path if no config found
        return Path.cwd() / "config" / "analysis_config.yaml"
    
    def _load_config(self):
        """Load configuration from YAML file."""
        if not self.config_path.exists():
            logging.warning(f"Config file not found: {self.config_path}. Using defaults.")
            self._config_data = self._get_default_config()
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self._config_data = yaml.safe_load(f) or {}
        except Exception as e:
            logging.error(f"Error loading config file {self.config_path}: {e}")
            self._config_data = self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration when no config file is available."""
        return {
            'analysis': {
                'max_files_default': 200,
                'timeout_seconds': 30,
                'enable_caching': True,
                'incremental_analysis': True
            },
            'performance': {
                'async_enabled': True,
                'chunk_size': 50,
                'cache': {'enabled': True}
            },
            'security': {
                'enabled': True,
                'check_secrets': True
            },
            'ui': {
                'theme': {'default': 'auto'},
                'animations': {'enabled': True}
            }
        }
    
    def _create_analysis_config(self) -> AnalysisConfig:
        """Create analysis configuration from loaded data."""
        analysis_data = self._config_data.get('analysis', {})
        
        return AnalysisConfig(
            max_files_default=self._get_env_or_config('ANALYSIS_MAX_FILES', 
                                                    analysis_data.get('max_files_default'), int, 200),
            timeout_seconds=self._get_env_or_config('ANALYSIS_TIMEOUT', 
                                                   analysis_data.get('timeout_seconds'), int, 30),
            enable_caching=self._get_env_or_config('ANALYSIS_ENABLE_CACHING', 
                                                  analysis_data.get('enable_caching'), bool, True),
            cache_ttl_hours=self._get_env_or_config('ANALYSIS_CACHE_TTL', 
                                                   analysis_data.get('cache_ttl_hours'), int, 24),
            incremental_analysis=self._get_env_or_config('ANALYSIS_INCREMENTAL', 
                                                        analysis_data.get('incremental_analysis'), bool, True),
            ignore_patterns=analysis_data.get('ignore_patterns'),
            file_extensions=analysis_data.get('file_extensions')
        )
    
    def _create_security_config(self) -> SecurityConfig:
        """Create security configuration from loaded data."""
        security_data = self._config_data.get('security', {})
        
        return SecurityConfig(
            enabled=self._get_env_or_config('SECURITY_ENABLED', 
                                          security_data.get('enabled'), bool, True),
            check_secrets=security_data.get('check_secrets', True),
            check_eval=security_data.get('check_eval', True),
            check_xss=security_data.get('check_xss', True),
            check_sql_injection=security_data.get('check_sql_injection', True),
            secret_patterns=security_data.get('secret_patterns'),
            severity_weights=security_data.get('severity_weights')
        )
    
    def _create_performance_config(self) -> PerformanceConfig:
        """Create performance configuration from loaded data."""
        perf_data = self._config_data.get('performance', {})
        cache_data = perf_data.get('cache', {})
        
        return PerformanceConfig(
            async_enabled=self._get_env_or_config('PERFORMANCE_ASYNC', 
                                                 perf_data.get('async_enabled'), bool, True),
            max_workers=self._get_env_or_config('PERFORMANCE_MAX_WORKERS', 
                                               perf_data.get('max_workers'), int, None),
            chunk_size=self._get_env_or_config('PERFORMANCE_CHUNK_SIZE', 
                                              perf_data.get('chunk_size'), int, 50),
            memory_limit_mb=perf_data.get('memory_limit_mb', 512),
            timeout_per_file_ms=perf_data.get('timeout_per_file_ms', 5000),
            cache_enabled=cache_data.get('enabled', True),
            cache_directory=cache_data.get('directory', '.prompt_engineer_cache'),
            cache_max_size_mb=cache_data.get('max_size_mb', 100),
            parallel_processing_enabled=perf_data.get('parallel_processing', {}).get('enabled', True),
            thread_pool_size=perf_data.get('parallel_processing', {}).get('thread_pool_size', 4)
        )
    
    def _create_ui_config(self) -> UIConfig:
        """Create UI configuration from loaded data."""
        ui_data = self._config_data.get('ui', {})
        theme_data = ui_data.get('theme', {})
        animations_data = ui_data.get('animations', {})
        charts_data = ui_data.get('charts', {})
        export_data = ui_data.get('export', {})
        
        return UIConfig(
            theme_default=theme_data.get('default', 'auto'),
            primary_color=theme_data.get('primary_color', '#3b82f6'),
            success_color=theme_data.get('success_color', '#10b981'),
            warning_color=theme_data.get('warning_color', '#f59e0b'),
            error_color=theme_data.get('error_color', '#ef4444'),
            animations_enabled=animations_data.get('enabled', True),
            animations_duration_ms=animations_data.get('duration_ms', 300),
            charts_default_type=charts_data.get('default_type', 'interactive'),
            export_formats=export_data.get('formats', ['json', 'markdown', 'html', 'csv'])
        )
    
    def _get_env_or_config(self, env_key: str, config_value: Any, 
                          value_type: type = str, default: Any = None) -> Any:
        """Get value from environment variable or config with type conversion."""
        env_value = os.getenv(env_key)
        
        if env_value is not None:
            try:
                if value_type == bool:
                    return env_value.lower() in ('true', '1', 'yes', 'on')
                elif value_type == int:
                    return int(env_value)
                elif value_type == float:
                    return float(env_value)
                else:
                    return str(env_value)
            except (ValueError, TypeError):
                logging.warning(f"Invalid environment variable {env_key}={env_value}, using config/default")
        
        return config_value if config_value is not None else default
    
    def get_config_value(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation (e.g., 'analysis.max_files_default')."""
        keys = key_path.split('.')
        value = self._config_data
        
        try:
            for key in keys:
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def update_config_value(self, key_path: str, value: Any):
        """Update configuration value using dot notation."""
        keys = key_path.split('.')
        config = self._config_data
        
        # Navigate to the parent of the target key
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        # Set the value
        config[keys[-1]] = value
    
    def reload_config(self):
        """Reload configuration from file."""
        self._load_config()
        self.analysis = self._create_analysis_config()
        self.security = self._create_security_config()
        self.performance = self._create_performance_config()
        self.ui = self._create_ui_config()
    
    def validate_config(self) -> List[str]:
        """Validate configuration and return list of issues."""
        issues = []
        
        # Validate analysis config
        if self.analysis.max_files_default <= 0:
            issues.append("analysis.max_files_default must be positive")
        
        if self.analysis.timeout_seconds <= 0:
            issues.append("analysis.timeout_seconds must be positive")
        
        # Validate performance config
        if self.performance.chunk_size <= 0:
            issues.append("performance.chunk_size must be positive")
        
        if self.performance.memory_limit_mb <= 0:
            issues.append("performance.memory_limit_mb must be positive")
        
        # Validate cache directory
        try:
            cache_dir = Path(self.performance.cache_directory)
            cache_dir.mkdir(exist_ok=True)
        except Exception as e:
            issues.append(f"Cannot create cache directory: {e}")
        
        return issues
    
    def get_project_specific_config(self, project_type: str) -> Dict[str, Any]:
        """Get project-specific configuration overrides."""
        overrides = self._config_data.get('project_overrides', {})
        return overrides.get(project_type, {})

# Global config instance
_config_manager = None

def get_config_manager() -> ConfigManager:
    """Get global configuration manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager

def reload_config():
    """Reload global configuration."""
    global _config_manager
    if _config_manager:
        _config_manager.reload_config()
    else:
        _config_manager = ConfigManager()