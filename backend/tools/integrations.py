"""
Tool Integration Configuration

This is where you register tools for your ADK agent. Customize this file to add the APIs,
FastMCP servers, and custom tools that your agent needs.

The tools registered here will be automatically available to your agent through the
unified OpenAPI specification at localhost:8000/openapi.json.

Usage:
1. Import and call registration functions in this file
2. Tools are automatically registered when this module is imported
3. Your agent will have access to all registered tools

Examples:
- See tools/examples.py for comprehensive examples
- Copy registration calls from examples.py to this file
- Customize as needed for your specific use case
"""

import os
from loguru import logger

# Import registration functions
from tools import (
    register_api_tool,
    register_fastmcp_tool,
    register_custom_tool
)

# Import examples (optional - for easy access to example registrations)
from tools.examples import (
    register_production_examples,
    register_authenticated_examples,
    register_jsonplaceholder_demo,
    register_custom_calculator,
    register_custom_system_info
)


def register_my_tools():
    """Register tools for your specific use case.
    
    Customize this function to register the tools your agent needs.
    This is the main function you should modify.
    """
    
    logger.info("Registering tools for agent...")
    
    # Example 1: Register production-ready examples (no external dependencies)
    register_production_examples()
    
    # Example 2: Register authenticated APIs if environment variables are set
    register_authenticated_examples() 
    
    # Example 3: Register a specific API tool
    # register_api_tool(
    #     name="my_api",
    #     base_url="https://api.example.com/v1",
    #     auth={
    #         "type": "bearer", 
    #         "token_env": "MY_API_TOKEN"
    #     },
    #     operations=["users", "posts", "comments"],  # Optional: specific endpoints
    #     tags=["MyAPI"],
    #     enabled=True
    # )
    
    # Example 4: Register a FastMCP server
    # register_fastmcp_tool(
    #     name="my_fastmcp_server",
    #     server_url="http://localhost:9000",
    #     auth=None,  # Or add auth if needed
    #     tags=["FastMCP"],
    #     enabled=False  # Enable when you have the server running
    # )
    
    # Example 5: Register a custom tool (see examples.py for handler implementation)
    # register_custom_tool(
    #     name="my_custom_tool",
    #     handler=my_custom_handler,  # Define this function
    #     methods=["GET", "POST"],
    #     tags=["Custom"],
    #     enabled=True
    # )
    
    logger.info("Tool registration complete!")


def register_development_tools():
    """Register tools useful for development and debugging.
    
    These tools are helpful during development but you might not want them in production.
    """
    
    # System info tool for debugging
    register_custom_system_info()
    
    # Calculator tool for testing custom tools
    register_custom_calculator()
    
    # Demo API for testing external API integration
    register_jsonplaceholder_demo()
    
    logger.info("Development tools registered!")


def register_minimal_tools():
    """Register a minimal set of tools for basic functionality.
    
    Use this for production environments where you want minimal dependencies.
    """
    
    # Only register tools that don't require external services
    register_custom_calculator()
    
    logger.info("Minimal tools registered!")


# Choose which registration function to call
# Modify this section based on your environment

if os.getenv("ENVIRONMENT") == "production":
    # Production environment - minimal tools
    register_minimal_tools()
elif os.getenv("ENVIRONMENT") == "development":
    # Development environment - all development tools
    register_development_tools()
else:
    # Default - register user-configured tools
    register_my_tools()


# Alternative: Conditional registration based on environment variables
# Uncomment and modify as needed

# # Only register GitHub API if token is available
# if os.getenv("GITHUB_TOKEN"):
#     register_api_tool(
#         name="github",
#         base_url="https://api.github.com",
#         auth={"type": "bearer", "token_env": "GITHUB_TOKEN"},
#         tags=["GitHub"],
#         enabled=True
#     )

# # Only register Weather API if key is available  
# if os.getenv("OPENWEATHER_API_KEY"):
#     register_api_tool(
#         name="weather",
#         base_url="https://api.openweathermap.org/data/2.5",
#         auth={
#             "type": "api_key",
#             "key_env": "OPENWEATHER_API_KEY",
#             "location": "query", 
#             "key_name": "appid"
#         },
#         tags=["Weather"],
#         enabled=True
#     )

# # FastMCP server (local development)
# if os.getenv("FASTMCP_SERVER_URL"):
#     register_fastmcp_tool(
#         name="local_fastmcp",
#         server_url=os.getenv("FASTMCP_SERVER_URL"),
#         auth=None,
#         tags=["FastMCP", "Local"],
#         enabled=True
#     )


# Instructions for users:
"""
🚀 Quick Start - Registering Your Own Tools

1. **External REST API with Authentication:**
   
   register_api_tool(
       name="my_service",
       base_url="https://api.myservice.com/v1",
       auth={
           "type": "bearer",           # or "api_key", "basic"
           "token_env": "MY_API_TOKEN" # Environment variable name
       },
       operations=["users", "data"],   # Optional: specific endpoints
       enabled=True
   )

2. **FastMCP Server:**
   
   register_fastmcp_tool(
       name="my_fastmcp",
       server_url="http://localhost:9000",
       auth=None,  # Add auth if needed
       enabled=True
   )

3. **Custom Python Tool:**
   
   async def my_handler(path: str, request: Request):
       # Your custom logic here
       return JSONResponse({"message": "Hello from custom tool!"})
   
   register_custom_tool(
       name="my_tool", 
       handler=my_handler,
       methods=["GET", "POST"],
       enabled=True
   )

4. **Environment Variables:**
   Set these in your .env file or environment:
   - GITHUB_TOKEN=your_github_token
   - OPENWEATHER_API_KEY=your_weather_key
   - MY_API_TOKEN=your_api_token

5. **Testing:**
   - Start server: python backend/main.py
   - Visit: http://localhost:8000/docs
   - Check: http://localhost:8000/tools/my_service/endpoint
   - Agent automatically gets access to all tools via OpenAPI spec

6. **Production:**
   - Use register_minimal_tools() or register specific tools only
   - Set ENVIRONMENT=production for minimal tool set
   - Ensure all required environment variables are set securely
"""