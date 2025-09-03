"""
Configuration system for OpenAPI toolset generation.

This module defines the configuration structure that users can customize
to control how their OpenAPI specifications are converted into ADK toolsets.
"""

from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field
from pathlib import Path


class OpenAPIToolConfig(BaseModel):
    """Configuration for a single OpenAPI specification."""
    
    # OpenAPI spec source - either a URL or local file path
    spec_source: str = Field(
        ..., 
        description="URL (https://api.example.com/openapi.json) or local file (todo_api.yaml)"
    )
    
    # Integration method: 'direct' uses OpenAPIToolset, 'fastmcp' uses FastMCP+MCPToolset
    integration_method: Literal["direct", "fastmcp"] = Field(
        default="direct",
        description="Integration method: 'direct' or 'fastmcp'"
    )
    
    # Cache settings for URL-based specs
    cache_spec: bool = Field(
        default=True,
        description="Cache downloaded specs locally for performance"
    )
    cache_ttl: int = Field(
        default=3600,
        description="Cache time-to-live in seconds (default: 1 hour)"
    )
    
    # Tool filtering - only expose specific operations
    operation_filter: Optional[List[str]] = Field(
        default=None,
        description="List of operationIds to include (None = include all)"
    )
    
    # Authentication configuration
    auth_scheme: Optional[str] = Field(
        default=None,
        description="Auth scheme: 'api_key', 'bearer_token', 'basic', etc."
    )
    auth_credential: Optional[str] = Field(
        default=None,
        description="Auth credential or env var name (e.g., 'OPENWEATHER_API_KEY')"
    )
    
    # Server URL override (if different from spec)
    server_url: Optional[str] = Field(
        default=None,
        description="Override base URL from OpenAPI spec"
    )
    
    # FastMCP-specific settings
    fastmcp_port: Optional[int] = Field(
        default=None,
        description="Port for FastMCP server (auto-assigned if None)"
    )
    
    # Tool customization
    tool_prefix: Optional[str] = Field(
        default=None,
        description="Prefix for tool names (e.g., 'weather_' for weather_get_current)"
    )
    
    enabled: bool = Field(
        default=True,
        description="Whether to load this API"
    )


class ToolsConfig(BaseModel):
    """Main configuration for all OpenAPI toolsets."""
    
    # Global settings
    default_integration_method: Literal["direct", "fastmcp"] = Field(
        default="direct",
        description="Default integration method for APIs without explicit config"
    )
    
    # Directory paths (relative to backend/tools/)
    openapi_specs_dir: str = Field(
        default="openapi_specs",
        description="Directory containing OpenAPI specification files"
    )
    
    # Per-API configurations
    apis: Dict[str, OpenAPIToolConfig] = Field(
        default_factory=dict,
        description="Configuration for each API (key = API name)"
    )
    
    # Global auth settings (can be overridden per API)
    global_auth: Dict[str, str] = Field(
        default_factory=dict,
        description="Global authentication credentials (env var names)"
    )
    
    # FastMCP settings
    fastmcp_host: str = Field(
        default="localhost",
        description="Host for FastMCP servers"
    )
    fastmcp_port_range: tuple[int, int] = Field(
        default=(9000, 9100),
        description="Port range for auto-assigning FastMCP servers"
    )
    
    @classmethod
    def load_from_file(cls, config_path: Path) -> "ToolsConfig":
        """Load configuration from a YAML or JSON file."""
        import yaml
        import json
        
        if not config_path.exists():
            return cls()  # Return default config
            
        content = config_path.read_text()
        
        if config_path.suffix in ['.yaml', '.yml']:
            data = yaml.safe_load(content)
        else:
            data = json.loads(content)
            
        return cls(**data)
    
    def save_to_file(self, config_path: Path):
        """Save configuration to a YAML file."""
        import yaml
        
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, 'w') as f:
            yaml.dump(self.dict(), f, default_flow_style=False)


# Default configuration that users can customize
DEFAULT_CONFIG = ToolsConfig(
    default_integration_method="direct",
    apis={
        # Example: URL-based OpenAPI spec (most common)
        "example_petstore": OpenAPIToolConfig(
            spec_source="https://petstore3.swagger.io/api/v3/openapi.json",
            integration_method="direct",
            operation_filter=["findPetsByStatus", "addPet", "getPetById"],
            tool_prefix="pet_",
            enabled=False  # Disabled by default - just an example
        ),
        # Example: Local file-based spec
        "example_todo": OpenAPIToolConfig(
            spec_source="todo_api.yaml",  # Local file in openapi_specs/
            integration_method="direct", 
            operation_filter=["getAllTodos", "createTodo", "getTodoById"],
            tool_prefix="todo_",
            enabled=False  # Disabled by default - just an example
        ),
        # Example: URL with authentication
        "example_weather": OpenAPIToolConfig(
            spec_source="https://api.openweathermap.org/data/2.5/openapi.json",
            integration_method="fastmcp",
            auth_scheme="api_key",
            auth_credential="OPENWEATHER_API_KEY",
            tool_prefix="weather_",
            cache_ttl=7200,  # Cache for 2 hours
            enabled=False  # Disabled by default - just an example
        )
    }
)