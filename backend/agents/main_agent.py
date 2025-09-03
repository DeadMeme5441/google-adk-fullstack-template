"""Generic AI Agent Definition - Customize for your use case"""

import os
from google.adk.agents import Agent
from google.adk.tools import google_search
from loguru import logger

# Import configuration system
from config import settings

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
    
    2. **Problem Solving**:
       - Break down complex problems into manageable parts
       - Apply logical reasoning and critical thinking
       - Offer creative solutions and alternatives
    
    3. **Communication**:
       - Explain complex concepts clearly
       - Adapt communication style to user needs
       - Provide structured, well-organized responses
    
    4. **Research & Learning**:
       - Stay updated with current information through web search
       - Cross-reference multiple sources for accuracy
       - Provide citations and sources when relevant
    
    **Instructions for responses**:
    - Be helpful, accurate, and professional
    - Use web search when you need current or specific information
    - Provide clear, actionable insights
    - Structure your responses logically
    - Ask clarifying questions when needed
    
    **Customization Note**: 
    This is a generic agent template. Customize the name, description, instructions, 
    tools, and context for your specific use case by modifying this file or using 
    environment variables.""",
    
    # Tools available to the agent - customize as needed
    tools=[google_search],
    
    # Agent context - customize for your domain
    context={
        "agent_type": "Generic Assistant",
        "capabilities": [
            "Web Search", 
            "Information Analysis", 
            "Problem Solving", 
            "Research Assistance"
        ],
        "template_version": "1.0.0",
        "customization_guide": "Edit this file to customize for your specific use case"
    }
)

logger.info(f"Agent '{settings.agent_name}' initialized successfully")
logger.info(f"Model provider: {settings.model_provider}")
logger.info(f"Model: {settings.agent_model}")