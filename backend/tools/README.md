# OpenAPI Tools Template Framework

A powerful template framework for automatically integrating OpenAPI-based REST APIs into Google ADK agents. This framework supports both direct OpenAPI integration and MCP (Model Context Protocol) integration via FastMCP.

## 🚀 Quick Start

1. **Edit the configuration file**:
   ```bash
   nano backend/tools/tools_config.yaml
   ```

2. **Add your API** (example):
   ```yaml
   apis:
     my_api:
       spec_source: "https://api.example.com/openapi.json"
       integration_method: direct
       operation_filter: ["getUsers", "createUser"]
       tool_prefix: "user_"
       auth_scheme: "api_key"
       auth_credential: "MY_API_KEY"
       enabled: true
   ```

3. **Set environment variables** (if using auth):
   ```bash
   export MY_API_KEY="your-api-key-here"
   ```

4. **Start your agent** - tools are automatically loaded!

## 🏗️ Architecture

This framework provides two integration patterns:

### Direct Integration (Recommended)
```
OpenAPI Spec → Google ADK OpenAPIToolset → RestApiTool instances
```
- **Pros**: Simple, fast, fewer dependencies
- **Cons**: Limited to ADK ecosystem
- **Best for**: Most use cases, production deployments

### FastMCP Integration (Advanced)
```
OpenAPI Spec → FastMCP Server → MCP Protocol → Google ADK MCPToolset
```
- **Pros**: Access to MCP ecosystem, protocol standardization
- **Cons**: More complex, additional processes
- **Best for**: Integration with MCP tools, complex workflows

## 📁 Project Structure

```
backend/tools/
├── __init__.py              # Clean API exports
├── config.py                # Configuration data models
├── registry.py              # Central toolset registry
├── spec_loader.py           # URL/file loading with caching
├── openapi_toolset_factory.py   # Direct OpenAPI integration
├── fastmcp_toolset_factory.py   # FastMCP integration
├── tools_config.yaml        # Main configuration file
├── openapi_specs/           # Local OpenAPI specification files
├── fastmcp_servers/         # Generated FastMCP server configs
├── cache/                   # Cached downloaded specs
└── README.md               # This file
```

## ⚙️ Configuration Reference

### Basic Configuration

```yaml
# tools_config.yaml
default_integration_method: direct
openapi_specs_dir: openapi_specs
fastmcp_host: localhost
fastmcp_port_range: [9000, 9100]

apis:
  petstore:
    spec_source: "https://petstore3.swagger.io/api/v3/openapi.json"
    integration_method: direct
    enabled: true
```

### Advanced Configuration

```yaml
apis:
  advanced_api:
    # Spec source (URL or local file)
    spec_source: "https://api.example.com/openapi.json"
    
    # Integration method
    integration_method: direct  # or "fastmcp"
    
    # Tool filtering
    operation_filter:
      - "getUsers"
      - "createUser"
      - "updateUser"
    tool_prefix: "user_"
    
    # Authentication
    auth_scheme: "api_key"      # api_key, bearer_token, basic
    auth_credential: "MY_API_KEY_ENV_VAR"
    
    # Server override
    server_url: "https://staging.example.com"
    
    # Caching (for URL-based specs)
    cache_spec: true
    cache_ttl: 3600  # 1 hour
    
    # FastMCP specific
    fastmcp_port: 9001
    
    enabled: true
```

### Spec Sources

The framework supports multiple spec source types:

```yaml
# URL-based (most common)
spec_source: "https://api.example.com/openapi.json"

# Local file (relative to openapi_specs/)
spec_source: "my_api.yaml"

# GitHub raw file
spec_source: "https://raw.githubusercontent.com/user/repo/main/openapi.yaml"
```

## 🔧 Usage Examples

### Basic Usage (Automatic)

The framework integrates automatically with your agent:

```python
# agents/main_agent.py
from tools import ToolRegistry

def get_agent_tools():
    tools = [google_search]  # Start with built-in tools
    
    # Add OpenAPI tools automatically
    registry = ToolRegistry()
    tools.extend(registry.get_all_toolsets())
    
    return tools

root_agent = Agent(
    name="My Agent",
    tools=get_agent_tools(),
    # ... other config
)
```

### Programmatic Usage

```python
from tools import ToolRegistry

# Initialize registry
registry = ToolRegistry()

# Add API dynamically
registry.add_api(
    api_name="github",
    spec_source="https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json",
    integration_method="direct",
    auth_scheme="bearer_token",
    auth_credential="GITHUB_TOKEN",
    operation_filter=["repos/list-for-authenticated-user", "repos/get"],
    enabled=True
)

# Get specific toolset
github_toolset = registry.get_toolset("github")

# List all available APIs
apis = registry.list_available_apis()
```

### Custom Factory Usage

```python
from pathlib import Path
from tools.openapi_toolset_factory import OpenAPIToolsetFactory
from tools.config import OpenAPIToolConfig

# Create factory
factory = OpenAPIToolsetFactory(Path("tools/openapi_specs"))

# Create toolset
config = OpenAPIToolConfig(
    spec_source="https://api.example.com/openapi.json",
    integration_method="direct",
    enabled=True
)

toolset = factory.create_toolset("my_api", config)
```

## 🔐 Authentication

The framework supports multiple authentication methods:

### API Key Authentication
```yaml
auth_scheme: "api_key"
auth_credential: "MY_API_KEY"  # Environment variable name
```

