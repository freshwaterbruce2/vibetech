"""
API data loader with support for REST APIs, pagination, and authentication.
"""

import pandas as pd
import requests
import json
from typing import Optional, Dict, Any, List, Union
from time import sleep
from .base import DataLoader
from ..core.exceptions import DataLoadException


class APILoader(DataLoader):
    """Loader for REST APIs with authentication and pagination support."""

    def __init__(self, config: Any):
        """Initialize API loader with configuration."""
        super().__init__(config)
        self.session = requests.Session()
        self._setup_session()

    def _setup_session(self):
        """Set up requests session with headers and authentication."""
        params = self.config.connection_params

        # Set headers
        headers = params.get('headers', {})
        headers.setdefault('Content-Type', 'application/json')
        headers.setdefault('Accept', 'application/json')
        self.session.headers.update(headers)

        # Set authentication
        auth_type = params.get('auth_type', 'none').lower()

        if auth_type == 'bearer':
            token = params.get('token')
            if token:
                self.session.headers['Authorization'] = f'Bearer {token}'
        elif auth_type == 'api_key':
            api_key = params.get('api_key')
            key_header = params.get('api_key_header', 'X-API-Key')
            if api_key:
                self.session.headers[key_header] = api_key
        elif auth_type == 'basic':
            username = params.get('username')
            password = params.get('password')
            if username and password:
                self.session.auth = (username, password)

        # Set timeout
        self.timeout = params.get('timeout', self.config.timeout)

    def load(
        self,
        endpoint: Optional[str] = None,
        method: str = 'GET',
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        paginate: bool = True,
        max_pages: Optional[int] = None,
        **kwargs
    ) -> pd.DataFrame:
        """
        Load data from API endpoint.

        Args:
            endpoint: API endpoint URL
            method: HTTP method (GET, POST, etc.)
            params: Query parameters
            data: Request body data
            paginate: Whether to handle pagination
            max_pages: Maximum number of pages to retrieve
            **kwargs: Additional request parameters

        Returns:
            Loaded DataFrame

        Raises:
            DataLoadException: If API request fails
        """
        endpoint = endpoint or self.config.connection_params.get('endpoint')
        if not endpoint:
            raise DataLoadException("No API endpoint specified")

        # Handle base URL
        base_url = self.config.connection_params.get('base_url', '')
        if base_url and not endpoint.startswith('http'):
            endpoint = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"

        self.logger.info(f"Loading data from API: {endpoint}")

        try:
            if paginate and self.config.connection_params.get('pagination'):
                result = self._load_paginated(
                    endpoint, method, params, data, max_pages, **kwargs
                )
            else:
                result = self._load_single(
                    endpoint, method, params, data, **kwargs
                )

            # Convert to DataFrame
            if isinstance(result, list):
                df = pd.DataFrame(result)
            elif isinstance(result, dict):
                # Try to find data array in response
                data_keys = ['data', 'results', 'items', 'records']
                for key in data_keys:
                    if key in result and isinstance(result[key], list):
                        df = pd.DataFrame(result[key])
                        break
                else:
                    # Treat entire dict as single row
                    df = pd.DataFrame([result])
            else:
                raise DataLoadException(f"Unexpected response type: {type(result)}")

            self.logger.info(f"Loaded {len(df)} rows from API")
            return df

        except requests.exceptions.RequestException as e:
            raise DataLoadException(f"API request failed: {e}")
        except Exception as e:
            raise DataLoadException(f"Failed to process API response: {e}")

    def _load_single(
        self,
        endpoint: str,
        method: str,
        params: Optional[Dict[str, Any]],
        data: Optional[Dict[str, Any]],
        **kwargs
    ) -> Any:
        """Load single page from API."""
        response = self._make_request(endpoint, method, params, data, **kwargs)
        return response.json()

    def _load_paginated(
        self,
        endpoint: str,
        method: str,
        params: Optional[Dict[str, Any]],
        data: Optional[Dict[str, Any]],
        max_pages: Optional[int],
        **kwargs
    ) -> List[Any]:
        """Load multiple pages from paginated API."""
        pagination_config = self.config.connection_params.get('pagination', {})
        page_param = pagination_config.get('page_param', 'page')
        size_param = pagination_config.get('size_param', 'page_size')
        page_size = pagination_config.get('page_size', 100)
        start_page = pagination_config.get('start_page', 1)
        data_key = pagination_config.get('data_key', 'data')

        params = params or {}
        params[size_param] = page_size

        all_data = []
        page = start_page
        pages_loaded = 0

        while True:
            # Set page parameter
            params[page_param] = page

            # Make request
            response = self._make_request(endpoint, method, params, data, **kwargs)
            response_data = response.json()

            # Extract data from response
            if isinstance(response_data, list):
                page_data = response_data
            elif isinstance(response_data, dict):
                page_data = response_data.get(data_key, [])
            else:
                break

            if not page_data:
                break

            all_data.extend(page_data)
            pages_loaded += 1

            self.logger.debug(f"Loaded page {page}: {len(page_data)} records")

            # Check if we've reached max pages
            if max_pages and pages_loaded >= max_pages:
                break

            # Check for next page
            if isinstance(response_data, dict):
                # Look for pagination metadata
                has_next = (
                    response_data.get('has_next') or
                    response_data.get('hasNext') or
                    response_data.get('next') is not None
                )
                if not has_next:
                    break

            # Rate limiting
            if pagination_config.get('rate_limit_delay'):
                sleep(pagination_config['rate_limit_delay'])

            page += 1

        self.logger.info(f"Loaded {pages_loaded} pages, {len(all_data)} total records")
        return all_data

    def _make_request(
        self,
        endpoint: str,
        method: str,
        params: Optional[Dict[str, Any]],
        data: Optional[Dict[str, Any]],
        **kwargs
    ) -> requests.Response:
        """Make HTTP request with retry logic."""
        def _request():
            response = self.session.request(
                method=method,
                url=endpoint,
                params=params,
                json=data,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response

        return self._handle_retry(_request)

    def load_multiple_endpoints(
        self,
        endpoints: List[str],
        combine: bool = True,
        **kwargs
    ) -> Union[pd.DataFrame, Dict[str, pd.DataFrame]]:
        """
        Load data from multiple API endpoints.

        Args:
            endpoints: List of endpoint URLs
            combine: Whether to combine into single DataFrame
            **kwargs: Parameters for load method

        Returns:
            Combined DataFrame or dictionary of DataFrames
        """
        results = {}

        for endpoint in endpoints:
            try:
                df = self.load(endpoint=endpoint, **kwargs)
                # Use last part of endpoint as key
                key = endpoint.split('/')[-1] or 'data'
                results[key] = df
                self.logger.info(f"Loaded {len(df)} rows from {endpoint}")
            except Exception as e:
                self.logger.error(f"Failed to load {endpoint}: {e}")
                if not self.config.connection_params.get('skip_errors', False):
                    raise

        if combine and results:
            # Combine all DataFrames
            combined = pd.concat(results.values(), ignore_index=True)
            return combined

        return results

    def validate_connection(self) -> bool:
        """Validate API connection with health check endpoint."""
        params = self.config.connection_params
        health_endpoint = params.get('health_endpoint')

        if not health_endpoint:
            # Try common health check endpoints
            base_url = params.get('base_url', '')
            if base_url:
                for endpoint in ['/health', '/status', '/ping', '/']:
                    try:
                        url = f"{base_url.rstrip('/')}{endpoint}"
                        response = self.session.get(url, timeout=5)
                        if response.status_code < 400:
                            return True
                    except:
                        continue
            return False

        try:
            if not health_endpoint.startswith('http'):
                base_url = params.get('base_url', '')
                health_endpoint = f"{base_url.rstrip('/')}/{health_endpoint.lstrip('/')}"

            response = self.session.get(health_endpoint, timeout=5)
            return response.status_code < 400
        except Exception as e:
            self.logger.error(f"Connection validation failed: {e}")
            return False

    def get_endpoints(self) -> List[str]:
        """Get list of available endpoints from API documentation."""
        params = self.config.connection_params
        docs_endpoint = params.get('docs_endpoint')

        if not docs_endpoint:
            return []

        try:
            response = self.session.get(docs_endpoint, timeout=10)
            response.raise_for_status()

            # Try to parse OpenAPI/Swagger spec
            spec = response.json()
            if 'paths' in spec:
                return list(spec['paths'].keys())

            return []
        except Exception as e:
            self.logger.error(f"Failed to get endpoints: {e}")
            return []

    def close(self):
        """Close API session."""
        self.session.close()

    def __del__(self):
        """Cleanup on deletion."""
        self.close()