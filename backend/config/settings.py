"""Configuration management using Pydantic Settings"""

from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

from .services import (
    ServicesConfig,
    parse_session_config,
    parse_memory_config, 
    parse_artifact_config
)


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This configuration supports multiple model providers:
    - Google Gemini (via AI Studio or Vertex AI)
    - LiteLLM integration (OpenAI, Anthropic, Claude, local models via Ollama, etc.)
    - Custom Vertex AI endpoints
    """
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    
    # Agent Configuration
    agent_name: str = Field(
        default="generic_assistant", 
        description="Name of the agent"
    )
    agent_model: str = Field(
        default="gemini-2.0-flash-exp", 
        description="Model to use for the agent (Gemini model ID, LiteLLM format, or Vertex endpoint)"
    )
    agent_description: str = Field(
        default="A helpful AI assistant that can search the web and provide intelligent responses to user queries.",
        description="Description of the agent's capabilities"
    )
    
    # Model Provider Configuration
    model_provider: Literal["gemini", "litellm"] = Field(
        default="gemini",
        description="Model provider to use: 'gemini' for Google models, 'litellm' for other providers"
    )
    
    # Google ADK Configuration (for Gemini models)
    google_genai_use_vertexai: bool = Field(
        default=False, 
        description="Use Vertex AI instead of AI Studio (for Gemini models)"
    )
    google_api_key: Optional[str] = Field(
        default=None,
        description="Google API Key for AI Studio"
    )
    google_cloud_project: Optional[str] = Field(
        default=None,
        description="Google Cloud Project ID (required for Vertex AI)"
    )
    google_cloud_location: Optional[str] = Field(
        default="us-central1",
        description="Google Cloud Location (required for Vertex AI)"
    )
    
    # LiteLLM Configuration (for non-Google models)
    # Common provider API keys - set the ones you need
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API Key (for OpenAI models via LiteLLM)"
    )
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API Key (for Claude models via LiteLLM)"
    )
    cohere_api_key: Optional[str] = Field(
        default=None,
        description="Cohere API Key (for Cohere models via LiteLLM)"
    )
    
    # Local model configuration (for Ollama, vLLM, etc.)
    ollama_api_base: Optional[str] = Field(
        default="http://localhost:11434",
        description="Ollama API base URL (for local models)"
    )
    openai_api_base: Optional[str] = Field(
        default=None,
        description="Custom OpenAI API base URL (for vLLM, local deployments, etc.)"
    )
    
    # LiteLLM Debug
    litellm_debug: bool = Field(
        default=False,
        description="Enable LiteLLM debug logging"
    )
    
    # MongoDB Session Service Configuration
    mongo_url: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URL"
    )
    mongo_db_name: str = Field(
        default="nbfc_analyst_sessions",
        description="MongoDB database name for sessions"
    )
    mongo_collection_name: str = Field(
        default="sessions",
        description="MongoDB collection name for sessions"
    )
    
    # S3 Artifact Service Configuration
    s3_bucket_name: str = Field(
        default="nbfc-analyst-artifacts",
        description="S3 bucket name for artifacts"
    )
    s3_endpoint_url: Optional[str] = Field(
        default=None,
        description="S3 endpoint URL (for S3-compatible services like MinIO)"
    )
    aws_access_key_id: Optional[str] = Field(
        default=None,
        description="AWS Access Key ID"
    )
    aws_secret_access_key: Optional[str] = Field(
        default=None,
        description="AWS Secret Access Key"
    )
    aws_region: str = Field(
        default="us-east-1",
        description="AWS Region"
    )
    
    # Logging Configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"
    )
    
    # CORS Configuration
    allowed_origins: list[str] = Field(
        default=["http://localhost", "http://localhost:3000", "http://localhost:5173", "*"],
        description="Allowed origins for CORS"
    )
    
    # Web UI Configuration
    serve_web_interface: bool = Field(
        default=True,
        description="Enable ADK Web UI"
    )
    
    # Development Configuration
    reload_agents: bool = Field(
        default=True,
        description="Enable hot reload for agent changes during development"
    )
    
    # Authentication Configuration
    jwt_secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="JWT secret key for token signing (CHANGE IN PRODUCTION!)"
    )
    jwt_access_token_expire_days: int = Field(
        default=7,
        description="JWT access token expiration in days"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    
    # ============================================================================
    # Modular Service Configuration
    # ============================================================================
    
    # Session Service Configuration
    session_service_type: Literal["inmemory", "mongo", "redis", "database"] = Field(
        default="inmemory",
        description="Type of session service to use"
    )
    
    # Additional database session service URL for DatabaseSessionService
    session_database_url: Optional[str] = Field(
        default=None,
        description="Database URL for DatabaseSessionService (sqlite:///path, postgresql://..., mysql://...)"
    )
    
    # Redis URL for RedisSessionService  
    session_redis_url: Optional[str] = Field(
        default="redis://localhost:6379",
        description="Redis URL for RedisSessionService"
    )
    
    # Memory Service Configuration
    memory_service_type: Literal["inmemory"] = Field(
        default="inmemory",
        description="Type of memory service to use (currently only inmemory available)"
    )
    
    # Artifact Service Configuration  
    artifact_service_type: Literal["inmemory", "s3", "local"] = Field(
        default="inmemory",
        description="Type of artifact service to use"
    )

    # Authentication storage (modular with default SQLite)
    auth_storage_type: Literal["auto", "sqlite", "mongo", "database", "inmemory"] = Field(
        default="auto",
        description="Auth storage: auto=follow session when possible, default sqlite; or choose sqlite/mongo/database/inmemory"
    )
    auth_db_url: str = Field(
        default="sqlite+aiosqlite:///./data/auth.db",
        description="SQLAlchemy async DB URL for auth (default SQLite)"
    )
    auth_mongo_url: Optional[str] = Field(
        default=None,
        description="Mongo URL for auth (defaults to MONGO_URL if not set)"
    )
    auth_mongo_db_name: Optional[str] = Field(
        default=None,
        description="Mongo DB name for auth (defaults to MONGO_DB_NAME if not set)"
    )
    
    # Local folder artifact service configuration
    artifact_local_base_path: Optional[str] = Field(
        default="./artifacts",
        description="Base path for local artifact storage"
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    def get_session_service_uri(self) -> str:
        """Get the session service URI for MongoDB"""
        return f"{self.mongo_url}/{self.mongo_db_name}"
    
    def get_s3_credentials(self) -> dict:
        """Get S3 credentials dictionary"""
        creds = {
            "bucket_name": self.s3_bucket_name,
        }
        
        if self.s3_endpoint_url:
            creds["endpoint_url"] = self.s3_endpoint_url
        
        if self.aws_access_key_id and self.aws_secret_access_key:
            creds["aws_access_key_id"] = self.aws_access_key_id
            creds["aws_secret_access_key"] = self.aws_secret_access_key
            
        if self.aws_region:
            creds["region_name"] = self.aws_region
            
        return creds
    
    def get_services_config(self) -> ServicesConfig:
        """Get the complete services configuration"""
        
        # Parse session service configuration
        session_config = parse_session_config(
            service_type=self.session_service_type,
            mongo_url=self.mongo_url,
            mongo_db_name=self.mongo_db_name,
            redis_url=self.session_redis_url,
            database_url=self.session_database_url
        )
        
        # Parse memory service configuration  
        memory_config = parse_memory_config(
            service_type=self.memory_service_type
        )
        
        # Parse artifact service configuration
        artifact_config = parse_artifact_config(
            service_type=self.artifact_service_type,
            bucket_name=self.s3_bucket_name,
            endpoint_url=self.s3_endpoint_url,
            aws_access_key_id=self.aws_access_key_id,
            aws_secret_access_key=self.aws_secret_access_key,
            region_name=self.aws_region,
            local_base_path=self.artifact_local_base_path
        )
        
        return ServicesConfig(
            session_service=session_config,
            memory_service=memory_config,
            artifact_service=artifact_config
        )


# Create a singleton instance
settings = Settings()
