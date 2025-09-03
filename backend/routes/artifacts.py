"""
Artifact Management Routes

This module provides file management endpoints for uploading, downloading,
and managing artifacts within the ADK session system.

Features:
- File upload with multipart/form-data support
- Enhanced metadata retrieval with file details
- Streaming file downloads with proper browser headers
- Session and user namespace support
- JWT authentication and authorization
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from typing import Optional, List, Dict, Any
import mimetypes
import io
from datetime import datetime

import google.genai.types as types
from middleware.auth import get_current_user_id

# Create router with prefix and tags
router = APIRouter(
    prefix="/apps/{app_name}/users/{user_id}/sessions/{session_id}", 
    tags=["artifacts"]
)

# We'll get the artifact_service from app state in each endpoint
def get_artifact_service(request: Request):
    """Get artifact service from FastAPI app state."""
    return request.app.state.artifact_service


@router.post("/upload")
async def upload_file(
    app_name: str,
    user_id: str, 
    session_id: str,
    request: Request,
    file: UploadFile = File(...),
    namespace: str = Form(default="session"),
    custom_filename: Optional[str] = Form(default=None),
    current_user: str = Depends(get_current_user_id)
):
    """
    Upload a file as an artifact to the session or user namespace.
    
    Args:
        app_name: Application name
        user_id: User identifier  
        session_id: Session identifier
        request: FastAPI request object (for accessing app state)
        file: Uploaded file
        namespace: Either 'session' or 'user' (default: 'session')
        custom_filename: Optional custom filename (default: use original filename)
        current_user: Current authenticated user (from JWT)
    
    Returns:
        Dict with upload success details including filename and version
    """
    try:
        # Validate user authorization
        if current_user != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to upload to this user's session")
        
        # Get artifact service from app state
        artifact_service = get_artifact_service(request)
        if not artifact_service:
            raise HTTPException(status_code=500, detail="Artifact service not configured")
        
        # Read file content
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Determine filename
        filename = custom_filename or file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        # Add namespace prefix for user-scoped artifacts
        if namespace == "user":
            artifact_name = f"user:{filename}"
        else:
            artifact_name = filename
        
        # Detect MIME type
        mime_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        
        # Create ADK artifact
        artifact = types.Part.from_bytes(data=file_content, mime_type=mime_type)
        
        # Save artifact using the artifact service
        version = await artifact_service.save_artifact(
            app_name=app_name,
            user_id=user_id, 
            session_id=session_id,
            filename=artifact_name,
            artifact=artifact
        )
        
        logger.info(f"File uploaded: {filename} (size: {len(file_content)} bytes, mime: {mime_type}, version: {version})")
        
        return {
            "success": True,
            "filename": filename,
            "artifact_name": artifact_name,
            "namespace": namespace,
            "mime_type": mime_type,
            "size": len(file_content),
            "version": version,
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@router.get("/artifacts-metadata")
async def get_artifacts_metadata(
    app_name: str,
    user_id: str,
    session_id: str,
    request: Request,
    current_user: str = Depends(get_current_user_id)
) -> List[Dict[str, Any]]:
    """
    Get detailed metadata for all artifacts in a session.
    
    Args:
        app_name: Application name
        user_id: User identifier
        session_id: Session identifier
        request: FastAPI request object (for accessing app state)
        current_user: Current authenticated user (from JWT)
    
    Returns:
        List of artifact metadata dictionaries
    """
    try:
        # Validate user authorization
        if current_user != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this user's session")
        
        # Get artifact service from app state
        artifact_service = get_artifact_service(request)
        if not artifact_service:
            raise HTTPException(status_code=500, detail="Artifact service not configured")
        
        # Get all artifact names
        artifact_keys_response = await artifact_service.list_artifact_keys(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        artifact_names = artifact_keys_response.filenames
        
        metadata_list = []
        
        for artifact_name in artifact_names:
            try:
                # Get the latest version
                latest_artifact = await artifact_service.load_artifact(
                    app_name=app_name,
                    user_id=user_id,
                    session_id=session_id,
                    filename=artifact_name,
                    version=None  # Latest version
                )
                
                # Get all versions
                versions_response = await artifact_service.list_versions(
                    app_name=app_name,
                    user_id=user_id,
                    session_id=session_id,
                    filename=artifact_name
                )
                versions = versions_response.versions
                
                if latest_artifact and latest_artifact.inline_data:
                    # Determine display name and namespace
                    display_name = artifact_name
                    namespace = "session"
                    if artifact_name.startswith("user:"):
                        display_name = artifact_name[5:]  # Remove "user:" prefix
                        namespace = "user"
                    
                    metadata = {
                        "filename": display_name,
                        "artifact_name": artifact_name,
                        "namespace": namespace,
                        "mime_type": latest_artifact.inline_data.mime_type,
                        "size": len(latest_artifact.inline_data.data),
                        "version_count": len(versions),
                        "latest_version": max(versions) if versions else 0,
                        "versions": sorted(versions, reverse=True)
                    }
                    metadata_list.append(metadata)
                    
            except Exception as e:
                logger.warning(f"Error getting metadata for artifact {artifact_name}: {e}")
                continue
        
        return metadata_list
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting artifacts metadata: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get artifacts metadata: {str(e)}")


@router.get("/artifacts/{artifact_name}/download")
async def download_artifact(
    app_name: str,
    user_id: str,
    session_id: str,
    artifact_name: str,
    request: Request,
    version: Optional[int] = None,
    current_user: str = Depends(get_current_user_id)
) -> StreamingResponse:
    """
    Download an artifact file with proper headers for browser download.
    
    Args:
        app_name: Application name
        user_id: User identifier
        session_id: Session identifier
        artifact_name: Artifact filename
        request: FastAPI request object (for accessing app state)
        version: Specific version (optional, defaults to latest)
        current_user: Current authenticated user (from JWT)
    
    Returns:
        StreamingResponse with file content and proper headers
    """
    try:
        # Validate user authorization
        if current_user != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to download from this user's session")
        
        # Get artifact service from app state
        artifact_service = get_artifact_service(request)
        if not artifact_service:
            raise HTTPException(status_code=500, detail="Artifact service not configured")
        
        # Load the artifact
        artifact = await artifact_service.load_artifact(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id,
            filename=artifact_name,
            version=version
        )
        
        if not artifact or not artifact.inline_data:
            raise HTTPException(status_code=404, detail="Artifact not found")
        
        # Determine download filename (remove namespace prefix if present)
        download_filename = artifact_name
        if artifact_name.startswith("user:"):
            download_filename = artifact_name[5:]
        
        # Create streaming response
        return StreamingResponse(
            io.BytesIO(artifact.inline_data.data),
            media_type=artifact.inline_data.mime_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{download_filename}\"",
                "Content-Length": str(len(artifact.inline_data.data))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading artifact: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download artifact: {str(e)}")