# ==============================================================================
# Google ADK Template - Production Dockerfile with uv
# ==============================================================================

# Use Python 3.12 slim image as base for multi-stage build
FROM python:3.12-slim-bookworm AS builder

# Install uv from the official distroless image (pinned to specific version)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables for optimal uv behavior in Docker
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/opt/uv-cache/

# Create cache directory
RUN mkdir -p /opt/uv-cache

# Set working directory
WORKDIR /app

# Install dependencies first (better caching)
# Copy only the dependency files to leverage Docker layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies without the project itself
RUN --mount=type=cache,target=/opt/uv-cache \
    uv sync --no-install-project

# Copy the entire project source
COPY . .

# Install the project
RUN --mount=type=cache,target=/opt/uv-cache \
    uv sync

# ==============================================================================
# Production Stage
# ==============================================================================
FROM python:3.12-slim-bookworm

# Create a non-root user for security
RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --shell /bin/bash --create-home app

# Set working directory
WORKDIR /app

# Copy the virtual environment from builder stage
COPY --from=builder --chown=app:app /app/.venv /app/.venv

# Copy the application code
COPY --chown=app:app . /app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Switch to non-root user
USER app

# Expose the application port
EXPOSE 8000

# Health check
# Install curl for healthchecks
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Default command
USER app
CMD ["python", "main.py"]

# ==============================================================================
# Build Instructions
# ==============================================================================
#
# To build the image:
#   docker build -t google-adk-template .
#
# To run the container:
#   docker run -p 8000:8000 --env-file .env google-adk-template
#
# For development with volume mounts:
#   docker run -p 8000:8000 --env-file .env \
#     -v $(pwd):/app \
#     -v /app/.venv \
#     google-adk-template
#
# ==============================================================================
