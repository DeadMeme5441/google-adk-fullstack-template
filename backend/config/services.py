"""
Service configuration models for modular ADK service setup.

This module provides configuration models for dynamically configuring
SessionService, MemoryService, and ArtifactService implementations.
"""

from typing import Optional, Literal, Union, Dict, Any
from pydantic import BaseModel, Field, validator


# ============================================================================
# Session Service Configurations
# ============================================================================

class InMemorySessionConfig(BaseModel):
    """Configuration for InMemorySessionService"""
    type: Literal["inmemory"] = "inmemory"


class MongoSessionConfig(BaseModel):
    """Configuration for MongoSessionService (adk-extra-services)"""
    type: Literal["mongo"] = "mongo"
    mongo_url: str = Field(..., description="MongoDB connection URL")
    db_name: str = Field(..., description="MongoDB database name")
    # Note: MongoSessionService uses fixed collection names: sessions, events, app_states, user_states


class RedisSessionConfig(BaseModel):
    """Configuration for RedisSessionService (adk-extra-services)"""
    type: Literal["redis"] = "redis"
    redis_url: str = Field(..., description="Redis connection URL")


class DatabaseSessionConfig(BaseModel):
    """Configuration for DatabaseSessionService (ADK built-in)"""
    type: Literal["database"] = "database"
    db_url: str = Field(..., description="Database URL (sqlite:///path, postgresql://..., mysql://...)")
    
    @validator('db_url')
    def validate_db_url(cls, v):
        """Validate database URL format"""
        valid_prefixes = ['sqlite:', 'postgresql:', 'mysql:', 'mysql+pymysql:']
        if not any(v.startswith(prefix) for prefix in valid_prefixes):
            raise ValueError(f"Database URL must start with one of: {', '.join(valid_prefixes)}")
        return v


# Union type for all session service configurations
SessionServiceConfig = Union[
    InMemorySessionConfig,
    MongoSessionConfig, 
    RedisSessionConfig,
    DatabaseSessionConfig
]


# ============================================================================
# Memory Service Configurations
# ============================================================================

class InMemoryMemoryConfig(BaseModel):
    """Configuration for InMemoryMemoryService (only non-GCP option)"""
    type: Literal["inmemory"] = "inmemory"


# Union type for all memory service configurations (currently only in-memory)
MemoryServiceConfig = InMemoryMemoryConfig


# ============================================================================
# Artifact Service Configurations
# ============================================================================

class InMemoryArtifactConfig(BaseModel):
    """Configuration for InMemoryArtifactService"""
    type: Literal["inmemory"] = "inmemory"


class S3ArtifactConfig(BaseModel):
    """Configuration for S3ArtifactService (adk-extra-services)"""
    type: Literal["s3"] = "s3"
    bucket_name: str = Field(..., description="S3 bucket name")
    endpoint_url: Optional[str] = Field(None, description="S3 endpoint URL (for S3-compatible services)")
    aws_access_key_id: Optional[str] = Field(None, description="AWS Access Key ID")
    aws_secret_access_key: Optional[str] = Field(None, description="AWS Secret Access Key")
    region_name: Optional[str] = Field(None, description="AWS Region")


class LocalFolderArtifactConfig(BaseModel):
    """Configuration for LocalFolderArtifactService (adk-extra-services)"""
    type: Literal["local"] = "local"
    base_path: str = Field(..., description="Base path for local artifact storage")


# Union type for all artifact service configurations
ArtifactServiceConfig = Union[
    InMemoryArtifactConfig,
    S3ArtifactConfig,
    LocalFolderArtifactConfig
]


# ============================================================================
# Combined Service Configuration
# ============================================================================

class ServicesConfig(BaseModel):
    """Combined configuration for all ADK services"""
    
    session_service: SessionServiceConfig = Field(
        default_factory=lambda: InMemorySessionConfig(),
        description="Session service configuration"
    )
    
    memory_service: MemoryServiceConfig = Field(
        default_factory=lambda: InMemoryMemoryConfig(),
        description="Memory service configuration"
    )
    
    artifact_service: ArtifactServiceConfig = Field(
        default_factory=lambda: InMemoryArtifactConfig(),
        description="Artifact service configuration"
    )

    def get_service_summary(self) -> Dict[str, str]:
        """Get a summary of configured services"""
        return {
            "session_service": self.session_service.type,
            "memory_service": self.memory_service.type,
            "artifact_service": self.artifact_service.type
        }


# ============================================================================
# Environment-based Service Configuration Parsing
# ============================================================================

def parse_session_config(
    service_type: str,
    mongo_url: Optional[str] = None,
    mongo_db_name: Optional[str] = None,
    redis_url: Optional[str] = None,
    database_url: Optional[str] = None,
) -> SessionServiceConfig:
    """Parse session service configuration from environment variables"""
    
    if service_type == "inmemory":
        return InMemorySessionConfig()
    
    elif service_type == "mongo":
        if not mongo_url or not mongo_db_name:
            raise ValueError("mongo_url and mongo_db_name are required for MongoDB session service")
        return MongoSessionConfig(
            mongo_url=mongo_url,
            db_name=mongo_db_name
        )
    
    elif service_type == "redis":
        if not redis_url:
            raise ValueError("redis_url is required for Redis session service")
        return RedisSessionConfig(redis_url=redis_url)
    
    elif service_type == "database":
        if not database_url:
            raise ValueError("database_url is required for Database session service")
        return DatabaseSessionConfig(db_url=database_url)
    
    else:
        raise ValueError(f"Unknown session service type: {service_type}")


def parse_memory_config(service_type: str) -> MemoryServiceConfig:
    """Parse memory service configuration from environment variables"""
    
    if service_type == "inmemory":
        return InMemoryMemoryConfig()
    
    else:
        raise ValueError(f"Unknown memory service type: {service_type}")


def parse_artifact_config(
    service_type: str,
    bucket_name: Optional[str] = None,
    endpoint_url: Optional[str] = None,
    aws_access_key_id: Optional[str] = None,
    aws_secret_access_key: Optional[str] = None,
    region_name: Optional[str] = None,
    local_base_path: Optional[str] = None,
) -> ArtifactServiceConfig:
    """Parse artifact service configuration from environment variables"""
    
    if service_type == "inmemory":
        return InMemoryArtifactConfig()
    
    elif service_type == "s3":
        if not bucket_name:
            raise ValueError("bucket_name is required for S3 artifact service")
        return S3ArtifactConfig(
            bucket_name=bucket_name,
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
    
    elif service_type == "local":
        if not local_base_path:
            raise ValueError("local_base_path is required for local folder artifact service")
        return LocalFolderArtifactConfig(base_path=local_base_path)
    
    else:
        raise ValueError(f"Unknown artifact service type: {service_type}")