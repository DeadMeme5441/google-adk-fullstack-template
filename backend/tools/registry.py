"""
Central registry for managing OpenAPI toolsets in the ADK template.

This module provides the main ToolRegistry class that automatically discovers
OpenAPI configurations and creates the appropriate toolsets using either
direct integration or FastMCP.
"""

import os
from pathlib import Path
from typing import List, Dict, Optional, Any

from google.adk.tools.base_toolset import BaseToolset

from .config import ToolsConfig, DEFAULT_CONFIG
from .openapi_toolset_factory import OpenAPIToolsetFactory
from .fastmcp_toolset_factory import FastMCPToolsetFactory


class ToolRegistry:
    """Central registry for managing OpenAPI-based toolsets."""
    
    def __init__(
        self, 
        tools_dir: Optional[Path] = None,
        config_file: Optional[Path] = None,
        config: Optional[ToolsConfig] = None
    ):
        """Initialize the tool registry.
        
        Args:
            tools_dir: Base directory for tools (default: current file's parent)
            config_file: Path to configuration file (default: tools_dir/tools_config.yaml)
            config: Pre-loaded configuration (overrides config_file)
        """
        # Set up directories
        self.tools_dir = tools_dir or Path(__file__).parent
        self.specs_dir = self.tools_dir / "openapi_specs"
        self.cache_dir = self.tools_dir / "cache"
        
        # Load configuration
        if config:
            self.config = config
        else:
            config_path = config_file or (self.tools_dir / "tools_config.yaml")
            self.config = ToolsConfig.load_from_file(config_path)
            
            # Create default config file if it doesn't exist
            if not config_path.exists():
                print(f"Creating default tools configuration: {config_path}")
                DEFAULT_CONFIG.save_to_file(config_path)
                self.config = DEFAULT_CONFIG
        
        # Initialize factories
        self.openapi_factory = OpenAPIToolsetFactory(
            specs_dir=self.specs_dir,
            cache_dir=self.cache_dir
        )
        self.fastmcp_factory = FastMCPToolsetFactory(
            specs_dir=self.specs_dir,
            host=self.config.fastmcp_host,
            port_range=self.config.fastmcp_port_range
        )
        
        # Cache for created toolsets
        self._toolsets: Dict[str, BaseToolset] = {}
        self._initialized = False
    
    def get_all_toolsets(self) -> List[BaseToolset]:
        """Get all enabled toolsets based on configuration.
        
        Returns:
            List of BaseToolset instances ready to use in agents
        """
        if not self._initialized:
            self._create_toolsets()
            self._initialized = True
        
        return list(self._toolsets.values())
    
    def get_toolset(self, api_name: str) -> Optional[BaseToolset]:
        """Get a specific toolset by API name.
        
        Args:
            api_name: Name of the API configuration
            
        Returns:
            BaseToolset instance or None if not found/enabled
        """
        if not self._initialized:
            self._create_toolsets()
            self._initialized = True
        
        return self._toolsets.get(api_name)
    
    def list_available_apis(self) -> Dict[str, Dict[str, Any]]:
        """List all configured APIs and their status.
        
        Returns:
            Dictionary mapping API name to configuration info
        """
        result = {}
        
        for api_name, api_config in self.config.apis.items():
            result[api_name] = {
                "enabled": api_config.enabled,
                "spec_source": api_config.spec_source,
                "integration_method": api_config.integration_method,
                "tool_prefix": api_config.tool_prefix,
                "has_auth": bool(api_config.auth_scheme),
                "operations_filter": api_config.operation_filter
            }
        
        return result
    
    def _create_toolsets(self):
        """Create toolsets for all enabled API configurations."""
        print("Initializing OpenAPI toolsets...")
        
        for api_name, api_config in self.config.apis.items():
            if not api_config.enabled:
                continue
                
            try:
                toolset = self._create_single_toolset(api_name, api_config)
                if toolset:
                    self._toolsets[api_name] = toolset
                    print(f"✓ Created toolset for {api_name} ({api_config.integration_method})")
                else:
                    print(f"✗ Failed to create toolset for {api_name}")
                    
            except Exception as e:
                print(f"✗ Error creating toolset for {api_name}: {e}")
        
        print(f"Initialized {len(self._toolsets)} toolsets")
    
    def _create_single_toolset(self, api_name: str, api_config) -> Optional[BaseToolset]:
        """Create a single toolset based on integration method."""
        
        if api_config.integration_method == "direct":
            return self.openapi_factory.create_toolset(api_name, api_config)
        elif api_config.integration_method == "fastmcp":
            return self.fastmcp_factory.create_toolset(api_name, api_config)
        else:
            print(f"Unknown integration method: {api_config.integration_method}")
            return None
    
    def reload_config(self, config_file: Optional[Path] = None):
        """Reload configuration and recreate toolsets.
        
        Args:
            config_file: Path to configuration file (default: current config path)
        """
        # Close existing toolsets
        self.cleanup()
        
        # Reload config
        config_path = config_file or (self.tools_dir / "tools_config.yaml")
        self.config = ToolsConfig.load_from_file(config_path)
        
        # Reset state
        self._toolsets.clear()
        self._initialized = False
    
    def add_api(
        self, 
        api_name: str, 
        spec_source: str,
        integration_method: str = "direct",
        **kwargs
    ) -> bool:
        """Programmatically add a new API configuration.
        
        Args:
            api_name: Name for the API
            spec_source: URL or file path to OpenAPI spec
            integration_method: 'direct' or 'fastmcp'
            **kwargs: Additional configuration options
            
        Returns:
            True if API was added successfully
        """
        from .config import OpenAPIToolConfig
        
        try:
            # Create config
            api_config = OpenAPIToolConfig(
                spec_source=spec_source,
                integration_method=integration_method,
                **kwargs
            )
            
            # Add to configuration
            self.config.apis[api_name] = api_config
            
            # Create toolset if enabled
            if api_config.enabled:
                toolset = self._create_single_toolset(api_name, api_config)
                if toolset:
                    self._toolsets[api_name] = toolset
                    print(f"✓ Added and created toolset for {api_name}")
                    return True
                else:
                    print(f"✗ Failed to create toolset for {api_name}")
                    return False
            
            print(f"✓ Added configuration for {api_name} (disabled)")
            return True
            
        except Exception as e:
            print(f"✗ Error adding API {api_name}: {e}")
            return False
    
    def enable_api(self, api_name: str) -> bool:
        """Enable a configured API.
        
        Args:
            api_name: Name of the API to enable
            
        Returns:
            True if API was enabled successfully
        """
        if api_name not in self.config.apis:
            print(f"API {api_name} not found in configuration")
            return False
        
        api_config = self.config.apis[api_name]
        if api_config.enabled:
            print(f"API {api_name} is already enabled")
            return True
        
        try:
            # Enable in config
            api_config.enabled = True
            
            # Create toolset
            toolset = self._create_single_toolset(api_name, api_config)
            if toolset:
                self._toolsets[api_name] = toolset
                print(f"✓ Enabled {api_name}")
                return True
            else:
                # Revert on failure
                api_config.enabled = False
                print(f"✗ Failed to enable {api_name}")
                return False
                
        except Exception as e:
            api_config.enabled = False
            print(f"✗ Error enabling {api_name}: {e}")
            return False
    
    def disable_api(self, api_name: str) -> bool:
        """Disable an API.
        
        Args:
            api_name: Name of the API to disable
            
        Returns:
            True if API was disabled successfully
        """
        if api_name not in self.config.apis:
            print(f"API {api_name} not found in configuration")
            return False
        
        try:
            # Disable in config
            self.config.apis[api_name].enabled = False
            
            # Remove and cleanup toolset
            if api_name in self._toolsets:
                toolset = self._toolsets.pop(api_name)
                if hasattr(toolset, 'close'):
                    # For async toolsets, this should be awaited in practice
                    pass
                
            print(f"✓ Disabled {api_name}")
            return True
            
        except Exception as e:
            print(f"✗ Error disabling {api_name}: {e}")
            return False
    
    def cleanup(self):
        """Clean up all toolsets and resources."""
        for api_name, toolset in self._toolsets.items():
            try:
                if hasattr(toolset, 'close'):
                    # For async toolsets, this should be awaited in practice
                    # In a full implementation, you'd want async cleanup
                    pass
            except Exception as e:
                print(f"Error cleaning up {api_name}: {e}")
        
        # Clean up FastMCP servers
        if hasattr(self.fastmcp_factory, 'cleanup_servers'):
            self.fastmcp_factory.cleanup_servers()
        
        self._toolsets.clear()


# Convenience function for simple usage
def get_toolsets(
    config_file: Optional[Path] = None,
    tools_dir: Optional[Path] = None
) -> List[BaseToolset]:
    """Convenience function to get all configured toolsets.
    
    Args:
        config_file: Path to configuration file
        tools_dir: Base tools directory
        
    Returns:
        List of BaseToolset instances
    """
    registry = ToolRegistry(tools_dir=tools_dir, config_file=config_file)
    return registry.get_all_toolsets()