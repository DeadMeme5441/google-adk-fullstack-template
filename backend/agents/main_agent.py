"""Generic AI Agent Definition - Customize for your use case"""

import os
from google.adk.agents import Agent
from google.adk.tools import google_search
from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import OpenAPIToolset
from loguru import logger

# Import configuration system
from config import settings

# Import OpenAPI Tools Template Framework
from tools import list_registered_tools

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
    
    # Add unified OpenAPI toolset that includes all registered tools
    try:
        # Check if any tools are registered
        registered_tools = list_registered_tools()
        has_tools = any(registered_tools.values())
        
        if has_tools:
            # Create unified OpenAPIToolset pointing to our FastAPI server
            unified_toolset = OpenAPIToolset(
                spec_str=f"http://localhost:{settings.port}/openapi.json",
                spec_str_type="url"
            )
            tools.append(unified_toolset)
            
            # Log which tools are available
            logger.info("Unified OpenAPI toolset loaded with access to all registered tools:")
            for tool_type, tool_configs in registered_tools.items():
                if tool_configs:
                    logger.info(f"  {tool_type}: {list(tool_configs.keys())}")
        else:
            logger.info("No tools registered. Use register_api_tool(), register_fastmcp_tool(), or register_custom_tool() to add tools.")
            
    except Exception as e:
        logger.warning(f"Error loading unified OpenAPI toolset: {e}")
        logger.warning("Agent will only have access to built-in tools (google_search)")
    
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
    You have access to web search and any tools registered through the Python-based tools system.
    All registered tools are available through a unified OpenAPI interface.
    
    **Template Framework**: 
    This agent uses an OpenAPI Tools Template Framework. Developers can register new tools by calling:
    - register_api_tool() for external REST APIs with authentication
    - register_fastmcp_tool() for FastMCP servers  
    - register_custom_tool() for custom handlers
    
    All tools are automatically exposed through /tools/* endpoints and unified in the OpenAPI spec.""",
    
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
        "customization_guide": "Use register_api_tool(), register_fastmcp_tool(), or register_custom_tool() to add tools programmatically"
    }
)

logger.info(f"Agent '{settings.agent_name}' initialized successfully")
logger.info(f"Model provider: {settings.model_provider}")
logger.info(f"Model: {settings.agent_model}")