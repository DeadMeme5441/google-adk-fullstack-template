"""
Google ADK OpenAPI Tools Template Framework

This module provides a template framework for automatically generating ADK toolsets
from OpenAPI specifications. It supports two integration patterns:

1. Direct Integration: OpenAPI spec → OpenAPIToolset → RestApiTool instances
2. MCP Integration: OpenAPI spec → FastMCP server → MCPToolset → MCP tools

Usage:
    from tools import ToolRegistry
    
    # Load all OpenAPI specs and create toolsets
    registry = ToolRegistry()
    toolsets = registry.get_all_toolsets()
    
    # Use in your agent
    agent = LlmAgent(tools=toolsets, ...)
"""

from .registry import ToolRegistry
from .openapi_toolset_factory import OpenAPIToolsetFactory  
from .fastmcp_toolset_factory import FastMCPToolsetFactory
from .config import ToolsConfig

__all__ = [
    "ToolRegistry",
    "OpenAPIToolsetFactory", 
    "FastMCPToolsetFactory",
    "ToolsConfig"
]