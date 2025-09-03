"""
Agent Template - FastAPI Application with Authentication and Google ADK

This is a template for building AI agents with Google ADK that includes:
- JWT-based authentication system
- MongoDB session service for persistent conversations  
- S3 artifact service for file storage
- LiteLLM integration for multiple model providers
- Configurable agent setup via environment variables

Customize the agent in agents/main_agent.py and configuration in config.py
"""

import uvicorn
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from loguru import logger

# Import ADK components
from google.adk.cli.fast_api import AdkWebServer, AgentLoader, LocalEvalSetsManager, LocalEvalSetResultsManager
from google.adk.auth.credential_service.in_memory_credential_service import InMemoryCredentialService

# Import configuration and auth components
from config import settings
from services.auth import AuthService
from services.service_factory import ServiceFactory, get_service_availability
from routes.auth import router as auth_router
from middleware.auth import get_current_user_id

# Import tools system
from tools import get_tools_router, list_registered_tools

# Get the directory where main.py is located
AGENT_DIR = Path(__file__).parent.resolve()

# Log service availability
availability = get_service_availability()
logger.info("Service availability:")
for service, available in availability.items():
    logger.info(f"  {service}: {'✓' if available else '✗'}")

# Get services configuration
services_config = settings.get_services_config()
logger.info("Configured services:")
for service_name, service_type in services_config.get_service_summary().items():
    logger.info(f"  {service_name}: {service_type}")

# Create ADK services using the factory
session_service, memory_service, artifact_service = ServiceFactory.create_all_services(
    session_config=services_config.session_service,
    memory_config=services_config.memory_service,
    artifact_config=services_config.artifact_service
)

# Initialize auth service (SQLite)
auth_service = AuthService(settings=settings)

# Auth database will be initialized via startup event

# Initialize other required services
credential_service = InMemoryCredentialService()
agent_loader = AgentLoader(str(AGENT_DIR))

# Use minimal eval managers (required by AdkWebServer but not actually used)
eval_sets_manager = LocalEvalSetsManager(agents_dir=str(AGENT_DIR))
eval_set_results_manager = LocalEvalSetResultsManager(agents_dir=str(AGENT_DIR))

# Create ADK Web Server with our services
adk_web_server = AdkWebServer(
    agent_loader=agent_loader,
    session_service=session_service,            # Configurable session service
    artifact_service=artifact_service,          # Configurable artifact service
    memory_service=memory_service,              # Configurable memory service
    credential_service=credential_service,
    eval_sets_manager=eval_sets_manager,
    eval_set_results_manager=eval_set_results_manager,
    agents_dir=str(AGENT_DIR),
)

# Custom function to generate cleaner operation IDs
def custom_generate_unique_id(route: APIRoute) -> str:
    """Generate cleaner operation IDs for better client function names."""
    if route.tags:
        # Use first tag + function name for cleaner names
        tag = route.tags[0].lower().replace(" ", "_")
        function_name = route.name
        return f"{tag}_{function_name}"
    else:
        # Fallback to just function name if no tags
        return route.name

# Create the FastAPI app
app: FastAPI = adk_web_server.get_fast_api_app(
    allow_origins=settings.allowed_origins,
)

# Add services to app state for dependency injection
app.state.auth_service = auth_service
app.state.artifact_service = artifact_service

# Include auth router
app.include_router(auth_router)

# Include artifacts router  
from routes.artifacts import router as artifacts_router
app.include_router(artifacts_router)

# Include tools router
tools_router = get_tools_router()
app.include_router(tools_router)

# Apply custom operation IDs to all routes for cleaner client function names
def update_operation_ids():
    """Update operation IDs for all routes to generate cleaner client function names."""
    for route in app.routes:
        if isinstance(route, APIRoute):
            # Generate a cleaner operation ID
            route.operation_id = custom_generate_unique_id(route)
            
# Apply the operation ID updates
update_operation_ids()

# Log registered tools
registered_tools = list_registered_tools()
if any(registered_tools.values()):
    logger.info("Registered tools:")
    for tool_type, tools in registered_tools.items():
        if tools:
            logger.info(f"  {tool_type}:")
            for name, config in tools.items():
                logger.info(f"    - {name}: {config.get('proxy_prefix', f'/tools/{name}')}")
else:
    logger.info("No tools registered. Register tools in agents/main_agent.py or other modules.")

logger.info(f"Services initialized:")

# Ensure auth backend is initialized on startup
@app.on_event("startup")
async def _init_auth_db():
    logger.info("Initializing auth backend via startup event...")
    try:
        await auth_service.init()
        logger.info("Auth backend initialized successfully via startup event")
    except Exception as e:
        logger.error(f"Failed to initialize auth backend via startup event: {e}")
        # Don't re-raise to allow server to start, but log the error
        logger.error("Server will continue without auth database - registration will fail")

# Add custom endpoints if needed
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": settings.agent_name}

@app.get("/info")
async def get_info():
    """Get information about the service"""
    return {
        "name": settings.agent_name,
        "version": "1.0.0",
        "description": settings.agent_description,
        "template": "Google ADK Template with Custom Services",
        "model_provider": settings.model_provider,
        "model": settings.agent_model,
        "services": services_config.get_service_summary(),
        "capabilities": [
            "Web Search",
            "Modular Session Storage",
            "Modular File Storage", 
            "Multi-Model Support"
        ]
    }


if __name__ == "__main__":
    # Use settings for configuration
    logger.info(f"Starting Google ADK Template server: '{settings.agent_name}'")
    logger.info(f"Host: {settings.host}:{settings.port}")
    logger.info(f"Agent directory: {AGENT_DIR}")
    logger.info(f"Model provider: {settings.model_provider}")
    logger.info(f"Model: {settings.agent_model}")
    logger.info(f"Web UI enabled: {settings.serve_web_interface}")
    logger.info("Configured services:")
    for service_name, service_type in services_config.get_service_summary().items():
        logger.info(f"  {service_name}: {service_type}")
    
    # Run the server
    uvicorn.run(
        "main:app",  # Use import string for reload support
        host=settings.host,
        port=settings.port,
        reload=settings.reload_agents,  # Use reload setting from config
        log_level=settings.log_level.lower()
    )
