"""
Service Factory for creating ADK service instances based on configuration.

This factory creates properly configured SessionService, MemoryService, 
and ArtifactService instances based on the provided configuration models.
"""

from typing import Optional
from loguru import logger

# ADK built-in services
from google.adk.sessions import (
    BaseSessionService, 
    InMemorySessionService, 
    DatabaseSessionService
)
from google.adk.memory import (
    BaseMemoryService,
    InMemoryMemoryService
)
from google.adk.artifacts import (
    BaseArtifactService,
    InMemoryArtifactService
)

# Extra services from adk-extra-services
try:
    from adk_extra_services.sessions import (
        MongoSessionService,
        RedisSessionService
    )
    EXTRA_SESSIONS_AVAILABLE = True
except ImportError:
    logger.warning("adk-extra-services sessions not available - install with 'pip install adk-extra-services'")
    EXTRA_SESSIONS_AVAILABLE = False

try:
    from adk_extra_services.artifacts import (
        S3ArtifactService,
        LocalFolderArtifactService
    )
    EXTRA_ARTIFACTS_AVAILABLE = True
except ImportError:
    logger.warning("adk-extra-services artifacts not available - install with 'pip install adk-extra-services'")
    EXTRA_ARTIFACTS_AVAILABLE = False

# Configuration models
from config.services import (
    SessionServiceConfig,
    MemoryServiceConfig,
    ArtifactServiceConfig,
    InMemorySessionConfig,
    MongoSessionConfig,
    RedisSessionConfig,
    DatabaseSessionConfig,
    InMemoryMemoryConfig,
    InMemoryArtifactConfig,
    S3ArtifactConfig,
    LocalFolderArtifactConfig
)


class ServiceFactory:
    """Factory for creating ADK service instances"""

    @staticmethod
    def create_session_service(config: SessionServiceConfig) -> BaseSessionService:
        """Create a session service based on configuration"""
        
        if isinstance(config, InMemorySessionConfig):
            logger.info("Creating InMemorySessionService")
            return InMemorySessionService()
        
        elif isinstance(config, MongoSessionConfig):
            if not EXTRA_SESSIONS_AVAILABLE:
                raise ImportError(
                    "MongoSessionService requires adk-extra-services package. "
                    "Install with: pip install adk-extra-services"
                )
            logger.info(f"Creating MongoSessionService with {config.mongo_url}/{config.db_name}")
            return MongoSessionService(
                mongo_url=config.mongo_url,
                db_name=config.db_name
            )
        
        elif isinstance(config, RedisSessionConfig):
            if not EXTRA_SESSIONS_AVAILABLE:
                raise ImportError(
                    "RedisSessionService requires adk-extra-services package. "
                    "Install with: pip install adk-extra-services"
                )
            logger.info(f"Creating RedisSessionService with {config.redis_url}")
            return RedisSessionService(redis_url=config.redis_url)
        
        elif isinstance(config, DatabaseSessionConfig):
            # Determine database type from URL
            db_type = "Unknown"
            if config.db_url.startswith("sqlite:"):
                db_type = "SQLite"
            elif config.db_url.startswith("postgresql:"):
                db_type = "PostgreSQL"
            elif config.db_url.startswith("mysql"):
                db_type = "MySQL"
            
            logger.info(f"Creating DatabaseSessionService with {db_type} database")
            return DatabaseSessionService(db_url=config.db_url)
        
        else:
            raise ValueError(f"Unknown session service configuration type: {type(config)}")

    @staticmethod
    def create_memory_service(config: MemoryServiceConfig) -> BaseMemoryService:
        """Create a memory service based on configuration"""
        
        if isinstance(config, InMemoryMemoryConfig):
            logger.info("Creating InMemoryMemoryService")
            return InMemoryMemoryService()
        
        else:
            raise ValueError(f"Unknown memory service configuration type: {type(config)}")

    @staticmethod
    def create_artifact_service(config: ArtifactServiceConfig) -> BaseArtifactService:
        """Create an artifact service based on configuration"""
        
        if isinstance(config, InMemoryArtifactConfig):
            logger.info("Creating InMemoryArtifactService")
            return InMemoryArtifactService()
        
        elif isinstance(config, S3ArtifactConfig):
            if not EXTRA_ARTIFACTS_AVAILABLE:
                raise ImportError(
                    "S3ArtifactService requires adk-extra-services package. "
                    "Install with: pip install adk-extra-services"
                )
            
            # Build S3 service arguments
            s3_kwargs = {"bucket_name": config.bucket_name}
            
            if config.endpoint_url:
                s3_kwargs["endpoint_url"] = config.endpoint_url
                logger.info(f"Creating S3ArtifactService with custom endpoint: {config.endpoint_url}")
            else:
                logger.info(f"Creating S3ArtifactService with bucket: {config.bucket_name}")
            
            if config.aws_access_key_id and config.aws_secret_access_key:
                s3_kwargs["aws_access_key_id"] = config.aws_access_key_id
                s3_kwargs["aws_secret_access_key"] = config.aws_secret_access_key
                logger.info("Using explicit AWS credentials")
            else:
                logger.info("Using default AWS credential chain")
            
            if config.region_name:
                s3_kwargs["region_name"] = config.region_name
                logger.info(f"Using AWS region: {config.region_name}")
            
            return S3ArtifactService(**s3_kwargs)
        
        elif isinstance(config, LocalFolderArtifactConfig):
            if not EXTRA_ARTIFACTS_AVAILABLE:
                raise ImportError(
                    "LocalFolderArtifactService requires adk-extra-services package. "
                    "Install with: pip install adk-extra-services"
                )
            logger.info(f"Creating LocalFolderArtifactService with base path: {config.base_path}")
            return LocalFolderArtifactService(base_path=config.base_path)
        
        else:
            raise ValueError(f"Unknown artifact service configuration type: {type(config)}")

    @classmethod
    def create_all_services(
        self,
        session_config: SessionServiceConfig,
        memory_config: MemoryServiceConfig,
        artifact_config: ArtifactServiceConfig
    ) -> tuple[BaseSessionService, BaseMemoryService, BaseArtifactService]:
        """Create all three services and return as tuple"""
        
        logger.info("Creating ADK services...")
        
        session_service = self.create_session_service(session_config)
        memory_service = self.create_memory_service(memory_config)
        artifact_service = self.create_artifact_service(artifact_config)
        
        logger.info("All ADK services created successfully")
        
        return session_service, memory_service, artifact_service


def get_service_availability() -> dict[str, bool]:
    """Get availability status of optional service packages"""
    return {
        "adk_extra_services_sessions": EXTRA_SESSIONS_AVAILABLE,
        "adk_extra_services_artifacts": EXTRA_ARTIFACTS_AVAILABLE
    }