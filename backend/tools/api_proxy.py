"""
API Proxy Handler for external REST APIs.

This module provides the APIProxyHandler class that proxies HTTP requests
to external APIs with authentication and request forwarding capabilities.
"""

import os
import json
import asyncio
import httpx
from typing import Dict, Optional, Any, Union
from urllib.parse import urljoin, urlparse
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger

from .config_models import APIToolConfig


class APIProxyHandler:
    """Handler for proxying requests to external REST APIs."""
    
    def __init__(self, config: APIToolConfig):
        """Initialize proxy handler for an API tool.
        
        Args:
            config: Configuration for the API tool
        """
        self.config = config
        self.base_url = config.base_url.rstrip('/')
        self._auth_headers = self._prepare_auth_headers()
        self._client: Optional[httpx.AsyncClient] = None
    
    async def proxy_request(self, path: str, request: Request) -> Response:
        """Proxy an HTTP request to the external API.
        
        Args:
            path: The path portion of the request (after /tools/{name}/)
            request: FastAPI request object
            
        Returns:
            FastAPI Response object with proxied content
        """
        try:
            # Build target URL
            target_url = self._build_target_url(path)
            
            # Get HTTP client
            client = await self._get_client()
            
            # Prepare headers
            headers = await self._prepare_headers(request)
            
            # Get request body
            body = await self._get_request_body(request)
            
            # Make the proxied request
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
                timeout=30.0
            )
            
            # Process and return response
            return await self._process_response(response)
            
        except httpx.TimeoutException:
            logger.error(f"Timeout proxying request to {self.config.name}")
            raise HTTPException(status_code=504, detail="Gateway timeout")
        except httpx.ConnectError:
            logger.error(f"Connection error proxying request to {self.config.name}")
            raise HTTPException(status_code=502, detail="Bad gateway")
        except Exception as e:
            logger.error(f"Error proxying request to {self.config.name}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    def _build_target_url(self, path: str) -> str:
        """Build the target URL for the external API.
        
        Args:
            path: Request path
            
        Returns:
            Complete target URL
        """
        # Remove leading slash if present
        path = path.lstrip('/')
        
        # Join with base URL
        if self.base_url:
            return urljoin(self.base_url + '/', path)
        else:
            # If no base URL, assume path is complete URL
            return path
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for API requests.
        
        Returns:
            Configured HTTP client
        """
        if self._client is None:
            # Create client with reasonable defaults
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                follow_redirects=True,
                headers={
                    "User-Agent": f"ADK-Tools-Proxy/{self.config.name}"
                }
            )
        
        return self._client
    
    async def _prepare_headers(self, request: Request) -> Dict[str, str]:
        """Prepare headers for the proxied request.
        
        Args:
            request: Original FastAPI request
            
        Returns:
            Headers dictionary for the proxied request
        """
        headers = {}
        
        # Copy relevant headers from original request
        for header_name, header_value in request.headers.items():
            # Skip headers that should not be forwarded
            if header_name.lower() not in [
                'host', 'content-length', 'connection', 'upgrade',
                'proxy-connection', 'proxy-authenticate', 'proxy-authorization',
                'te', 'trailers', 'transfer-encoding'
            ]:
                headers[header_name] = header_value
        
        # Add authentication headers
        if self._auth_headers:
            headers.update(self._auth_headers)
        
        return headers
    
    async def _get_request_body(self, request: Request) -> Optional[bytes]:
        """Get request body from FastAPI request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Request body as bytes, or None if no body
        """
        try:
            body = await request.body()
            return body if body else None
        except Exception:
            return None
    
    async def _process_response(self, response: httpx.Response) -> Response:
        """Process the response from the external API.
        
        Args:
            response: HTTP response from external API
            
        Returns:
            FastAPI Response object
        """
        # Prepare response headers
        response_headers = {}
        for header_name, header_value in response.headers.items():
            # Skip headers that should not be forwarded
            if header_name.lower() not in [
                'content-length', 'content-encoding', 'connection',
                'transfer-encoding', 'upgrade'
            ]:
                response_headers[header_name] = header_value
        
        # Handle different content types
        content_type = response.headers.get('content-type', '').lower()
        
        if 'application/json' in content_type:
            # JSON response
            try:
                json_data = response.json()
                return JSONResponse(
                    content=json_data,
                    status_code=response.status_code,
                    headers=response_headers
                )
            except json.JSONDecodeError:
                # Fallback to text response
                pass
        
        elif 'text/' in content_type or 'application/xml' in content_type:
            # Text-based response
            return Response(
                content=response.text,
                status_code=response.status_code,
                headers=response_headers,
                media_type=content_type
            )
        
        else:
            # Binary response - use streaming
            async def stream_content():
                async for chunk in response.aiter_bytes():
                    yield chunk
            
            return StreamingResponse(
                stream_content(),
                status_code=response.status_code,
                headers=response_headers,
                media_type=content_type
            )
    
    def _prepare_auth_headers(self) -> Dict[str, str]:
        """Prepare authentication headers based on config.
        
        Returns:
            Dictionary of authentication headers
        """
        if not self.config.auth:
            return {}
        
        auth_type = self.config.auth.get("type", "").lower()
        headers = {}
        
        if auth_type == "bearer":
            # Bearer token authentication
            token_env = self.config.auth.get("token_env")
            if token_env and token_env in os.environ:
                token = os.environ[token_env]
                headers["Authorization"] = f"Bearer {token}"
            else:
                logger.warning(f"Bearer token env var '{token_env}' not found for {self.config.name}")
        
        elif auth_type == "api_key":
            # API key authentication
            key_env = self.config.auth.get("key_env")
            location = self.config.auth.get("location", "header").lower()
            
            if key_env and key_env in os.environ:
                api_key = os.environ[key_env]
                
                if location == "header":
                    # API key in header
                    key_name = self.config.auth.get("key_name", "X-API-Key")
                    headers[key_name] = api_key
                # Note: Query parameter API keys are handled in the request params
            else:
                logger.warning(f"API key env var '{key_env}' not found for {self.config.name}")
        
        elif auth_type == "basic":
            # Basic authentication
            username_env = self.config.auth.get("username_env")
            password_env = self.config.auth.get("password_env")
            
            if (username_env and username_env in os.environ and 
                password_env and password_env in os.environ):
                
                username = os.environ[username_env]
                password = os.environ[password_env]
                
                import base64
                credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
                headers["Authorization"] = f"Basic {credentials}"
            else:
                logger.warning(f"Basic auth env vars not found for {self.config.name}")
        
        return headers
    
    async def close(self):
        """Clean up resources."""
        if self._client:
            await self._client.aclose()
            self._client = None