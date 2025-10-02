#!/usr/bin/env python3
"""
Settings Page Component

Handles application settings and configuration.
"""

import streamlit as st

class SettingsPage:
    """Settings page with modular component integration."""
    
    def __init__(self, theme_manager=None, state_manager=None):
        """Initialize with component dependencies."""
        self.theme_manager = theme_manager
        self.state_manager = state_manager
    
    def render(self):
        """Render the settings page."""
        st.markdown("# ⚙️ Settings")
        st.markdown("*Application configuration and preferences*")
        
        # Theme settings
        if self.theme_manager:
            st.markdown("## 🎨 Theme Settings")
            self.theme_manager.render_theme_toggle(location="settings_page")
        
        # Analysis settings
        st.markdown("## 📊 Analysis Settings")
        
        col1, col2 = st.columns(2)
        
        with col1:
            default_max_files = st.number_input(
                "Default Max Files",
                min_value=10,
                max_value=10000,
                value=st.session_state.get('settings_max_files', 1000),
                help="Default maximum number of files to analyze"
            )
            st.session_state.settings_max_files = default_max_files
            
            enable_caching = st.checkbox(
                "Enable Caching",
                value=st.session_state.get('settings_enable_caching', True),
                help="Cache analysis results for faster subsequent runs"
            )
            st.session_state.settings_enable_caching = enable_caching
        
        with col2:
            enable_async = st.checkbox(
                "Enable Async Analysis",
                value=st.session_state.get('settings_enable_async', True),
                help="Use high-performance async analyzer by default"
            )
            st.session_state.settings_enable_async = enable_async
            
            incremental_analysis = st.checkbox(
                "Incremental Analysis",
                value=st.session_state.get('settings_incremental', True),
                help="Only analyze changed files when possible"
            )
            st.session_state.settings_incremental = incremental_analysis
        
        # UI settings
        st.markdown("## 🖥️ UI Settings")
        
        col3, col4 = st.columns(2)
        
        with col3:
            show_animations = st.checkbox(
                "Show Animations",
                value=st.session_state.get('settings_animations', True),
                help="Enable UI animations and transitions"
            )
            st.session_state.settings_animations = show_animations
            
            show_progress = st.checkbox(
                "Detailed Progress",
                value=st.session_state.get('settings_progress', True),
                help="Show detailed progress information during analysis"
            )
            st.session_state.settings_progress = show_progress
        
        with col4:
            auto_refresh = st.checkbox(
                "Auto Refresh Results",
                value=st.session_state.get('settings_auto_refresh', False),
                help="Automatically refresh analysis results"
            )
            st.session_state.settings_auto_refresh = auto_refresh
        
        # Cache settings
        st.markdown("## 💾 Cache Settings")
        
        cache_dir = st.text_input(
            "Cache Directory",
            value=st.session_state.get('settings_cache_dir', '.prompt_engineer_cache'),
            help="Directory for storing analysis cache"
        )
        st.session_state.settings_cache_dir = cache_dir
        
        col5, col6 = st.columns(2)
        
        with col5:
            cache_ttl = st.number_input(
                "Cache TTL (hours)",
                min_value=1,
                max_value=168,
                value=st.session_state.get('settings_cache_ttl', 24),
                help="How long to keep cached results"
            )
            st.session_state.settings_cache_ttl = cache_ttl
        
        with col6:
            if st.button("🗑️ Clear Cache", help="Clear all cached analysis results"):
                st.info("Cache clearing functionality will be implemented")
        
        st.markdown("---")
        
        # Save settings
        col_save, col_reset = st.columns([3, 1])
        
        with col_save:
            if st.button("💾 Save Settings", type="primary", use_container_width=True):
                self._save_settings()
                st.success("✅ Settings saved successfully!")
                st.rerun()
        
        with col_reset:
            if st.button("🔄 Reset", help="Reset to default settings"):
                self._reset_settings()
                st.info("Settings reset to defaults")
                st.rerun()
    
    def _save_settings(self):
        """Save current settings to session state."""
        # This would typically save to a config file
        # For now, we just ensure settings are in session state
        settings_keys = [
            'settings_max_files', 'settings_enable_caching', 'settings_enable_async',
            'settings_incremental', 'settings_animations', 'settings_progress',
            'settings_auto_refresh', 'settings_cache_dir', 'settings_cache_ttl'
        ]
        
        saved_count = 0
        for key in settings_keys:
            if key in st.session_state:
                saved_count += 1
        
        return saved_count > 0
    
    def _reset_settings(self):
        """Reset settings to defaults."""
        defaults = {
            'settings_max_files': 1000,
            'settings_enable_caching': True,
            'settings_enable_async': True,
            'settings_incremental': True,
            'settings_animations': True,
            'settings_progress': True,
            'settings_auto_refresh': False,
            'settings_cache_dir': '.prompt_engineer_cache',
            'settings_cache_ttl': 24
        }
        
        for key, value in defaults.items():
            st.session_state[key] = value