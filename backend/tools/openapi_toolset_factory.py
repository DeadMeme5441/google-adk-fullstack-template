"""
Factory for creating OpenAPIToolsets using direct ADK integration.

This factory creates Google ADK OpenAPIToolset instances directly from OpenAPI
specifications, providing the simplest integration path.
"""

import os
from pathlib import Path
from typing import Optional, List, Dict, Any

from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset
from google.adk.tools.base_toolset import BaseToolset

from .config import OpenAPIToolConfig
from .spec_loader import load_spec_sync, override_server_url


class OpenAPIToolsetFactory:
    """Factory for creating OpenAPIToolsets from OpenAPI specifications."""
    
    def __init__(self, specs_dir: Path, cache_dir: Optional[Path] = None):
        """Initialize factory with directory containing OpenAPI specs.
        
        Args:
            specs_dir: Path to directory containing OpenAPI specification files
            cache_dir: Path to directory for caching downloaded specs
        """
        self.specs_dir = specs_dir
        self.cache_dir = cache_dir or (specs_dir.parent / "cache")
    
    def create_toolset(
        self, 
        api_name: str, 
        config: OpenAPIToolConfig
    ) -> Optional[BaseToolset]:
        """Create an OpenAPIToolset from configuration.
        
        Args:
            api_name: Name identifier for this API
            config: Configuration for this API
            
        Returns:
            OpenAPIToolset instance or None if creation failed
        """
        if not config.enabled:
            print(f"Skipping disabled API: {api_name}")
            return None
        
        try:
            # Load OpenAPI specification (URL or file)
            spec_content = load_spec_sync(
                spec_source=config.spec_source,
                cache_enabled=config.cache_spec,
                cache_ttl=config.cache_ttl,
                specs_dir=self.specs_dir,
                cache_dir=self.cache_dir
            )
            
            # Override server URL if specified
            if config.server_url:
                spec_content = override_server_url(spec_content, config.server_url)
            
            # Determine auth configuration
            auth_scheme, auth_credential = self._resolve_auth(config)
            
            # Create OpenAPIToolset
            print(f"Creating OpenAPIToolset for {api_name} (direct integration)")
            toolset = OpenAPIToolset(
                spec_dict=spec_content,
                auth_scheme=auth_scheme,
                auth_credential=auth_credential
            )
            
            # Apply tool filtering if specified
            if config.operation_filter:
                toolset = self._filter_tools(toolset, config.operation_filter, config.tool_prefix)
            
            return toolset
            
        except Exception as e:
            print(f"Error creating OpenAPIToolset for {api_name}: {e}")
            return None
    
    
    def _resolve_auth(self, config: OpenAPIToolConfig) -> tuple[Optional[str], Optional[str]]:
        """Resolve authentication scheme and credential."""
        if not config.auth_scheme:
            return None, None
            
        auth_credential = config.auth_credential
        
        # If auth_credential looks like an env var, resolve it
        if auth_credential and auth_credential.isupper() and '_' in auth_credential:
            env_value = os.getenv(auth_credential)
            if env_value:
                auth_credential = env_value
            else:
                print(f"Warning: Environment variable {auth_credential} not found")
                return None, None
        
        return config.auth_scheme, auth_credential
    
    def _filter_tools(
        self, 
        toolset: OpenAPIToolset, 
        operation_filter: List[str],
        tool_prefix: Optional[str]
    ) -> BaseToolset:
        """Apply tool filtering and prefixing.
        
        Note: This is a simplified implementation. In practice, you might want
        to create a wrapper toolset that filters the tools returned by get_tools().
        """
        # For now, return the toolset as-is since OpenAPIToolset doesn't have
        # built-in filtering. In a full implementation, you'd create a wrapper
        # that filters tools in the get_tools() method.
        
        if tool_prefix:
            print(f"Note: Tool prefix '{tool_prefix}' configured but not yet implemented")
        if operation_filter:
            print(f"Note: Operation filter {operation_filter} configured but not yet implemented") 
            
        # TODO: Implement tool filtering wrapper if needed
        return toolset


class FilteredOpenAPIToolset(BaseToolset):
    """Wrapper toolset that filters and customizes OpenAPI tools.
    
    This can be used to implement operation filtering and tool prefixing
    on top of the base OpenAPIToolset.
    """
    
    def __init__(
        self, 
        base_toolset: OpenAPIToolset,
        operation_filter: Optional[List[str]] = None,
        tool_prefix: Optional[str] = None
    ):
        super().__init__()
        self.base_toolset = base_toolset
        self.operation_filter = set(operation_filter) if operation_filter else None
        self.tool_prefix = tool_prefix or ""
    
    async def get_tools(self, readonly_context=None):
        """Get filtered and prefixed tools."""
        base_tools = await self.base_toolset.get_tools(readonly_context)
        
        filtered_tools = []
        for tool in base_tools:
            # Apply operation filter
            if self.operation_filter and tool.name not in self.operation_filter:
                continue
                
            # Apply tool prefix
            if self.tool_prefix:
                # Create a wrapper that modifies the tool name
                tool.name = f"{self.tool_prefix}{tool.name}"
            
            filtered_tools.append(tool)
        
        return filtered_tools
    
    async def close(self):
        """Clean up the base toolset."""
        if hasattr(self.base_toolset, 'close'):
            await self.base_toolset.close()