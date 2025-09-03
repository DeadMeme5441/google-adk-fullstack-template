"""
Comprehensive Examples for OpenAPI Tools Template Framework

This file demonstrates how to register different types of tools:
1. External REST APIs (GitHub, Weather APIs)
2. FastMCP servers 
3. Custom Python handlers

These examples show the full capabilities of the Python-based tool registration system.
Run this file or import specific functions to register tools for your agent.
"""

import os
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from loguru import logger

# Import the registration functions
from tools import (
    register_api_tool,
    register_fastmcp_tool, 
    register_custom_tool,
    list_registered_tools
)


def register_github_api():
    """Register GitHub API as a tool with authentication.
    
    This example shows how to integrate a real-world API with authentication.
    Requires GITHUB_TOKEN environment variable.
    """
    
    register_api_tool(
        name="github",
        base_url="https://api.github.com",
        auth={
            "type": "bearer",
            "token_env": "GITHUB_TOKEN"  # Set this environment variable
        },
        # Optional: Limit to specific operations (remove for all operations)
        operations=[
            "repos/list-for-authenticated-user",
            "repos/get", 
            "repos/list-commits",
            "issues/list-for-repo",
            "pulls/list"
        ],
        tags=["GitHub", "Version Control"],
        enabled=True
    )
    
    logger.info("Registered GitHub API tool - requires GITHUB_TOKEN env var")


def register_weather_api():
    """Register OpenWeatherMap API as a tool with API key authentication.
    
    This example shows API key authentication in query parameters.
    Requires OPENWEATHER_API_KEY environment variable.
    """
    
    register_api_tool(
        name="weather",
        base_url="https://api.openweathermap.org/data/2.5",
        auth={
            "type": "api_key",
            "key_env": "OPENWEATHER_API_KEY",  # Set this environment variable
            "location": "query",  # API key goes in query params
            "key_name": "appid"   # Parameter name for the API key
        },
        # Focus on current weather and forecasts
        operations=[
            "weather",  # Current weather
            "forecast", # 5-day forecast
            "onecall"   # One call API
        ],
        tags=["Weather", "Data"],
        enabled=True
    )
    
    logger.info("Registered OpenWeatherMap API tool - requires OPENWEATHER_API_KEY env var")


def register_jsonplaceholder_demo():
    """Register JSONPlaceholder API as a tool (no authentication).
    
    This is a demo API that doesn't require authentication - useful for testing.
    """
    
    register_api_tool(
        name="jsonplaceholder",
        base_url="https://jsonplaceholder.typicode.com",
        # No auth needed for this demo API
        auth=None,
        operations=[
            "posts",    # Get posts
            "users",    # Get users  
            "comments", # Get comments
            "albums",   # Get albums
            "todos"     # Get todos
        ],
        tags=["Demo", "Testing"],
        enabled=True
    )
    
    logger.info("Registered JSONPlaceholder demo API tool - no authentication required")


def register_fastmcp_analysis_server():
    """Register a FastMCP analysis server as a tool.
    
    This example shows how to integrate FastMCP servers that provide
    advanced analysis capabilities through the MCP protocol.
    
    Assumes you have a FastMCP server running on localhost:9000.
    """
    
    register_fastmcp_tool(
        name="analysis_server",
        server_url="http://localhost:9000",
        auth=None,  # No auth for local server
        tags=["Analysis", "FastMCP"],
        enabled=False  # Disabled by default - enable when you have a FastMCP server running
    )
    
    logger.info("Registered FastMCP analysis server tool - enable when server is running on port 9000")


def register_fastmcp_with_auth():
    """Register a FastMCP server with authentication.
    
    This example shows how to proxy authenticated FastMCP servers.
    """
    
    register_fastmcp_tool(
        name="secure_fastmcp",
        server_url="https://my-fastmcp-server.com",
        auth={
            "type": "bearer",
            "token_env": "FASTMCP_TOKEN"
        },
        tags=["FastMCP", "Secure"],
        enabled=False  # Disabled by default - configure for your FastMCP server
    )
    
    logger.info("Registered secure FastMCP server tool - requires FASTMCP_TOKEN env var")


async def custom_calculator_handler(path: str, request: Request):
    """Custom tool handler for calculator operations.
    
    This example shows how to create custom tools with Python handlers.
    Handles basic math operations through HTTP requests.
    """
    
    try:
        # Parse the operation from the path
        if path == "add":
            if request.method == "POST":
                data = await request.json()
                a = data.get("a", 0)
                b = data.get("b", 0)
                result = a + b
                return JSONResponse({"operation": "add", "a": a, "b": b, "result": result})
        
        elif path == "multiply":
            if request.method == "POST":
                data = await request.json()
                a = data.get("a", 1)
                b = data.get("b", 1) 
                result = a * b
                return JSONResponse({"operation": "multiply", "a": a, "b": b, "result": result})
        
        elif path == "":
            # Root path - return available operations
            return JSONResponse({
                "calculator": "Custom Calculator Tool",
                "operations": ["add", "multiply"],
                "usage": {
                    "add": "POST /tools/calculator/add with {\"a\": 1, \"b\": 2}",
                    "multiply": "POST /tools/calculator/multiply with {\"a\": 3, \"b\": 4}"
                }
            })
        
        else:
            raise HTTPException(status_code=404, detail=f"Operation '{path}' not found")
            
    except Exception as e:
        logger.error(f"Error in calculator handler: {e}")
        raise HTTPException(status_code=500, detail="Calculator error")


