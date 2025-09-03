"""
Central registry for managing and generating tool endpoints.

This module provides the core functionality for registering different types of tools
and generating FastAPI routes that proxy requests to external APIs or services.
"""

import os
import asyncio
import httpx
from typing import Dict, List, Optional, Any, Callable, Union
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from loguru import logger

from .config_models import APIToolConfig, FastMCPToolConfig, CustomToolConfig
from .api_proxy import APIProxyHandler
from .fastmcp_proxy import FastMCPProxyHandler


class ToolRegistry:
    """Central registry for managing all registered tools."""
    
    def __init__(self):
        self._api_tools: Dict[str, APIToolConfig] = {}
        self._fastmcp_tools: Dict[str, FastMCPToolConfig] = {}
        self._custom_tools: Dict[str, CustomToolConfig] = {}
        self._router: Optional[APIRouter] = None
        self._proxy_handlers: Dict[str, Union[APIProxyHandler, FastMCPProxyHandler]] = {}
    
    def register_api_tool(
        self,
        name: str,
        spec_url: Optional[str] = None,
        base_url: str = "",
        auth: Optional[Dict[str, Any]] = None,
        operations: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        enabled: bool = True,
        proxy_prefix: Optional[str] = None
    ):
        """Register an external API as a tool.
        
        Args:
            name: Unique name for the tool
            spec_url: URL to OpenAPI specification (optional)
            base_url: Base URL for the API
            auth: Authentication configuration
                - {"type": "bearer", "token_env": "GITHUB_TOKEN"}
                - {"type": "api_key", "key_env": "API_KEY", "location": "header|query"}
                - {"type": "basic", "username_env": "USER", "password_env": "PASS"}
            operations: List of specific operations to expose (None = all)
            tags: Tags for grouping tools
            enabled: Whether to enable this tool
            proxy_prefix: Custom prefix (defaults to /tools/{name})
        """
        if name in self._api_tools:
            logger.warning(f"API tool '{name}' already registered, replacing")
        
        config = APIToolConfig(
            name=name,
            spec_url=spec_url,
            base_url=base_url,
            auth=auth,
            operations=operations,
            tags=tags or [],
            enabled=enabled,
            proxy_prefix=proxy_prefix or f"/tools/{name}"
        )
        
        self._api_tools[name] = config
        self._router = None  # Force router regeneration
        
        logger.info(f"Registered API tool: {name} -> {config.proxy_prefix}")
    
    def register_fastmcp_tool(
        self,
        name: str,
        server_url: str,
        proxy_prefix: Optional[str] = None,
        auth: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        enabled: bool = True
    ):
        """Register a FastMCP server as a tool.
        
        Args:
            name: Unique name for the tool
            server_url: URL of the FastMCP server (e.g., http://localhost:9000)
            proxy_prefix: Custom prefix (defaults to /tools/{name})
            auth: Authentication configuration (passed through to FastMCP server)
            tags: Tags for grouping tools  
            enabled: Whether to enable this tool
        """
        if name in self._fastmcp_tools:
            logger.warning(f"FastMCP tool '{name}' already registered, replacing")
        
        config = FastMCPToolConfig(
            name=name,
            server_url=server_url,
            proxy_prefix=proxy_prefix or f"/tools/{name}",
            auth=auth,
            tags=tags or [],
            enabled=enabled
        )
        
        self._fastmcp_tools[name] = config
        self._router = None  # Force router regeneration
        
        logger.info(f"Registered FastMCP tool: {name} -> {config.proxy_prefix}")
    
    def register_custom_tool(
        self,
        name: str,
        handler: Callable,
        methods: List[str] = None,
        proxy_prefix: Optional[str] = None,
        tags: Optional[List[str]] = None,
        enabled: bool = True
    ):
        """Register a custom tool with user-defined handler.
        
        Args:
            name: Unique name for the tool
            handler: Async function to handle requests
            methods: HTTP methods to support (defaults to ["GET", "POST"])
            proxy_prefix: Custom prefix (defaults to /tools/{name})
            tags: Tags for grouping tools
            enabled: Whether to enable this tool
        """
        if name in self._custom_tools:
            logger.warning(f"Custom tool '{name}' already registered, replacing")
        
        config = CustomToolConfig(
            name=name,
            handler=handler,
            methods=methods or ["GET", "POST"],
            proxy_prefix=proxy_prefix or f"/tools/{name}",
            tags=tags or [],
            enabled=enabled
        )
        
        self._custom_tools[name] = config
        self._router = None  # Force router regeneration
        
        logger.info(f"Registered custom tool: {name} -> {config.proxy_prefix}")
    
    def get_tools_router(self) -> APIRouter:
        """Generate FastAPI router with all registered tool endpoints."""
        if self._router is None:
            self._router = self._create_router()
        return self._router
    
    def _create_router(self) -> APIRouter:
        """Create the FastAPI router with all tool endpoints."""
        router = APIRouter(prefix="/tools", tags=["Tools"])
        
        # Add individual OpenAPI spec endpoints
        self._add_openapi_spec_routes(router)
        
        # Add API tool routes
        for name, config in self._api_tools.items():
            if not config.enabled:
                continue
            self._add_api_tool_routes(router, config)
        
        # Add FastMCP tool routes  
        for name, config in self._fastmcp_tools.items():
            if not config.enabled:
                continue
            self._add_fastmcp_tool_routes(router, config)
        
        # Add custom tool routes
        for name, config in self._custom_tools.items():
            if not config.enabled:
                continue
            self._add_custom_tool_routes(router, config)
        
        return router
    
    def _add_openapi_spec_routes(self, router: APIRouter):
        """Add individual OpenAPI spec endpoints for each tool."""
        
        @router.get("/{tool_name}/openapi.json", 
                   summary="Get OpenAPI spec for individual tool",
                   description="Returns the OpenAPI specification for a specific registered tool")
        async def get_tool_openapi_spec(tool_name: str):
            """Get OpenAPI specification for a specific tool."""
            try:
                # Generate individual spec for the requested tool
                individual_spec = await self._generate_individual_openapi_spec(tool_name)
                if individual_spec is None:
                    raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found or not enabled")
                return individual_spec
            except Exception as e:
                logger.error(f"Error generating OpenAPI spec for tool '{tool_name}': {e}")
                raise HTTPException(status_code=500, detail="Error generating OpenAPI specification")
    
    async def _generate_individual_openapi_spec(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """Generate OpenAPI specification for a single tool."""
        
        # Check if tool exists and is enabled
        tool_config = None
        tool_type = None
        
        if tool_name in self._api_tools and self._api_tools[tool_name].enabled:
            tool_config = self._api_tools[tool_name]
            tool_type = "api"
        elif tool_name in self._fastmcp_tools and self._fastmcp_tools[tool_name].enabled:
            tool_config = self._fastmcp_tools[tool_name]
            tool_type = "fastmcp"
        elif tool_name in self._custom_tools and self._custom_tools[tool_name].enabled:
            tool_config = self._custom_tools[tool_name]
            tool_type = "custom"
        else:
            return None
        
        # Generate spec based on tool type
        if tool_type == "api":
            return await self._generate_api_tool_spec(tool_config)
        elif tool_type == "fastmcp":
            return await self._generate_fastmcp_tool_spec(tool_config)
        elif tool_type == "custom":
            return self._generate_custom_tool_spec(tool_config)
        
        return None
    
    async def _generate_api_tool_spec(self, config: APIToolConfig) -> Dict[str, Any]:
        """Generate OpenAPI spec for an API tool using FastAPI utilities."""
        if config.spec_url:
            # If we have a spec URL, try to fetch the original spec
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(config.spec_url, timeout=10.0)
                    if response.status_code == 200:
                        original_spec = response.json()
                        # Filter operations if specified
                        if config.operations:
                            original_spec = self._filter_openapi_operations(original_spec, config.operations)
                        return original_spec
            except Exception as e:
                logger.warning(f"Could not fetch original spec from {config.spec_url}: {e}")
        
        # Fallback: create a temporary FastAPI app with proxy routes and generate spec
        temp_app = FastAPI(
            title=f"{config.name} API Tool",
            version="1.0.0",
            description=f"Proxied API tool for {config.name}"
        )
        
        # Create a temporary router for this tool
        temp_router = APIRouter(tags=config.tags or [config.name])
        
        # Add proxy routes (these won't actually be called, just for OpenAPI generation)
        @temp_router.get("/{path:path}", 
                        summary=f"Proxy GET requests to {config.name}",
                        description="Proxy GET requests to the external API")
        def proxy_get(path: str):
            """Proxy GET requests to the external API."""
            pass
            
        @temp_router.post("/{path:path}",
                         summary=f"Proxy POST requests to {config.name}", 
                         description="Proxy POST requests to the external API")
        def proxy_post(path: str, body: Dict[str, Any] = None):
            """Proxy POST requests to the external API."""
            pass
        
        temp_app.include_router(temp_router)
        
        # Generate OpenAPI spec using FastAPI's utility
        spec = get_openapi(
            title=f"{config.name} API Tool",
            version="1.0.0",
            description=f"Proxied API tool for {config.name}",
            routes=temp_app.routes
        )
        
        # Add server info if available
        if config.base_url:
            spec["servers"] = [{"url": config.base_url}]
            
        return spec
    
    async def _generate_fastmcp_tool_spec(self, config: FastMCPToolConfig) -> Dict[str, Any]:
        """Generate OpenAPI spec for a FastMCP tool."""
        # Try to get the spec from the FastMCP server
        try:
            handler = self._proxy_handlers.get(config.name)
            if isinstance(handler, FastMCPProxyHandler):
                spec = await handler.get_server_openapi_spec()
                if spec:
                    return spec
        except Exception as e:
            logger.warning(f"Could not fetch FastMCP spec for {config.name}: {e}")
        
        # Fallback: generate a basic spec
        return {
            "openapi": "3.0.2",
            "info": {
                "title": f"{config.name} FastMCP Tool",
                "version": "1.0.0",
                "description": f"FastMCP server tool for {config.name}"
            },
            "servers": [{"url": config.server_url}],
            "paths": {
                "/{path}": {
                    "get": {
                        "summary": f"FastMCP GET requests to {config.name}",
                        "parameters": [
                            {
                                "name": "path",
                                "in": "path",
                                "required": True,
                                "schema": {"type": "string"},
                                "description": "FastMCP endpoint path"
                            }
                        ],
                        "responses": {
                            "200": {"description": "Successful response"},
                            "404": {"description": "Not found"},
                            "500": {"description": "Server error"}
                        },
                        "tags": config.tags or ["FastMCP", config.name]
                    },
                    "post": {
                        "summary": f"FastMCP POST requests to {config.name}",
                        "parameters": [
                            {
                                "name": "path",
                                "in": "path",
                                "required": True,
                                "schema": {"type": "string"},
                                "description": "FastMCP endpoint path"
                            }
                        ],
                        "requestBody": {
                            "content": {
                                "application/json": {"schema": {"type": "object"}}
                            }
                        },
                        "responses": {
                            "200": {"description": "Successful response"},
                            "400": {"description": "Bad request"},
                            "500": {"description": "Server error"}
                        },
                        "tags": config.tags or ["FastMCP", config.name]
                    }
                }
            }
        }
    
    def _generate_custom_tool_spec(self, config: CustomToolConfig) -> Dict[str, Any]:
        """Generate OpenAPI spec for a custom tool using FastAPI utilities."""
        # Create a temporary FastAPI app
        temp_app = FastAPI(
            title=f"{config.name} Custom Tool",
            version="1.0.0", 
            description=f"Custom tool implementation for {config.name}"
        )
        
        # Create a temporary router
        temp_router = APIRouter(tags=config.tags or ["Custom", config.name])
        
        # Add routes for each supported method
        for method in config.methods:
            if method.upper() == "GET":
                @temp_router.get("/{path:path}",
                               summary=f"{config.name} custom tool - GET",
                               description=f"Custom tool GET endpoint for {config.name}")
                def custom_get(path: str):
                    """Custom tool GET endpoint."""
                    pass
                    
            elif method.upper() == "POST":
                @temp_router.post("/{path:path}",
                                summary=f"{config.name} custom tool - POST", 
                                description=f"Custom tool POST endpoint for {config.name}")
                def custom_post(path: str, body: Dict[str, Any] = None):
                    """Custom tool POST endpoint."""
                    pass
                    
            elif method.upper() == "PUT":
                @temp_router.put("/{path:path}",
                               summary=f"{config.name} custom tool - PUT",
                               description=f"Custom tool PUT endpoint for {config.name}")
                def custom_put(path: str, body: Dict[str, Any] = None):
                    """Custom tool PUT endpoint."""
                    pass
                    
            elif method.upper() == "DELETE":
                @temp_router.delete("/{path:path}",
                                  summary=f"{config.name} custom tool - DELETE",
                                  description=f"Custom tool DELETE endpoint for {config.name}")
                def custom_delete(path: str):
                    """Custom tool DELETE endpoint."""
                    pass
        
        temp_app.include_router(temp_router)
        
        # Generate OpenAPI spec using FastAPI's utility
        return get_openapi(
            title=f"{config.name} Custom Tool",
            version="1.0.0",
            description=f"Custom tool implementation for {config.name}",
            routes=temp_app.routes
        )
    
    def _filter_openapi_operations(self, spec: Dict[str, Any], operations: List[str]) -> Dict[str, Any]:
        """Filter OpenAPI spec to include only specified operations."""
        if "paths" not in spec:
            return spec
        
        filtered_spec = spec.copy()
        filtered_paths = {}
        
        for path, methods in spec["paths"].items():
            filtered_methods = {}
            for method, operation in methods.items():
                # Check if this operation should be included
                operation_id = operation.get("operationId", "")
                if any(op in operation_id or op in path for op in operations):
                    filtered_methods[method] = operation
            
            if filtered_methods:
                filtered_paths[path] = filtered_methods
        
        filtered_spec["paths"] = filtered_paths
        return filtered_spec
    
    def _add_api_tool_routes(self, router: APIRouter, config: APIToolConfig):
        """Add routes for an API tool."""
        # Create proxy handler
        if config.name not in self._proxy_handlers:
            self._proxy_handlers[config.name] = APIProxyHandler(config)
        
        handler = self._proxy_handlers[config.name]
        
        # Add catch-all route for the API
        @router.api_route(
            f"/{config.name}/{{path:path}}",
            methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
            tags=config.tags or [config.name.title()],
            summary=f"{config.name.title()} API Proxy",
            description=f"Proxy endpoint for {config.name} API operations"
        )
        async def api_proxy(path: str, request: Request):
            return await handler.proxy_request(path, request)
        
        # Store reference to avoid garbage collection
        setattr(api_proxy, f"_handler_{config.name}", handler)
    
    def _add_fastmcp_tool_routes(self, router: APIRouter, config: FastMCPToolConfig):
        """Add routes for a FastMCP tool.""" 
        # Create proxy handler
        if config.name not in self._proxy_handlers:
            self._proxy_handlers[config.name] = FastMCPProxyHandler(config)
        
        handler = self._proxy_handlers[config.name]
        
        # Add catch-all route for FastMCP server
        @router.api_route(
            f"/{config.name}/{{path:path}}",
            methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
            tags=config.tags or [config.name.title()],
            summary=f"{config.name.title()} FastMCP Proxy",
            description=f"Proxy endpoint for {config.name} FastMCP server"
        )
        async def fastmcp_proxy(path: str, request: Request):
            return await handler.proxy_request(path, request)
        
        # Store reference to avoid garbage collection
        setattr(fastmcp_proxy, f"_handler_{config.name}", handler)
    
    def _add_custom_tool_routes(self, router: APIRouter, config: CustomToolConfig):
        """Add routes for a custom tool."""
        @router.api_route(
            f"/{config.name}/{{path:path}}",
            methods=config.methods,
            tags=config.tags or [config.name.title()],
            summary=f"{config.name.title()} Custom Tool",
            description=f"Custom tool endpoint: {config.name}"
        )
        async def custom_tool(path: str, request: Request):
            return await config.handler(path, request)
    
    def list_registered_tools(self) -> Dict[str, Dict[str, Any]]:
        """List all registered tools and their configuration."""
        return {
            "api_tools": {name: {
                "name": config.name,
                "base_url": config.base_url,
                "proxy_prefix": config.proxy_prefix,
                "enabled": config.enabled,
                "operations": config.operations
            } for name, config in self._api_tools.items()},
            "fastmcp_tools": {name: {
                "name": config.name,
                "server_url": config.server_url,
                "proxy_prefix": config.proxy_prefix,
                "enabled": config.enabled
            } for name, config in self._fastmcp_tools.items()},
            "custom_tools": {name: {
                "name": config.name,
                "methods": config.methods,
                "proxy_prefix": config.proxy_prefix,
                "enabled": config.enabled
            } for name, config in self._custom_tools.items()}
        }
    
    def clear_tools(self):
        """Clear all registered tools."""
        self._api_tools.clear()
        self._fastmcp_tools.clear()
        self._custom_tools.clear()
        self._proxy_handlers.clear()
        self._router = None
        logger.info("Cleared all registered tools")


# Global registry instance
_registry = ToolRegistry()

# Public API functions
def register_api_tool(*args, **kwargs):
    """Register an external API as a tool."""
    return _registry.register_api_tool(*args, **kwargs)

def register_fastmcp_tool(*args, **kwargs):
    """Register a FastMCP server as a tool.""" 
    return _registry.register_fastmcp_tool(*args, **kwargs)

def register_custom_tool(*args, **kwargs):
    """Register a custom tool with user-defined handler."""
    return _registry.register_custom_tool(*args, **kwargs)

def get_tools_router() -> APIRouter:
    """Get the FastAPI router with all tool endpoints."""
    return _registry.get_tools_router()

def list_registered_tools():
    """List all registered tools."""
    return _registry.list_registered_tools()

def clear_tools():
    """Clear all registered tools."""
    return _registry.clear_tools()