Set the environment variable:
```bash
export MY_API_KEY="your-key-here"
```

### Bearer Token Authentication
```yaml
auth_scheme: "bearer_token"
auth_credential: "BEARER_TOKEN"
```

### Basic Authentication
```yaml
auth_scheme: "basic"
auth_credential: "BASIC_AUTH_TOKEN"  # base64 encoded user:pass
```

### Custom Authentication
```yaml
auth_scheme: "custom"
auth_credential: "CUSTOM_AUTH_HEADER"
```

## 📦 Integration Methods

### Direct Integration (Default)

Uses Google ADK's built-in `OpenAPIToolset`:

```yaml
integration_method: direct
```

**Benefits**:
- Simple setup
- Fast execution
- Native ADK integration
- Production ready

**Best for**: Most use cases, production deployments

### FastMCP Integration

Uses FastMCP to create MCP servers from OpenAPI specs:

```yaml
integration_method: fastmcp
```

**Benefits**:
- MCP ecosystem access
- Protocol standardization
- Advanced routing capabilities
- Integration with other MCP tools

**Best for**: Complex workflows, MCP ecosystem integration

**Requirements**:
- FastMCP dependency (automatically installed)
- Additional server processes

## 🚀 Advanced Features

### Caching

URL-based specs are automatically cached for performance:

```yaml
cache_spec: true      # Enable caching
cache_ttl: 3600      # Cache for 1 hour
```

Cache files are stored in `tools/cache/`.

### Tool Filtering

Limit which API operations are exposed:

```yaml
operation_filter:
  - "getUsers"
  - "createUser"
  - "deleteUser"
```

### Tool Prefixing

Add prefixes to avoid naming conflicts:

```yaml
tool_prefix: "api_"  # Creates tools like "api_getUsers"
```

### Server URL Override

Override the base URL from the OpenAPI spec:

```yaml
server_url: "https://staging.example.com"
```

## 🛠️ Development

### Adding a New API

1. **Edit configuration**:
   ```yaml
   apis:
     new_api:
       spec_source: "https://api.example.com/openapi.json"
       integration_method: direct
       enabled: true
   ```

2. **Test the integration**:
   ```bash
   cd backend
   uv run python -c "
   from tools import ToolRegistry
   registry = ToolRegistry()
   apis = registry.list_available_apis()
   print(apis)
   "
   ```

### Debugging

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Custom Integration

Create custom toolset factories by extending the base classes:

```python
from tools.openapi_toolset_factory import OpenAPIToolsetFactory

class CustomToolsetFactory(OpenAPIToolsetFactory):
    def create_toolset(self, api_name, config):
        # Custom logic here
        return super().create_toolset(api_name, config)
```

## 📋 Common Patterns

### Public APIs

```yaml
# No authentication required
apis:
  public_api:
    spec_source: "https://jsonplaceholder.typicode.com/openapi.json"
    integration_method: direct
    enabled: true
```

### Authenticated APIs

```yaml
# With API key
apis:
  weather_api:
    spec_source: "https://api.openweathermap.org/data/2.5/openapi.json"
    auth_scheme: "api_key"
    auth_credential: "OPENWEATHER_API_KEY"
    enabled: true
```

### Local Development APIs

```yaml
# Local development server
apis:
  local_api:
    spec_source: "local_api.yaml"
    server_url: "http://localhost:3001"
    integration_method: direct
    enabled: true
```

### Microservices Architecture

```yaml
# Multiple related services
apis:
  user_service:
    spec_source: "https://users.mycompany.com/openapi.json"
    tool_prefix: "user_"
    enabled: true
    
  order_service:
    spec_source: "https://orders.mycompany.com/openapi.json"
    tool_prefix: "order_"
    enabled: true
```

## 🐛 Troubleshooting

### Common Issues

1. **"OpenAPI spec not found"**
   - Check the `spec_source` URL or file path
   - Verify network connectivity for URLs
   - Check file permissions for local files

2. **"Authentication failed"**
   - Verify environment variable is set
   - Check auth scheme matches API requirements
   - Test API credentials manually

3. **"No tools generated"**
   - Check if `enabled: true` is set
   - Verify OpenAPI spec has valid operations
   - Check operation_filter if specified

4. **"FastMCP server failed to start"**
   - Check port availability
   - Verify FastMCP installation
   - Check server logs for errors

### Debug Commands

```bash
# Test spec loading
cd backend
uv run python -c "
from tools.spec_loader import load_spec_sync
spec = load_spec_sync('https://api.example.com/openapi.json')
print(f'Loaded {len(spec.get(\"paths\", {}))} endpoints')
"

# List configured APIs
uv run python -c "
from tools import ToolRegistry
registry = ToolRegistry()
print(registry.list_available_apis())
"

# Test toolset creation
uv run python -c "
from tools import ToolRegistry
registry = ToolRegistry()
toolsets = registry.get_all_toolsets()
print(f'Created {len(toolsets)} toolsets')
"
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-integration-method`
3. **Make changes** to the tools framework
4. **Test thoroughly** with different OpenAPI specs
5. **Submit a pull request**

### Development Setup

```bash
cd backend
uv sync
uv run pytest tests/  # Run tests (when available)
```

## 📄 License

This template framework is part of the Google ADK Fullstack Template and follows the same license terms as the parent project.

---

**Happy building! 🚀**

For more information, see the main project README or check out the [Google ADK documentation](https://adk.dev).