"""
OpenAPI specification loader with URL and file support.

This module handles loading OpenAPI specifications from various sources:
- URLs (with caching and TTL support)  
- Local files
- Direct spec dictionaries
"""

import os
import json
import yaml
import time
import hashlib
import aiohttp
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, Union
from urllib.parse import urlparse


class SpecLoader:
    """Loads OpenAPI specifications from URLs or local files with caching."""
    
    def __init__(self, cache_dir: Optional[Path] = None):
        """Initialize spec loader.
        
        Args:
            cache_dir: Directory for caching downloaded specs (default: ./cache)
        """
        self.cache_dir = cache_dir or Path("cache")
        self.cache_dir.mkdir(exist_ok=True)
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def load_spec(
        self, 
        spec_source: str, 
        cache_enabled: bool = True, 
        cache_ttl: int = 3600,
        specs_dir: Optional[Path] = None
    ) -> Dict[str, Any]:
        """Load OpenAPI specification from URL or file.
        
        Args:
            spec_source: URL or file path to OpenAPI spec
            cache_enabled: Whether to cache downloaded specs
            cache_ttl: Cache time-to-live in seconds
            specs_dir: Base directory for relative file paths
            
        Returns:
            OpenAPI specification as dictionary
            
        Raises:
            ValueError: If spec cannot be loaded or parsed
            aiohttp.ClientError: If URL cannot be fetched
        """
        if self._is_url(spec_source):
            return await self._load_from_url(spec_source, cache_enabled, cache_ttl)
        else:
            return self._load_from_file(spec_source, specs_dir)
    
    def _is_url(self, source: str) -> bool:
        """Check if source is a URL."""
        parsed = urlparse(source)
        return parsed.scheme in ('http', 'https')
    
    async def _load_from_url(
        self, 
        url: str, 
        cache_enabled: bool, 
        cache_ttl: int
    ) -> Dict[str, Any]:
        """Load OpenAPI spec from URL with caching."""
        
        # Check cache first if enabled
        if cache_enabled:
            cached_spec = self._get_cached_spec(url, cache_ttl)
            if cached_spec is not None:
                print(f"Using cached spec for {url}")
                return cached_spec
        
        # Download from URL
        print(f"Downloading OpenAPI spec from {url}")
        
        if self._session is None:
            self._session = aiohttp.ClientSession()
        
        try:
            async with self._session.get(url) as response:
                response.raise_for_status()
                content = await response.text()
                
                # Parse content
                spec = self._parse_spec_content(content, url)
                
                # Cache if enabled
                if cache_enabled:
                    self._cache_spec(url, spec)
                
                return spec
                
        except aiohttp.ClientError as e:
            raise ValueError(f"Failed to download OpenAPI spec from {url}: {e}")
    
    def _load_from_file(self, file_path: str, specs_dir: Optional[Path]) -> Dict[str, Any]:
        """Load OpenAPI spec from local file."""
        
        # Resolve file path
        if specs_dir and not Path(file_path).is_absolute():
            full_path = specs_dir / file_path
        else:
            full_path = Path(file_path)
        
        if not full_path.exists():
            raise ValueError(f"OpenAPI spec file not found: {full_path}")
        
        print(f"Loading OpenAPI spec from {full_path}")
        
        try:
            content = full_path.read_text()
            return self._parse_spec_content(content, str(full_path))
        except Exception as e:
            raise ValueError(f"Failed to read OpenAPI spec from {full_path}: {e}")
    
    def _parse_spec_content(self, content: str, source: str) -> Dict[str, Any]:
        """Parse OpenAPI spec content (JSON or YAML)."""
        
        # Try JSON first
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Try YAML
        try:
            return yaml.safe_load(content)
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse OpenAPI spec from {source}: {e}")
    
    def _get_cache_key(self, url: str) -> str:
        """Generate cache key for URL."""
        return hashlib.md5(url.encode()).hexdigest()
    
    def _get_cached_spec(self, url: str, cache_ttl: int) -> Optional[Dict[str, Any]]:
        """Get cached spec if still valid."""
        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"
        metadata_file = self.cache_dir / f"{cache_key}.meta"
        
        if not cache_file.exists() or not metadata_file.exists():
            return None
        
        try:
            # Check if cache is still valid
            metadata = json.loads(metadata_file.read_text())
            cached_time = metadata.get('cached_at', 0)
            
            if time.time() - cached_time > cache_ttl:
                print(f"Cache expired for {url}")
                return None
            
            # Load cached spec
            return json.loads(cache_file.read_text())
            
        except Exception as e:
            print(f"Error reading cache for {url}: {e}")
            return None
    
    def _cache_spec(self, url: str, spec: Dict[str, Any]):
        """Cache OpenAPI spec."""
        try:
            cache_key = self._get_cache_key(url)
            cache_file = self.cache_dir / f"{cache_key}.json"
            metadata_file = self.cache_dir / f"{cache_key}.meta"
            
            # Save spec
            with open(cache_file, 'w') as f:
                json.dump(spec, f, indent=2)
            
            # Save metadata
            metadata = {
                'url': url,
                'cached_at': time.time()
            }
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
                
            print(f"Cached spec for {url}")
            
        except Exception as e:
            print(f"Error caching spec for {url}: {e}")
    
    def clear_cache(self, url: Optional[str] = None):
        """Clear cached specs."""
        if url:
            # Clear specific URL
            cache_key = self._get_cache_key(url)
            cache_file = self.cache_dir / f"{cache_key}.json"
            metadata_file = self.cache_dir / f"{cache_key}.meta"
            
            cache_file.unlink(missing_ok=True)
            metadata_file.unlink(missing_ok=True)
            print(f"Cleared cache for {url}")
        else:
            # Clear all cache
            for cache_file in self.cache_dir.glob("*.json"):
                cache_file.unlink()
            for meta_file in self.cache_dir.glob("*.meta"):
                meta_file.unlink()
            print("Cleared all cached specs")
    
    async def close(self):
        """Close HTTP session."""
        if self._session:
            await self._session.close()
            self._session = None
    
    def __del__(self):
        """Cleanup on deletion."""
        if self._session and not self._session.closed:
            # Create a new event loop if none exists
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            if loop.is_running():
                # Schedule cleanup
                loop.create_task(self.close())
            else:
                # Run cleanup
                loop.run_until_complete(self.close())


# Utility functions for synchronous usage
def load_spec_sync(
    spec_source: str,
    cache_enabled: bool = True,
    cache_ttl: int = 3600,
    specs_dir: Optional[Path] = None,
    cache_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """Synchronous wrapper for loading OpenAPI specs."""
    
    loader = SpecLoader(cache_dir)
    
    try:
        # Run async operation
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            return loop.run_until_complete(
                loader.load_spec(spec_source, cache_enabled, cache_ttl, specs_dir)
            )
        finally:
            loop.run_until_complete(loader.close())
            loop.close()
            
    except Exception as e:
        raise ValueError(f"Failed to load OpenAPI spec: {e}")


def override_server_url(spec: Dict[str, Any], server_url: str) -> Dict[str, Any]:
    """Override the server URL in OpenAPI specification."""
    spec = spec.copy()
    spec['servers'] = [{'url': server_url}]
    return spec