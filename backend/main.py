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

# Create the FastAPI app
app: FastAPI = adk_web_server.get_fast_api_app(
    allow_origins=settings.allowed_origins,
)

# Add auth service to app state for dependency injection
app.state.auth_service = auth_service

# Include auth router
app.include_router(auth_router)

# Include tools router
tools_router = get_tools_router()
app.include_router(tools_router)

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
    await auth_service.init()

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
