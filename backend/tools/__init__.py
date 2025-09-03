"""
Google ADK Tools Template Framework

A Python-based system for dynamically registering and exposing tools through FastAPI endpoints.
This framework automatically generates /tools/* endpoints that are included in the unified
OpenAPI specification, making them accessible to ADK agents via OpenAPIToolset.

Usage:
    from tools import register_api_tool, register_fastmcp_tool, get_tools_router
    
    # Register external API as tools
    register_api_tool(
        name="github",
        spec_url="https://api.github.com/openapi.json",
        base_url="https://api.github.com",
        auth={"type": "bearer", "token_env": "GITHUB_TOKEN"},
        operations=["repos/list-for-authenticated-user", "repos/get"]
    )
    
    # Register FastMCP server as tools
    register_fastmcp_tool(
        name="analysis_server",
        server_url="http://localhost:9000",
        proxy_prefix="/tools/analysis" 
    )
    
    # Get router for FastAPI integration
    tools_router = get_tools_router()
    app.include_router(tools_router)
"""

from .registry import (
    register_api_tool,
    register_fastmcp_tool,
    register_custom_tool,
    get_tools_router,
    list_registered_tools,
    clear_tools
)

# Import integrations to automatically register tools
# This ensures tools are registered when the module is imported
from . import integrations

__all__ = [
    "register_api_tool",
    "register_fastmcp_tool", 
    "register_custom_tool",
    "get_tools_router",
    "list_registered_tools",
    "clear_tools"
]