"""Generic AI Agent Definition - Customize for your use case"""

import os
from google.adk.agents import Agent
from google.adk.tools import google_search
from loguru import logger

# Import configuration system
from config import settings

# Import OpenAPI Tools Template Framework
from tools import ToolRegistry

# Optional: Import LiteLLM for non-Google models
try:
    from google.adk.models.lite_llm import LiteLlm
    LITELLM_AVAILABLE = True
except ImportError:
    logger.warning("LiteLLM not available. Install with: pip install litellm")
    LITELLM_AVAILABLE = False

def create_model():
    """Create the appropriate model based on configuration"""
    
    if settings.model_provider == "litellm":
        if not LITELLM_AVAILABLE:
            logger.error("LiteLLM provider selected but litellm not installed. Falling back to Gemini.")
            return settings.agent_model
        
        # Enable debug if requested
        if settings.litellm_debug:
            import litellm
            litellm._turn_on_debug()
        
        # Set environment variables for LiteLLM providers
        if settings.openai_api_key:
            os.environ["OPENAI_API_KEY"] = settings.openai_api_key
        if settings.anthropic_api_key:
            os.environ["ANTHROPIC_API_KEY"] = settings.anthropic_api_key
        if settings.cohere_api_key:
            os.environ["COHERE_API_KEY"] = settings.cohere_api_key
        if settings.ollama_api_base:
            os.environ["OLLAMA_API_BASE"] = settings.ollama_api_base
        if settings.openai_api_base:
            os.environ["OPENAI_API_BASE"] = settings.openai_api_base
            os.environ["OPENAI_API_KEY"] = os.environ.get("OPENAI_API_KEY", "anything")
        
        return LiteLlm(model=settings.agent_model)
    
    else:
        # Use Gemini models (default)
        return settings.agent_model


def get_agent_tools():
    """Get all available tools for the agent"""
    
    # Start with built-in tools
    tools = [google_search]
    
    # Add OpenAPI-based tools from configuration
    try:
        registry = ToolRegistry()
        openapi_toolsets = registry.get_all_toolsets()
        tools.extend(openapi_toolsets)
        
        # Log which APIs are enabled
        available_apis = registry.list_available_apis()
        enabled_apis = [name for name, info in available_apis.items() if info["enabled"]]
        
        if enabled_apis:
            logger.info(f"Loaded OpenAPI tools for: {', '.join(enabled_apis)}")
        else:
            logger.info("No OpenAPI tools enabled. Edit backend/tools/tools_config.yaml to add APIs.")
            
    except Exception as e:
        logger.warning(f"Error loading OpenAPI tools: {e}")
    
    return tools

# Define the root agent - customize this for your specific use case
root_agent = Agent(
    name=settings.agent_name,
    model=create_model(),
    description=settings.agent_description,
    instruction="""You are a helpful AI assistant with the following capabilities:
    
    1. **Information Research & Analysis**:
       - Search the web for current information
       - Analyze and synthesize complex data
       - Provide fact-based insights and recommendations
    
    2. **API Integration & Data Access**:
       - Access external APIs and services through OpenAPI specifications
       - Retrieve and manipulate data from configured APIs
       - Perform CRUD operations on external systems when available
    
    3. **Problem Solving**:
       - Break down complex problems into manageable parts
       - Apply logical reasoning and critical thinking
       - Offer creative solutions and alternatives
    
    4. **Communication**:
       - Explain complex concepts clearly
       - Adapt communication style to user needs
       - Provide structured, well-organized responses
    
    5. **Research & Learning**:
       - Stay updated with current information through web search
       - Cross-reference multiple sources for accuracy
       - Provide citations and sources when relevant
    
    **Instructions for responses**:
    - Be helpful, accurate, and professional
    - Use web search when you need current or specific information
    - Use available API tools when relevant to the user's request
    - Provide clear, actionable insights
    - Structure your responses logically
    - Ask clarifying questions when needed
    
    **Available Tools**: 
    You have access to web search and any OpenAPI-based tools configured in the system.
    Check the available tools and use them appropriately to assist users.
    
    **Template Framework**: 
    This agent uses an OpenAPI Tools Template Framework. Administrators can add new APIs
    by editing backend/tools/tools_config.yaml or using the ToolRegistry programmatically.""",
    
    # Tools available to the agent - customize as needed
    tools=get_agent_tools(),
    
    # Agent context - customize for your domain
    context={
        "agent_type": "OpenAPI-Enabled Assistant",
        "capabilities": [
            "Web Search",
            "OpenAPI Integration", 
            "External API Access",
            "Information Analysis", 
            "Problem Solving", 
            "Research Assistance"
        ],
        "template_version": "1.0.0",
        "framework": "OpenAPI Tools Template Framework",
        "customization_guide": "Edit backend/tools/tools_config.yaml to add APIs, or modify this file for other customizations"
    }
)

logger.info(f"Agent '{settings.agent_name}' initialized successfully")
logger.info(f"Model provider: {settings.model_provider}")
logger.info(f"Model: {settings.agent_model}")