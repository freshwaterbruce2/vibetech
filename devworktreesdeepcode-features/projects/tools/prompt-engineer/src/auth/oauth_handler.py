#!/usr/bin/env python3
"""
OAuth2/SSO Authentication Handler

Provides secure authentication with JWT tokens, role-based access control,
and integration with popular OAuth2 providers.
"""

import os
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
import asyncio
import json
from pathlib import Path

try:
    from passlib.context import CryptContext
    from jose import JWTError, jwt as jose_jwt
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("Warning: Cryptographic dependencies not available. Authentication features limited.")

class UserRole(Enum):
    """User roles for access control."""
    ADMIN = "admin"
    PREMIUM = "premium"
    STANDARD = "standard"
    READONLY = "readonly"

class AuthProvider(Enum):
    """Supported authentication providers."""
    LOCAL = "local"
    GITHUB = "github"
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    OAUTH_GENERIC = "oauth_generic"

@dataclass
class User:
    """User model with authentication details."""
    id: str
    email: str
    name: str
    role: UserRole
    provider: AuthProvider
    created_at: datetime
    last_login: Optional[datetime] = None
    metadata: Dict[str, Any] = None
    is_active: bool = True
    api_quota: int = 100  # Requests per hour
    features: List[str] = None  # Enabled features