def register_custom_calculator():
    """Register a custom calculator tool with Python handler.
    
    This example shows how to create custom tools that are implemented
    directly in Python rather than proxying to external services.
    """
    
    register_custom_tool(
        name="calculator",
        handler=custom_calculator_handler,
        methods=["GET", "POST"],
        tags=["Calculator", "Custom", "Math"],
        enabled=True
    )
    
    logger.info("Registered custom calculator tool - handles math operations")


async def custom_system_info_handler(path: str, request: Request):
    """Custom tool handler for system information.
    
    Returns information about the current system and environment.
    """
    
    try:
        if path == "" or path == "info":
            # System information
            info = {
                "system_info": {
                    "platform": os.name,
                    "environment_variables": len(os.environ),
                    "current_working_directory": os.getcwd()
                },
                "application_info": {
                    "tools_registered": len([t for tools in list_registered_tools().values() for t in tools]),
                    "available_endpoints": ["/tools/system_info/info", "/tools/system_info/env"]
                }
            }
            return JSONResponse(info)
        
        elif path == "env":
            # Environment variables (non-sensitive ones)
            safe_env = {k: v for k, v in os.environ.items() 
                       if not any(sensitive in k.lower() 
                                for sensitive in ['key', 'secret', 'password', 'token'])}
            return JSONResponse({"environment_variables": safe_env})
        
        else:
            raise HTTPException(status_code=404, detail=f"Path '{path}' not found")
            
    except Exception as e:
        logger.error(f"Error in system info handler: {e}")
        raise HTTPException(status_code=500, detail="System info error")


def register_custom_system_info():
    """Register a custom system info tool.
    
    This tool provides information about the current system and application state.
    """
    
    register_custom_tool(
        name="system_info",
        handler=custom_system_info_handler,
        methods=["GET"],
        tags=["System", "Info", "Debug"],
        enabled=True
    )
    
    logger.info("Registered custom system info tool - provides system information")


def register_all_examples():
    """Register all example tools.
    
    Call this function to register all the example tools at once.
    Note: APIs requiring authentication will only work if you set the required environment variables.
    """
    
    logger.info("Registering all example tools...")
    
    # External APIs
    register_github_api()
    register_weather_api() 
    register_jsonplaceholder_demo()
    
    # FastMCP servers
    register_fastmcp_analysis_server()
    register_fastmcp_with_auth()
    
    # Custom tools
    register_custom_calculator()
    register_custom_system_info()
    
    # Log summary
    registered = list_registered_tools()
    total_tools = sum(len(tools) for tools in registered.values())
    
    logger.info(f"Registered {total_tools} example tools:")
    for tool_type, tools in registered.items():
        if tools:
            logger.info(f"  {tool_type}: {list(tools.keys())}")
    
    logger.info("Example tools registration complete!")


def register_production_examples():
    """Register only production-ready examples.
    
    This registers a smaller set of tools that don't require external dependencies
    and are suitable for production environments.
    """
    
    logger.info("Registering production-ready example tools...")
    
    # Demo API (no auth required)
    register_jsonplaceholder_demo()
    
    # Custom tools (no external dependencies)
    register_custom_calculator()
    register_custom_system_info()
    
    logger.info("Production-ready example tools registered!")


# Example of conditional registration based on environment variables
def register_authenticated_examples():
    """Register examples that require authentication.
    
    Only registers tools if the required environment variables are present.
    """
    
    logger.info("Checking for authenticated API examples...")
    
    # Register GitHub API if token is available
    if os.getenv("GITHUB_TOKEN"):
        register_github_api()
        logger.info("✓ GitHub API registered (GITHUB_TOKEN found)")
    else:
        logger.info("✗ GitHub API skipped (GITHUB_TOKEN not set)")
    
    # Register Weather API if key is available
    if os.getenv("OPENWEATHER_API_KEY"):
        register_weather_api()
        logger.info("✓ Weather API registered (OPENWEATHER_API_KEY found)")
    else:
        logger.info("✗ Weather API skipped (OPENWEATHER_API_KEY not set)")
    
    # Register authenticated FastMCP if token is available
    if os.getenv("FASTMCP_TOKEN"):
        register_fastmcp_with_auth()
        logger.info("✓ Authenticated FastMCP registered (FASTMCP_TOKEN found)")
    else:
        logger.info("✗ Authenticated FastMCP skipped (FASTMCP_TOKEN not set)")


if __name__ == "__main__":
    """
    If this file is run directly, register all example tools.
    
    Usage:
        python backend/tools/examples.py  # Register all examples
    """
    
    print("OpenAPI Tools Template Framework - Examples")
    print("=" * 50)
    print()
    
    # Register all examples
    register_all_examples()
    
    print()
    print("All example tools have been registered!")
    print()
    print("To use these tools:")
    print("1. Set required environment variables (GITHUB_TOKEN, OPENWEATHER_API_KEY, etc.)")
    print("2. Start your FastAPI server: python backend/main.py")
    print("3. Visit http://localhost:8000/docs to see all available tool endpoints")
    print("4. Your ADK agent will automatically have access to all registered tools")
    print()
    print("For production use, call register_production_examples() or register specific tools individually.")