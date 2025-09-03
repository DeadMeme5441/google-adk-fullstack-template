"""
Configuration models for the OpenAPI Tools Template Framework.

This module contains dataclass definitions for different tool types to avoid
circular imports between registry and proxy handler modules.
"""

from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field


@dataclass
class APIToolConfig:
    """Configuration for an external API tool."""
    name: str
    spec_url: Optional[str] = None
    base_url: str = ""
    auth: Optional[Dict[str, Any]] = None
    operations: Optional[List[str]] = None  # Specific operations to expose
    tags: Optional[List[str]] = None
    enabled: bool = True
    proxy_prefix: Optional[str] = None  # Custom prefix, defaults to /tools/{name}


@dataclass
class FastMCPToolConfig:
    """Configuration for a FastMCP server tool."""
    name: str
    server_url: str
    proxy_prefix: Optional[str] = None  # Custom prefix, defaults to /tools/{name}
    auth: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    enabled: bool = True


@dataclass 
class CustomToolConfig:
    """Configuration for a custom tool with user-defined handlers."""
    name: str
    handler: Callable
    methods: List[str] = field(default_factory=lambda: ["GET", "POST"])
    proxy_prefix: Optional[str] = None  # Custom prefix, defaults to /tools/{name}
    tags: Optional[List[str]] = None
    enabled: bool = True