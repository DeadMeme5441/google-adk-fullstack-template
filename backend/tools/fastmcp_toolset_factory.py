"""
Factory for creating OpenAPIToolsets that consume FastMCP HTTP tool servers.

This factory spins up FastMCP HTTP servers dynamically for each configured API,
then creates OpenAPIToolsets that consume these servers via their auto-generated
OpenAPI endpoints. This provides a unified OpenAPI consumption model while 
leveraging FastMCP's advanced capabilities.

Architecture:
- OpenAPI spec → FastMCP.from_openapi() → HTTP server → OpenAPIToolset  
- MCP server → FastMCP.as_proxy() → HTTP server → OpenAPIToolset
"""

import os
import json
import yaml
import asyncio
import httpx
import subprocess
import time
import signal
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset
from google.adk.tools.base_toolset import BaseToolset

from .config import OpenAPIToolConfig
from .spec_loader import load_spec_sync, override_server_url


class ToolServer:
    """Represents a running FastMCP HTTP tool server."""
    
    def __init__(self, name: str, port: int, process: subprocess.Popen, config_file: Path):
        self.name = name
        self.port = port
        self.process = process
        self.config_file = config_file
        self.url = f"http://localhost:{port}"
        self.openapi_url = f"http://localhost:{port}/openapi.json"
    
    def is_running(self) -> bool:
        """Check if the server process is still running."""
        return self.process.poll() is None
    
    def stop(self):
        """Stop the server process."""
        if self.is_running():
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        
        # Clean up config file
        if self.config_file.exists():
            self.config_file.unlink()


class FastMCPToolsetFactory:
    """Factory that spins up FastMCP HTTP servers and creates OpenAPIToolsets to consume them."""
    
    def __init__(self, specs_dir: Path, host: str = "localhost", port_range: tuple[int, int] = (9000, 9100)):
        """Initialize factory for dynamic tool server management.
        
        Args:
            specs_dir: Path to directory containing OpenAPI specification files
            host: Host for FastMCP servers
            port_range: Port range for auto-assigning FastMCP servers
        """
        self.specs_dir = specs_dir
        self.host = host
        self.port_range = port_range
        self._next_port = port_range[0]
        self._tool_servers: Dict[str, ToolServer] = {}
        self._server_configs_dir = specs_dir.parent / "fastmcp_servers"
        self._server_configs_dir.mkdir(exist_ok=True)
    
    def create_toolset(
        self, 
        api_name: str, 
        config: OpenAPIToolConfig
    ) -> Optional[BaseToolset]:
        """Create an OpenAPIToolset that consumes a FastMCP HTTP server.
        
        This method:
        1. Spins up a FastMCP HTTP server for the API
        2. Waits for it to be ready
        3. Creates an OpenAPIToolset pointing to its OpenAPI endpoint
        
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
            # Stop existing server if running
            if api_name in self._tool_servers:
                print(f"Stopping existing tool server for {api_name}")
                self._tool_servers[api_name].stop()
                del self._tool_servers[api_name]
            
            # Start FastMCP HTTP server
            tool_server = self._start_fastmcp_server(api_name, config)
            if not tool_server:
                return None
            
            # Wait for server to be ready
            if not self._wait_for_server_ready(tool_server):
                print(f"FastMCP server for {api_name} failed to start")
                tool_server.stop()
                return None
            
            # Create OpenAPIToolset pointing to the FastMCP server
            print(f"Creating OpenAPIToolset for {api_name} via FastMCP server at {tool_server.openapi_url}")
            
            # Determine auth configuration
            auth_scheme, auth_credential = self._resolve_auth(config)
            
            toolset = OpenAPIToolset(
                spec_str=tool_server.openapi_url,  # Point to FastMCP's OpenAPI endpoint
                spec_str_type="url",
                auth_scheme=auth_scheme,
                auth_credential=auth_credential
            )
            
            # Store the running server
            self._tool_servers[api_name] = tool_server
            
            return toolset
            
        except Exception as e:
            print(f"Error creating FastMCP toolset for {api_name}: {e}")
            # Cleanup on failure
            if api_name in self._tool_servers:
                self._tool_servers[api_name].stop()
                del self._tool_servers[api_name]
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