@dataclass
class AuthToken:
    """Authentication token with metadata."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600  # 1 hour
    refresh_token: Optional[str] = None
    scope: List[str] = None

class AuthenticationError(Exception):
    """Authentication-related errors."""
    pass

class AuthorizationError(Exception):
    """Authorization-related errors."""
    pass

class OAuthHandler:
    """
    Comprehensive OAuth2/SSO authentication handler.
    
    Features:
    - JWT token generation and validation
    - Multiple OAuth2 provider support
    - Role-based access control
    - API key management
    - Session management
    - Rate limiting integration
    """
    
    def __init__(self,
                 secret_key: Optional[str] = None,
                 algorithm: str = "HS256",
                 token_expire_minutes: int = 60,
                 refresh_expire_days: int = 7):
        """
        Initialize OAuth handler.
        
        Args:
            secret_key: Secret key for JWT signing (auto-generated if None)
            algorithm: JWT signing algorithm
            token_expire_minutes: Access token expiration time
            refresh_expire_days: Refresh token expiration time
        """
        self.secret_key = secret_key or os.getenv('JWT_SECRET_KEY') or secrets.token_urlsafe(32)
        self.algorithm = algorithm
        self.token_expire_minutes = token_expire_minutes
        self.refresh_expire_days = refresh_expire_days
        
        # Initialize password hashing
        if CRYPTO_AVAILABLE:
            self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        else:
            self.pwd_context = None
            
        # In-memory user store (use database in production)
        self.users: Dict[str, User] = {}
        self.api_keys: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # OAuth2 provider configurations
        self.oauth_configs = self._load_oauth_configs()
        
        # Initialize with demo users
        self._create_demo_users()
    
    def _load_oauth_configs(self) -> Dict[str, Dict[str, str]]:
        """Load OAuth2 provider configurations from environment."""
        return {
            'github': {
                'client_id': os.getenv('GITHUB_CLIENT_ID', ''),
                'client_secret': os.getenv('GITHUB_CLIENT_SECRET', ''),
                'authorize_url': 'https://github.com/login/oauth/authorize',
                'token_url': 'https://github.com/login/oauth/access_token',
                'user_url': 'https://api.github.com/user',
                'scope': 'user:email'
            },
            'google': {
                'client_id': os.getenv('GOOGLE_CLIENT_ID', ''),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', ''),
                'authorize_url': 'https://accounts.google.com/o/oauth2/v2/auth',
                'token_url': 'https://oauth2.googleapis.com/token',
                'user_url': 'https://www.googleapis.com/oauth2/v2/userinfo',
                'scope': 'openid email profile'
            },
            'microsoft': {
                'client_id': os.getenv('MICROSOFT_CLIENT_ID', ''),
                'client_secret': os.getenv('MICROSOFT_CLIENT_SECRET', ''),
                'authorize_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                'token_url': 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                'user_url': 'https://graph.microsoft.com/v1.0/me',
                'scope': 'openid email profile'
            }
        }
    
    def _create_demo_users(self):
        """Create demo users for testing."""
        demo_users = [
            {
                'id': 'admin-001',
                'email': 'admin@example.com',
                'name': 'Admin User',
                'password': 'admin123',
                'role': UserRole.ADMIN,
                'api_quota': 1000
            },
            {
                'id': 'user-001', 
                'email': 'user@example.com',
                'name': 'Standard User',
                'password': 'user123',
                'role': UserRole.STANDARD,
                'api_quota': 100
            }
        ]
        
        for user_data in demo_users:
            password = user_data.pop('password')
            user = User(
                **user_data,
                provider=AuthProvider.LOCAL,
                created_at=datetime.utcnow(),
                features=['analysis', 'export'] if user_data['role'] == UserRole.ADMIN else ['analysis']
            )
            self.users[user.id] = user
            
            # Create corresponding API key
            api_key = self.generate_api_key(user.id)
            self.api_keys[api_key] = {
                'user_id': user.id,
                'name': f"{user.name} Default Key",
                'created_at': datetime.utcnow().isoformat(),
                'requests_per_hour': user.api_quota
            }
    
    def hash_password(self, password: str) -> str:
        """Hash a password for storage."""
        if not self.pwd_context:
            # Fallback simple hash (NOT secure for production)
            return hashlib.sha256(password.encode()).hexdigest()
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        if not self.pwd_context:
            # Fallback comparison
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, 
                          user: User, 
                          expires_delta: Optional[timedelta] = None) -> AuthToken:
        """Create JWT access token for user."""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.token_expire_minutes)
        
        # Create token payload
        token_data = {
            'sub': user.id,
            'email': user.email,
            'role': user.role.value,
            'provider': user.provider.value,
            'exp': expire,
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        # Generate tokens
        if CRYPTO_AVAILABLE:
            access_token = jose_jwt.encode(token_data, self.secret_key, algorithm=self.algorithm)
        else:
            # Fallback (not secure)
            access_token = jwt.encode(token_data, self.secret_key, algorithm=self.algorithm)
        
        # Create refresh token
        refresh_token_data = {
            'sub': user.id,
            'exp': datetime.utcnow() + timedelta(days=self.refresh_expire_days),
            'type': 'refresh'
        }
        
        if CRYPTO_AVAILABLE:
            refresh_token = jose_jwt.encode(refresh_token_data, self.secret_key, algorithm=self.algorithm)
        else:
            refresh_token = jwt.encode(refresh_token_data, self.secret_key, algorithm=self.algorithm)
        
        return AuthToken(
            access_token=access_token,
            expires_in=int(expires_delta.total_seconds()) if expires_delta else self.token_expire_minutes * 60,
            refresh_token=refresh_token,
            scope=['analysis', 'export'] if user.role in [UserRole.ADMIN, UserRole.PREMIUM] else ['analysis']
        )
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token."""
        try:
            if CRYPTO_AVAILABLE:
                payload = jose_jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            else:
                payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check token type
            if payload.get('type') != 'access':
                return None
            
            return payload
            
        except (JWTError, jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[AuthToken]:
        """Refresh access token using refresh token."""
        try:
            if CRYPTO_AVAILABLE:
                payload = jose_jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            else:
                payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get('type') != 'refresh':
                return None
            
            user_id = payload.get('sub')
            user = self.users.get(user_id)
            
            if not user or not user.is_active:
                return None
            
            # Create new access token
            return self.create_access_token(user)
            
        except (JWTError, jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        # Find user by email
        user = None
        for u in self.users.values():
            if u.email == email:
                user = u
                break
        
        if not user or not user.is_active:
            return None
        
        # For demo purposes, we'll allow simple password check
        # In production, store and verify hashed passwords
        demo_passwords = {
            'admin@example.com': 'admin123',
            'user@example.com': 'user123'
        }
        
        if email in demo_passwords and password == demo_passwords[email]:
            user.last_login = datetime.utcnow()
            return user
        
        return None
    
    def get_user_by_token(self, token: str) -> Optional[User]:
        """Get user from access token."""
        payload = self.verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get('sub')
        return self.users.get(user_id)
    
    def generate_api_key(self, user_id: str) -> str:
        """Generate API key for user."""
        return f"pe_{secrets.token_urlsafe(32)}"
    
    def verify_api_key(self, api_key: str) -> Optional[User]:
        """Verify API key and return associated user."""
        api_info = self.api_keys.get(api_key)
        if not api_info:
            return None
        
        user_id = api_info['user_id']
        return self.users.get(user_id)
    
    def check_permission(self, user: User, resource: str, action: str) -> bool:
        """Check if user has permission for resource/action."""
        # Role-based permissions
        permissions = {
            UserRole.ADMIN: ['*'],  # Admin has all permissions
            UserRole.PREMIUM: ['analysis.*', 'export.*', 'cache.read'],
            UserRole.STANDARD: ['analysis.read', 'analysis.write', 'export.read'],
            UserRole.READONLY: ['analysis.read']
        }
        
        user_permissions = permissions.get(user.role, [])
        
        # Check wildcard permissions
        if '*' in user_permissions:
            return True
        
        # Check specific permissions
        permission_needed = f"{resource}.{action}"
        if permission_needed in user_permissions:
            return True
        
        # Check resource-level wildcards
        resource_wildcard = f"{resource}.*"
        if resource_wildcard in user_permissions:
            return True
        
        return False
    
    def get_oauth_authorize_url(self, provider: str, redirect_uri: str, state: str) -> str:
        """Get OAuth2 authorization URL for provider."""
        config = self.oauth_configs.get(provider)
        if not config or not config['client_id']:
            raise AuthenticationError(f"OAuth provider {provider} not configured")
        
        params = {
            'client_id': config['client_id'],
            'redirect_uri': redirect_uri,
            'scope': config['scope'],
            'state': state,
            'response_type': 'code'
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{config['authorize_url']}?{query_string}"
    
    async def handle_oauth_callback(self, 
                                  provider: str, 
                                  code: str, 
                                  redirect_uri: str) -> Optional[AuthToken]:
        """Handle OAuth2 callback and create/login user."""
        config = self.oauth_configs.get(provider)
        if not config:
            raise AuthenticationError(f"OAuth provider {provider} not supported")
        
        # Exchange code for access token
        # This is a simplified version - implement actual HTTP calls
        # For now, create a demo OAuth user
        
        oauth_user_id = f"oauth_{provider}_{secrets.token_urlsafe(8)}"
        oauth_user = User(
            id=oauth_user_id,
            email=f"oauth_{provider}@example.com",
            name=f"OAuth {provider.title()} User",
            role=UserRole.STANDARD,
            provider=AuthProvider(provider),
            created_at=datetime.utcnow(),
            features=['analysis']
        )
        
        self.users[oauth_user_id] = oauth_user
        return self.create_access_token(oauth_user)
    
    def create_session(self, user: User, session_data: Dict[str, Any] = None) -> str:
        """Create user session."""
        session_id = secrets.token_urlsafe(32)
        
        self.active_sessions[session_id] = {
            'user_id': user.id,
            'created_at': datetime.utcnow().isoformat(),
            'last_activity': datetime.utcnow().isoformat(),
            'data': session_data or {}
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        session = self.active_sessions.get(session_id)
        if session:
            # Update last activity
            session['last_activity'] = datetime.utcnow().isoformat()
            return session
        return None
    
    def invalidate_session(self, session_id: str):
        """Invalidate user session."""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user usage statistics."""
        user = self.users.get(user_id)
        if not user:
            return {}
        
        # Count user's API keys
        api_key_count = sum(1 for key_info in self.api_keys.values() 
                           if key_info['user_id'] == user_id)
        
        return {
            'user_id': user_id,
            'email': user.email,
            'role': user.role.value,
            'api_quota': user.api_quota,
            'api_keys': api_key_count,
            'features': user.features or [],
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'is_active': user.is_active
        }
    
    def export_users_config(self) -> Dict[str, Any]:
        """Export user configuration for backup."""
        return {
            'users': {
                user_id: {
                    'email': user.email,
                    'name': user.name,
                    'role': user.role.value,
                    'provider': user.provider.value,
                    'created_at': user.created_at.isoformat(),
                    'is_active': user.is_active,
                    'api_quota': user.api_quota,
                    'features': user.features or []
                }
                for user_id, user in self.users.items()
            },
            'api_keys': {
                key: {
                    'user_id': info['user_id'],
                    'name': info['name'],
                    'created_at': info['created_at'],
                    'requests_per_hour': info['requests_per_hour']
                }
                for key, info in self.api_keys.items()
            }
        }

# Authentication middleware for FastAPI
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

class AuthMiddleware:
    """Authentication middleware for FastAPI."""
    
    def __init__(self, oauth_handler: OAuthHandler):
        self.oauth_handler = oauth_handler
        self.security = HTTPBearer(auto_error=False)
    
    async def get_current_user(self, 
                             request: Request,
                             credentials: Optional[HTTPAuthorizationCredentials] = None) -> Optional[User]:
        """Get current authenticated user."""
        if not credentials:
            return None
        
        # Try JWT token first
        user = self.oauth_handler.get_user_by_token(credentials.credentials)
        if user:
            return user
        
        # Try API key
        user = self.oauth_handler.verify_api_key(credentials.credentials)
        if user:
            return user
        
        return None
    
    async def require_auth(self, 
                         request: Request,
                         credentials: HTTPAuthorizationCredentials) -> User:
        """Require authentication (raise exception if not authenticated)."""
        user = await self.get_current_user(request, credentials)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    
    async def require_permission(self, 
                               user: User, 
                               resource: str, 
                               action: str) -> bool:
        """Require specific permission (raise exception if not authorized)."""
        if not self.oauth_handler.check_permission(user, resource, action):
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions for {resource}.{action}"
            )
        return True