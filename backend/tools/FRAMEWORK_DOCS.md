# OpenAPI Tools Template Framework

A powerful Python-based system for integrating external APIs, FastMCP servers, and custom tools into Google ADK agents. This framework automatically generates FastAPI endpoints and unified OpenAPI specifications, making all tools accessible to your agents through a single interface.

## 🚀 Quick Start

### 1. Register Your First Tool

Edit `backend/tools/integrations.py`:

```python
from tools import register_api_tool

# Register an external API
register_api_tool(
    name="github",
    base_url="https://api.github.com",
    auth={
        "type": "bearer",
        "token_env": "GITHUB_TOKEN"
    },
    enabled=True
)
```

### 2. Set Environment Variables

```bash
export GITHUB_TOKEN="your_github_token_here"
```

### 3. Start Your Server

```bash
cd backend
python main.py
```

### 4. Test Your Tool

Visit `http://localhost:8000/docs` to see your tool endpoints under `/tools/github/`

Your ADK agent automatically has access to all registered tools! ✨

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ADK Agent     │───▶│  Unified OpenAPI │───▶│   FastAPI App   │
│                 │    │  Specification   │    │                 │
└─────────────────┘    │ localhost:8000/  │    │  /tools/*       │
                       │  openapi.json    │    │  endpoints      │
                       └──────────────────┘    └─────────────────┘
                                                        │
                       ┌────────────────────────────────┼────────────────────────────────┐
                       │                                │                                │
                       ▼                                ▼                                ▼
               ┌───────────────┐                ┌──────────────┐                ┌──────────────┐
               │  External     │                │   FastMCP    │                │   Custom     │
               │  REST APIs    │                │   Servers    │                │   Python     │
               │               │                │              │                │   Handlers   │
               │ • GitHub      │                │ • Analysis   │                │ • Calculator │
               │ • Weather     │                │ • Tools      │                │ • System Info│
               │ • Custom APIs │                │ • Services   │                │ • Business   │
               └───────────────┘                └──────────────┘                └──────────────┘
```

### Key Components

1. **ToolRegistry**: Central registry that manages all registered tools
2. **Proxy Handlers**: Handle authentication and request forwarding
3. **Dynamic Router**: Generates FastAPI endpoints automatically  
4. **Unified OpenAPI**: Single specification that includes all tools
5. **ADK Integration**: Agent consumes tools via OpenAPIToolset

---

## 🔧 Tool Types

### 1. External REST APIs (`register_api_tool`)

Perfect for integrating with existing APIs like GitHub, weather services, or custom backends.

```python
register_api_tool(
    name="weather",
    base_url="https://api.openweathermap.org/data/2.5", 
    auth={
        "type": "api_key",
        "key_env": "OPENWEATHER_API_KEY",
        "location": "query",
        "key_name": "appid"
    },
    operations=["weather", "forecast"],  # Optional: specific endpoints
    tags=["Weather", "Data"],
    enabled=True
)
```

### 2. FastMCP Servers (`register_fastmcp_tool`)

Integrate FastMCP servers that provide advanced MCP protocol capabilities via HTTP.

```python
register_fastmcp_tool(
    name="analysis_server",
    server_url="http://localhost:9000",
    auth=None,  # Or add authentication
    tags=["Analysis", "FastMCP"],
    enabled=True
)
```

### 3. Custom Python Tools (`register_custom_tool`)

Create tools with custom Python handlers for business logic, calculations, or internal services.

```python
async def my_handler(path: str, request: Request):
    if path == "calculate":
        data = await request.json()
        result = data["a"] + data["b"]
        return JSONResponse({"result": result})
    return JSONResponse({"error": "Not found"})

register_custom_tool(
    name="calculator",
    handler=my_handler,
    methods=["GET", "POST"],
    tags=["Math", "Custom"],
    enabled=True
)
```

---

**Happy building with the OpenAPI Tools Template Framework! 🚀**