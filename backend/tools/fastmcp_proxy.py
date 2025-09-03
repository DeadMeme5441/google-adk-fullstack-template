"""
FastMCP Proxy Handler for FastMCP HTTP servers.

This module provides the FastMCPProxyHandler class that proxies HTTP requests
to FastMCP servers and forwards their responses back to clients.
"""

import os
import json
import asyncio
import httpx
from typing import Dict, Optional, Any, Union
from urllib.parse import urljoin
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from loguru import logger

from .config_models import FastMCPToolConfig


class FastMCPProxyHandler:
    """Handler for proxying requests to FastMCP HTTP servers."""
    
    def __init__(self, config: FastMCPToolConfig):
        """Initialize proxy handler for a FastMCP tool.
        
        Args:
            config: Configuration for the FastMCP tool
        """
        self.config = config
        self.server_url = config.server_url.rstrip('/')
        self._auth_headers = self._prepare_auth_headers()
        self._client: Optional[httpx.AsyncClient] = None
        self._server_ready = False
    
    async def proxy_request(self, path: str, request: Request) -> Response:
        """Proxy an HTTP request to the FastMCP server.
        
        Args:
            path: The path portion of the request (after /tools/{name}/)
            request: FastAPI request object
            
        Returns:
            FastAPI Response object with proxied content
        """
        try:
            # Check if server is ready
            if not self._server_ready:
                await self._check_server_health()
            
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
            logger.error(f"Timeout proxying request to FastMCP server {self.config.name}")
            raise HTTPException(status_code=504, detail="FastMCP server timeout")
        except httpx.ConnectError:
            logger.error(f"Connection error to FastMCP server {self.config.name}")
            raise HTTPException(status_code=502, detail="FastMCP server unavailable")
        except Exception as e:
            logger.error(f"Error proxying request to FastMCP server {self.config.name}: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
    
    def _build_target_url(self, path: str) -> str:
        """Build the target URL for the FastMCP server.
        
        Args:
            path: Request path
            
        Returns:
            Complete target URL
        """
        # Remove leading slash if present
        path = path.lstrip('/')
        
        # FastMCP servers typically expose their tools at the root level
        # or under specific endpoints - we'll forward the path as-is
        return urljoin(self.server_url + '/', path)
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for FastMCP requests.
        
        Returns:
            Configured HTTP client
        """
        if self._client is None:
            # Create client with reasonable defaults for FastMCP
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                follow_redirects=True,
                headers={
                    "User-Agent": f"ADK-Tools-FastMCP-Proxy/{self.config.name}",
                    "Accept": "application/json, */*"
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
        
        # Add authentication headers if configured
        if self._auth_headers:
            headers.update(self._auth_headers)
        
        # Ensure JSON content type for FastMCP if body is present
        if request.method in ["POST", "PUT", "PATCH"]:
            if "content-type" not in headers:
                headers["Content-Type"] = "application/json"
        
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
        """Process the response from the FastMCP server.
        
        Args:
            response: HTTP response from FastMCP server
            
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
        
        # FastMCP servers typically return JSON
        if 'application/json' in content_type or not content_type:
            try:
                json_data = response.json()
                return JSONResponse(
                    content=json_data,
                    status_code=response.status_code,
                    headers=response_headers
                )
            except json.JSONDecodeError:
                # Fallback to text if JSON parsing fails
                return Response(
                    content=response.text,
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type="text/plain"
                )
        
        elif 'text/' in content_type:
            # Text response
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
                logger.warning(f"Bearer token env var '{token_env}' not found for FastMCP {self.config.name}")
        
        elif auth_type == "api_key":
            # API key authentication
            key_env = self.config.auth.get("key_env")
            key_name = self.config.auth.get("key_name", "X-API-Key")
            
            if key_env and key_env in os.environ:
                api_key = os.environ[key_env]
                headers[key_name] = api_key
            else:
                logger.warning(f"API key env var '{key_env}' not found for FastMCP {self.config.name}")
        
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
                logger.warning(f"Basic auth env vars not found for FastMCP {self.config.name}")
        
        return headers
    
    async def _check_server_health(self):
        """Check if the FastMCP server is healthy and ready.
        
        Raises:
            HTTPException: If server is not healthy
        """
        try:
            client = await self._get_client()
            
            # Try to hit common FastMCP health/info endpoints
            health_endpoints = [
                "",  # Root endpoint
                "health",
                "status", 
                "info",
                "openapi.json"  # OpenAPI spec endpoint
            ]
            
            for endpoint in health_endpoints:
                try:
                    url = urljoin(self.server_url + '/', endpoint)
                    response = await client.get(url, timeout=5.0)
                    
                    if response.status_code < 500:  # Any non-server-error response indicates server is up
                        self._server_ready = True
                        logger.info(f"FastMCP server {self.config.name} is healthy at {url}")
                        return
                        
                except httpx.RequestError:
                    continue
            
            # If we get here, none of the health endpoints responded successfully
            logger.error(f"FastMCP server {self.config.name} at {self.server_url} is not responding")
            raise HTTPException(
                status_code=503, 
                detail=f"FastMCP server {self.config.name} is not available"
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking FastMCP server health for {self.config.name}: {e}")
            raise HTTPException(
                status_code=503, 
                detail=f"Cannot verify FastMCP server {self.config.name} health"
            )
    
    async def get_server_openapi_spec(self) -> Optional[Dict[str, Any]]:
        """Get the OpenAPI specification from the FastMCP server.
        
        Returns:
            OpenAPI specification dictionary, or None if not available
        """
        try:
            client = await self._get_client()
            openapi_url = urljoin(self.server_url + '/', 'openapi.json')
            
            response = await client.get(openapi_url, timeout=10.0)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"FastMCP server {self.config.name} returned {response.status_code} for OpenAPI spec")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching OpenAPI spec from FastMCP server {self.config.name}: {e}")
            return None
    
    async def close(self):
        """Clean up resources."""
        if self._client:
            await self._client.aclose()
            self._client = None