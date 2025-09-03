"""
Factory for creating MCPToolsets using FastMCP integration.

This factory creates FastMCP servers from OpenAPI specifications and then 
connects to them using Google ADK's MCPToolset, enabling the full MCP ecosystem.
"""

import os
import json
import yaml
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from google.adk.tools.base_toolset import BaseToolset
from mcp import StdioServerParameters

from .config import OpenAPIToolConfig


class FastMCPToolsetFactory:
    """Factory for creating MCPToolsets via FastMCP from OpenAPI specifications."""
    
    def __init__(self, specs_dir: Path, host: str = "localhost", port_range: tuple[int, int] = (9000, 9100)):
        """Initialize factory with directory containing OpenAPI specs.
        
        Args:
            specs_dir: Path to directory containing OpenAPI specification files
            host: Host for FastMCP servers
            port_range: Port range for auto-assigning FastMCP servers
        """
        self.specs_dir = specs_dir
        self.host = host
        self.port_range = port_range
        self._next_port = port_range[0]
        self._created_servers: Dict[str, Dict[str, Any]] = {}
    
    def create_toolset(
        self, 
        api_name: str, 
        config: OpenAPIToolConfig
    ) -> Optional[BaseToolset]:
        """Create an MCPToolset via FastMCP from configuration.
        
        Args:
            api_name: Name identifier for this API
            config: Configuration for this API
            
        Returns:
            MCPToolset instance or None if creation failed
        """
        if not config.enabled:
            print(f"Skipping disabled API: {api_name}")
            return None
            
        spec_path = self.specs_dir / config.spec_file
        if not spec_path.exists():
            print(f"Warning: OpenAPI spec not found: {spec_path}")
            return None
        
        try:
            # Create FastMCP server configuration
            server_config = self._create_fastmcp_server_config(api_name, config, spec_path)
            
            # Create MCPToolset that connects to the FastMCP server
            print(f"Creating MCPToolset for {api_name} (FastMCP integration)")
            toolset = MCPToolset(
                connection_params=StdioConnectionParams(
                    server_params=StdioServerParameters(
                        command='python',
                        args=['-m', 'fastmcp.cli', 'run', server_config['config_file']],
                        # Pass environment variables for auth
                        env=self._get_server_env(config)
                    ),
                ),
                tool_filter=config.operation_filter,  # MCPToolset supports filtering directly
            )
            
            # Store server info for cleanup
            self._created_servers[api_name] = server_config
            
            return toolset
            
        except Exception as e:
            print(f"Error creating FastMCP toolset for {api_name}: {e}")
            return None
    
    def _create_fastmcp_server_config(
        self, 
        api_name: str, 
        config: OpenAPIToolConfig,
        spec_path: Path
    ) -> Dict[str, Any]:
        """Create FastMCP server configuration from OpenAPI spec."""
        
        # Load the OpenAPI spec
        spec_content = self._load_spec_file(spec_path)
        
        # Override server URL if specified
        if config.server_url:
            spec_content = self._override_server_url(spec_content, config.server_url)
        
        # Assign port
        port = config.fastmcp_port or self._get_next_port()
        
        # Create FastMCP configuration
        fastmcp_config = {
            "name": f"{api_name}_mcp_server",
            "description": f"MCP server for {api_name} API via FastMCP",
            "server": {
                "host": self.host,
                "port": port
            },
            "openapi": {
                "spec": spec_content,
                "auth": self._create_auth_config(config) if config.auth_scheme else None
            }
        }
        
        # Save configuration file
        config_dir = self.specs_dir.parent / "fastmcp_servers"
        config_dir.mkdir(exist_ok=True)
        config_file = config_dir / f"{api_name}_server.json"
        
        with open(config_file, 'w') as f:
            json.dump(fastmcp_config, f, indent=2)
        
        return {
            "config_file": str(config_file),
            "port": port,
            "host": self.host
        }
    
    def _load_spec_file(self, spec_path: Path) -> Dict[str, Any]:
        """Load OpenAPI specification from file."""
        content = spec_path.read_text()
        
        if spec_path.suffix in ['.yaml', '.yml']:
            return yaml.safe_load(content)
        else:
            return json.loads(content)
    
    def _override_server_url(self, spec: Dict[str, Any], server_url: str) -> Dict[str, Any]:
        """Override the server URL in the OpenAPI specification."""
        spec = spec.copy()
        spec['servers'] = [{'url': server_url}]
        return spec
    
    def _create_auth_config(self, config: OpenAPIToolConfig) -> Dict[str, Any]:
        """Create FastMCP authentication configuration."""
        if config.auth_scheme == "api_key":
            return {
                "type": "api_key",
                "credential_env": config.auth_credential
            }
        elif config.auth_scheme == "bearer_token":
            return {
                "type": "bearer",
                "credential_env": config.auth_credential
            }
        elif config.auth_scheme == "basic":
            return {
                "type": "basic",
                "credential_env": config.auth_credential
            }
        else:
            return {
                "type": config.auth_scheme,
                "credential_env": config.auth_credential
            }
    
    def _get_server_env(self, config: OpenAPIToolConfig) -> Dict[str, str]:
        """Get environment variables for the FastMCP server process."""
        env = os.environ.copy()
        
        # Add authentication environment variable if specified
        if config.auth_credential and config.auth_credential.isupper():
            # If it's an env var name, make sure it's passed through
            if config.auth_credential in os.environ:
                env[config.auth_credential] = os.environ[config.auth_credential]
        
        return env
    
    def _get_next_port(self) -> int:
        """Get next available port in the configured range."""
        port = self._next_port
        self._next_port += 1
        
        if self._next_port > self.port_range[1]:
            print(f"Warning: Exceeded port range {self.port_range}")
            self._next_port = self.port_range[0]  # Wrap around
        
        return port
    
    def cleanup_servers(self):
        """Clean up created FastMCP server configuration files."""
        for api_name, server_info in self._created_servers.items():
            config_file = Path(server_info['config_file'])
            if config_file.exists():
                config_file.unlink()
                print(f"Cleaned up FastMCP config for {api_name}")
        
        self._created_servers.clear()


# Alternative implementation using FastMCP Python API directly (if available)
class DirectFastMCPToolset(BaseToolset):
    """A toolset that runs FastMCP servers directly in Python.
    
    This approach creates FastMCP servers directly in the same process
    rather than spawning separate server processes.
    """
    
    def __init__(self, api_name: str, config: OpenAPIToolConfig, spec_content: Dict[str, Any]):
        super().__init__()
        self.api_name = api_name
        self.config = config
        self.spec_content = spec_content
        self._fastmcp_app = None
        self._server_process = None
    
    async def get_tools(self, readonly_context=None):
        """Get tools by creating a FastMCP server and connecting via MCP."""
        # This would require FastMCP to expose a Python API for programmatic use
        # For now, we'll use the stdio approach above
        
        try:
            # Import fastmcp (when available)
            from fastmcp import FastMCP
            
            # Create FastMCP app from OpenAPI spec
            self._fastmcp_app = FastMCP.from_openapi(
                self.spec_content,
                name=f"{self.api_name}_server"
            )
            
            # This would return MCP-compatible tools
            # Implementation depends on FastMCP's Python API
            return []
            
        except ImportError:
            print("FastMCP Python API not available, falling back to stdio approach")
            return []
        except Exception as e:
            print(f"Error creating direct FastMCP toolset: {e}")
            return []
    
    async def close(self):
        """Clean up FastMCP server."""
        if self._fastmcp_app:
            # Clean up FastMCP app
            pass
        if self._server_process:
            self._server_process.terminate()
            await self._server_process.wait()