"""
State management utilities for the Streamlit UI application.

This module provides a centralized StateManager class to handle all session state
variables, persistence, and state operations for the Prompt Engineer application.
"""

import json
import streamlit as st
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StateManager:
    """
    Centralized state management for Streamlit session state.
    
    This class provides methods to initialize, get, set, clear, save, and load
    session state variables with proper defaults and persistence functionality.
    """
    
    # Default values for session state variables
    DEFAULT_VALUES = {
        'current_page': 'analysis',
        'theme_preference': 'auto',
        'current_theme': 'light',
        'project_mode': 'existing',
        'project_path': '',
        'analysis_result': None,
        'generated_prompts': {},
        'recent_projects': [],
        'new_project_requirements': None,
        'history_manager': None,
        'selected_project_for_history': None,
        'user_preferences': {
            'max_files_default': 1000,
            'auto_save_analysis': True,
            'show_advanced_options': False,
            'preferred_output_format': 'json'
        }
    }
    
    # Files for persistent storage
    PERSISTENCE_FILES = {
        'recent_projects': 'recent_projects.json',
        'theme_preference': 'theme_preference.json',
        'user_preferences': 'user_preferences.json',
        'session_state_backup': 'session_state_backup.json'
    }
    
    def __init__(self):
        """Initialize the StateManager."""
        self.initialized = False
        
    def initialize_session_state(self) -> None:
        """
        Initialize all session state variables with their default values.
        This should be called once at the start of the Streamlit application.
        """
        try:
            # Initialize basic state variables
            for key, default_value in self.DEFAULT_VALUES.items():
                if key not in st.session_state:
                    if key == 'recent_projects':
                        st.session_state[key] = self._load_recent_projects()
                    elif key == 'theme_preference':
                        st.session_state[key] = self._load_theme_preference()
                    elif key == 'user_preferences':
                        st.session_state[key] = self._load_user_preferences()
                    else:
                        st.session_state[key] = default_value
            
            # Set current theme based on preference
            if 'current_theme' not in st.session_state or st.session_state.theme_preference == 'auto':
                st.session_state.current_theme = self._get_effective_theme()
            
            self.initialized = True
            logger.info("Session state initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing session state: {e}")
            # Fallback initialization with basic defaults
            for key, default_value in self.DEFAULT_VALUES.items():
                if key not in st.session_state:
                    st.session_state[key] = default_value
    
    def get_session_state(self, key: str, default: Any = None) -> Any:
        """
        Get a value from session state.
        
        Args:
            key: The session state key
            default: Default value if key doesn't exist
            
        Returns:
            The session state value or default
        """
        try:
            return st.session_state.get(key, default)
        except Exception as e:
            logger.error(f"Error getting session state '{key}': {e}")
            return default
    
    def set_session_state(self, key: str, value: Any) -> bool:
        """
        Set a value in session state.
        
        Args:
            key: The session state key
            value: The value to set
            
        Returns:
            True if successful, False otherwise
        """
        try:
            st.session_state[key] = value
            
            # Auto-persist certain values
            if key == 'theme_preference':
                self._save_theme_preference(value)
                st.session_state.current_theme = self._get_effective_theme()
            elif key == 'recent_projects':
                self._save_recent_projects(value)
            elif key == 'user_preferences':
                self._save_user_preferences(value)
            
            return True
        except Exception as e:
            logger.error(f"Error setting session state '{key}': {e}")
            return False
    
    def clear_session_state(self, keys: Optional[Union[str, List[str]]] = None) -> bool:
        """
        Clear session state variables.
        
        Args:
            keys: Single key or list of keys to clear. If None, clears all.
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if keys is None:
                # Clear all session state
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                self.initialize_session_state()
            else:
                # Clear specific keys
                if isinstance(keys, str):
                    keys = [keys]
                
                for key in keys:
                    if key in st.session_state:
                        del st.session_state[key]
                        # Reset to default if available
                        if key in self.DEFAULT_VALUES:
                            st.session_state[key] = self.DEFAULT_VALUES[key]
            
            return True
        except Exception as e:
            logger.error(f"Error clearing session state: {e}")
            return False
    
    def save_state_to_file(self, filename: Optional[str] = None) -> bool:
        """
        Save current session state to a file.
        
        Args:
            filename: Custom filename for backup. Uses default if None.
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if filename is None:
                filename = self.PERSISTENCE_FILES['session_state_backup']
            
            # Create serializable copy of session state
            serializable_state = {}
            for key, value in st.session_state.items():
                try:
                    # Test if value is JSON serializable
                    json.dumps(value)
                    serializable_state[key] = value
                except (TypeError, ValueError):
                    # Skip non-serializable values
                    logger.warning(f"Skipping non-serializable session state key: {key}")
                    continue
            
            # Add metadata
            serializable_state['_metadata'] = {
                'saved_at': datetime.now().isoformat(),
                'version': '1.0'
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(serializable_state, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Session state saved to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving session state to file: {e}")
            return False
    
    def load_state_from_file(self, filename: Optional[str] = None) -> bool:
        """
        Load session state from a file.
        
        Args:
            filename: Custom filename to load from. Uses default if None.
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if filename is None:
                filename = self.PERSISTENCE_FILES['session_state_backup']
            
            file_path = Path(filename)
            if not file_path.exists():
                logger.warning(f"Session state file {filename} not found")
                return False
            
            with open(file_path, 'r', encoding='utf-8') as f:
                saved_state = json.load(f)
            
            # Remove metadata
            saved_state.pop('_metadata', None)
            
            # Update session state with saved values
            for key, value in saved_state.items():
                st.session_state[key] = value
            
            # Reinitialize any missing defaults
            self.initialize_session_state()
            
            logger.info(f"Session state loaded from {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Error loading session state from file: {e}")
            return False
    
    def add_to_recent_projects(self, project_path: str) -> bool:
        """
        Add a project to the recent projects list.
        
        Args:
            project_path: Path to the project
            
        Returns:
            True if successful, False otherwise
        """
        try:
            recent_projects = st.session_state.get('recent_projects', [])
            
            # Remove if already exists
            if project_path in recent_projects:
                recent_projects.remove(project_path)
            
            # Add to beginning and limit to 10 items
            recent_projects.insert(0, project_path)
            recent_projects = recent_projects[:10]
            
            # Update session state and persist
            st.session_state.recent_projects = recent_projects
            self._save_recent_projects(recent_projects)
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding to recent projects: {e}")
            return False
    
    def get_state_summary(self) -> Dict[str, Any]:
        """
        Get a summary of current session state.
        
        Returns:
            Dictionary with state summary information
        """
        try:
            summary = {
                'initialized': self.initialized,
                'total_keys': len(st.session_state),
                'current_page': st.session_state.get('current_page', 'unknown'),
                'theme_preference': st.session_state.get('theme_preference', 'unknown'),
                'has_analysis_result': st.session_state.get('analysis_result') is not None,
                'recent_projects_count': len(st.session_state.get('recent_projects', [])),
                'generated_prompts_count': len(st.session_state.get('generated_prompts', {}))
            }
            return summary
        except Exception as e:
            logger.error(f"Error getting state summary: {e}")
            return {'error': str(e)}
    
    # Private helper methods
    
    def _load_recent_projects(self) -> List[str]:
        """Load recent projects from file."""
        try:
            recent_file = Path(self.PERSISTENCE_FILES['recent_projects'])
            if recent_file.exists():
                with open(recent_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading recent projects: {e}")
        return []
    
    def _save_recent_projects(self, projects: List[str]) -> None:
        """Save recent projects to file."""
        try:
            with open(self.PERSISTENCE_FILES['recent_projects'], 'w', encoding='utf-8') as f:
                json.dump(projects[-10:], f)  # Keep only last 10
        except Exception as e:
            logger.error(f"Error saving recent projects: {e}")
    
    def _load_theme_preference(self) -> str:
        """Load theme preference from file or default to auto."""
        try:
            theme_file = Path(self.PERSISTENCE_FILES['theme_preference'])
            if theme_file.exists():
                with open(theme_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('theme', 'auto')
        except Exception as e:
            logger.error(f"Error loading theme preference: {e}")
        return 'auto'
    
    def _save_theme_preference(self, theme: str) -> None:
        """Save theme preference to file."""
        try:
            with open(self.PERSISTENCE_FILES['theme_preference'], 'w', encoding='utf-8') as f:
                json.dump({'theme': theme}, f)
        except Exception as e:
            logger.error(f"Error saving theme preference: {e}")
    
    def _load_user_preferences(self) -> Dict[str, Any]:
        """Load user preferences from file."""
        try:
            prefs_file = Path(self.PERSISTENCE_FILES['user_preferences'])
            if prefs_file.exists():
                with open(prefs_file, 'r', encoding='utf-8') as f:
                    saved_prefs = json.load(f)
                    # Merge with defaults
                    merged_prefs = self.DEFAULT_VALUES['user_preferences'].copy()
                    merged_prefs.update(saved_prefs)
                    return merged_prefs
        except Exception as e:
            logger.error(f"Error loading user preferences: {e}")
        return self.DEFAULT_VALUES['user_preferences'].copy()
    
    def _save_user_preferences(self, preferences: Dict[str, Any]) -> None:
        """Save user preferences to file."""
        try:
            with open(self.PERSISTENCE_FILES['user_preferences'], 'w', encoding='utf-8') as f:
                json.dump(preferences, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving user preferences: {e}")
    
    def _detect_system_theme(self) -> str:
        """
        Detect system theme preference.
        
        Returns:
            'light' or 'dark' based on time of day (simplified implementation)
        """
        try:
            current_hour = datetime.now().hour
            # Use light theme during day hours (6 AM to 6 PM)
            if 6 <= current_hour <= 18:
                return 'light'
            else:
                return 'dark'
        except Exception as e:
            logger.error(f"Error detecting system theme: {e}")
            return 'light'  # Default fallback
    
    def _get_effective_theme(self) -> str:
        """Get the effective theme based on user preference and system detection."""
        try:
            user_preference = st.session_state.get('theme_preference', 'auto')
            if user_preference == 'auto':
                return self._detect_system_theme()
            return user_preference
        except Exception as e:
            logger.error(f"Error getting effective theme: {e}")
            return 'light'  # Default fallback


# Global state manager instance
_state_manager = None

def get_state_manager() -> StateManager:
    """
    Get the global StateManager instance.
    
    Returns:
        StateManager instance
    """
    global _state_manager
    if _state_manager is None:
        _state_manager = StateManager()
    return _state_manager


# Convenience functions for common operations
def initialize_session_state() -> None:
    """Initialize session state using the global state manager."""
    get_state_manager().initialize_session_state()

def get_session_state(key: str, default: Any = None) -> Any:
    """Get a session state value using the global state manager."""
    return get_state_manager().get_session_state(key, default)

def set_session_state(key: str, value: Any) -> bool:
    """Set a session state value using the global state manager."""
    return get_state_manager().set_session_state(key, value)

def clear_session_state(keys: Optional[Union[str, List[str]]] = None) -> bool:
    """Clear session state using the global state manager."""
    return get_state_manager().clear_session_state(keys)

def add_to_recent_projects(project_path: str) -> bool:
    """Add to recent projects using the global state manager."""
    return get_state_manager().add_to_recent_projects(project_path)