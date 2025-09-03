# 🚀 Google ADK Fullstack Template

> **Production-ready template for building AI agents with React frontend, Python backend, and Google Agent Development Kit integration**

A comprehensive fullstack template for building sophisticated AI agents with modern web interfaces. Features the **OpenAPI Tools Template Framework** for seamless REST API integration, multi-model AI support, persistent sessions, and deployment-ready architecture.

## ✨ Key Features

### 🧠 **AI Agent Capabilities**
- **Google Agent Development Kit (ADK)** - Latest Python SDK for building production AI agents
- **Multi-Model Support** - Google Gemini, OpenAI, Anthropic, Cohere, local models via LiteLLM
- **OpenAPI Tools Framework** - Automatic integration of any REST API into your agent
- **Persistent Sessions** - MongoDB-backed conversation storage
- **Artifact Management** - S3-compatible file storage with versioning

### 🎨 **Modern Frontend**
- **TanStack Start SPA** - High-performance React single-page application
- **shadcn/ui Components** - Beautiful, accessible React components
- **Real-time Chat Interface** - Professional chat UI with streaming support
- **Type-Safe API Integration** - Auto-generated TypeScript clients from OpenAPI schemas
- **Responsive Design** - Mobile-first, professional interface

### 🛠 **Developer Experience**
- **Hot Reload Development** - Fast iteration with Docker Compose
- **Complete Type Safety** - End-to-end TypeScript integration
- **Auto-Generated API Clients** - Orval generates TypeScript from OpenAPI specs  
- **Comprehensive Documentation** - Detailed setup and usage guides
- **Production Ready** - Docker deployment with monitoring and scaling

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Or: Python 3.12+, uv, Bun 1.0+, MongoDB, MinIO/S3

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone <your-repo-url>
cd google-adk-fullstack-template

# Setup environment
cp .env.example .env
# Edit .env with your API keys (GOOGLE_API_KEY, etc.)

# Start all services
docker-compose up --build

# Access applications
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Documentation: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
uv sync                    # Install dependencies
uv run python main.py      # Start server (port 8000)
```

**Frontend:**
```bash
cd frontend
bun install               # Install dependencies
bun run generate         # Generate API client from OpenAPI
bun run dev             # Start development server (port 3000)
```

## 📁 Project Architecture

```
google-adk-fullstack-template/
├── 📱 frontend/                    # TanStack Start React SPA
│   ├── src/
│   │   ├── routes/                # File-based routing
│   │   ├── components/            # React components + shadcn/ui
│   │   ├── api/                   # Auto-generated API client
│   │   └── lib/                   # Utilities and configuration
│   ├── package.json               # Bun dependencies
│   └── README.md                  # Frontend documentation
│
├── 🐍 backend/                     # Python FastAPI + Google ADK
│   ├── agents/
│   │   └── main_agent.py          # Your AI agent definition
│   ├── tools/                     # 🔧 OpenAPI Tools Framework
│   │   ├── __init__.py            # Tool registration API
│   │   ├── registry.py            # Central tool registry
│   │   ├── api_proxy.py           # External API proxy handler
│   │   ├── fastmcp_proxy.py       # FastMCP server integration
│   │   ├── examples.py            # Example tool configurations
│   │   └── integrations.py       # Your custom tool integrations
│   ├── config/                    # Settings and service configuration
│   ├── routes/                    # FastAPI route handlers
│   ├── middleware/                # Authentication and CORS
│   ├── services/                  # Business logic services
│   ├── models/                    # Data models and schemas
│   ├── main.py                    # FastAPI application entry point
│   ├── pyproject.toml             # uv dependencies
│   └── README.md                  # Backend documentation
│
├── 🚢 deployment/                  # Production deployment
│   ├── docker-compose.prod.yaml   # Production containers
│   ├── nginx.conf                 # Load balancer configuration
│   ├── deploy.sh                  # Deployment automation script
│   └── README.md                  # Deployment documentation
│
├── 🐳 docker-compose.yaml          # Development environment
├── .env.example                    # Environment configuration template
├── CLAUDE.md                       # Claude Code integration guide
└── README.md                       # This file
```

## 🛠 Core Components

### Google ADK Integration
The template is built around Google's Agent Development Kit, providing:
- **Agent Definition** - Configure your AI agent in `backend/agents/main_agent.py`
- **Tool Integration** - Seamless integration of external APIs and custom tools
- **Session Management** - Persistent conversation state with MongoDB
- **Artifact Handling** - File storage and retrieval with S3-compatible backends

### OpenAPI Tools Framework
**Automatically integrate any REST API into your agent:**

```python
# backend/tools/integrations.py
from tools import register_api_tool

# Add GitHub API to your agent
register_api_tool(
    name="github",
    base_url="https://api.github.com",
    auth={"type": "bearer", "token_env": "GITHUB_TOKEN"},
    operations=["repos/list-for-authenticated-user", "repos/get"],
    tags=["GitHub"],
    enabled=True
)

# Add weather API
register_api_tool(
    name="weather", 
    base_url="https://api.openweathermap.org/data/2.5",
    auth={"type": "api_key", "key_env": "OPENWEATHER_API_KEY", "location": "query", "key_name": "appid"},
    tags=["Weather"],
    enabled=True
)
```

**Features:**
- **Automatic Discovery** - Agent automatically gets access to all registered tools
- **Authentication Support** - Bearer tokens, API keys, basic auth
- **FastMCP Integration** - Connect FastMCP servers as tools
- **Custom Tools** - Register custom Python functions as tools
- **Individual OpenAPI Specs** - Each tool exposes its own OpenAPI specification

### Frontend Integration
The React frontend provides:
- **Type-Safe API Calls** - Auto-generated hooks from OpenAPI schemas
- **Real-Time Chat** - WebSocket and SSE streaming support
- **Session Management** - Persistent conversation history
- **Modern UI** - Professional chat interface with animations

```typescript
// Auto-generated API hooks
import { useRunAgent, useSessions, useCreateSession } from '@/api/hooks';

// Chat with your agent
const { mutate: runAgent } = useRunAgent();
runAgent({
  appName: 'my-agent',
  message: { parts: [{ text: 'Hello!' }] }
});

// Manage sessions
const { data: sessions } = useSessions({ appName: 'my-agent' });
```

## 🔧 Configuration

### Environment Variables
Key configuration in `.env`:

```bash
# Agent Configuration
AGENT_NAME=my_assistant
AGENT_MODEL=gemini-2.0-flash-exp
AGENT_DESCRIPTION="My AI Assistant"

# Model Provider
MODEL_PROVIDER=gemini              # or litellm
GOOGLE_API_KEY=your_api_key

# Services  
SESSION_SERVICE_TYPE=inmemory      # or mongo
ARTIFACT_SERVICE_TYPE=inmemory     # or s3

# Database (if using MongoDB)
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=agent_sessions

# Storage (if using S3)
S3_BUCKET_NAME=agent-artifacts
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Model Providers

**Google Gemini (Default):**
```bash
MODEL_PROVIDER=gemini
GOOGLE_API_KEY=your_google_api_key
AGENT_MODEL=gemini-2.0-flash-exp
```

**OpenAI via LiteLLM:**
```bash
MODEL_PROVIDER=litellm
AGENT_MODEL=openai/gpt-4o
OPENAI_API_KEY=your_openai_key
```

**Local Models (Ollama):**
```bash
MODEL_PROVIDER=litellm
AGENT_MODEL=ollama_chat/llama3.1
OLLAMA_API_BASE=http://localhost:11434
```

## 🚀 Development Workflow

### 1. Define Your Agent
Edit `backend/agents/main_agent.py` to customize your agent's behavior, model, and tools.

### 2. Add Tools
Register APIs and custom tools in `backend/tools/integrations.py` using the OpenAPI Tools Framework.

### 3. Customize Frontend
Modify the React components in `frontend/src/components/` to match your application's needs.

### 4. Test Integration
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Tool endpoints: http://localhost:8000/tools/{tool_name}/

### 5. Deploy
Use `deployment/deploy.sh` for production deployment with Docker Compose.

## 🔗 Service Integration

### MongoDB Sessions
Enable persistent conversation storage:
```bash
# Start with MongoDB
docker-compose --profile session-mongo up --build

# Configuration
SESSION_SERVICE_TYPE=mongo
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=agent_sessions
```

### S3 Artifact Storage
Enable file storage and retrieval:
```bash
# Start with MinIO (S3-compatible)
docker-compose --profile artifacts-minio up --build

# Configuration  
ARTIFACT_SERVICE_TYPE=s3
S3_BUCKET_NAME=agent-artifacts
S3_ENDPOINT_URL=http://localhost:9000  # For MinIO
```

### Full Production Setup
```bash
# Start everything
docker-compose --profile session-mongo --profile artifacts-minio up --build
```

## 📚 Documentation

Each component has detailed documentation:

- **[Backend README](backend/README.md)** - Python FastAPI backend and OpenAPI Tools Framework
- **[Frontend README](frontend/README.md)** - TanStack Start React frontend  
- **[Deployment README](deployment/README.md)** - Docker deployment and production setup
- **[Tools README](backend/tools/README.md)** - OpenAPI Tools Framework detailed guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Google ADK](https://github.com/google/adk-python)** - Agent Development Kit
- **[adk-extra-services](https://github.com/edu010101/adk-extra-services)** - MongoDB & S3 services
- **[LiteLLM](https://github.com/BerriAI/litellm)** - Multi-model integration
- **[TanStack Start](https://tanstack.com/start)** - Modern React framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful React components
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[uv](https://github.com/astral-sh/uv)** - Fast Python package management

---

## 🎯 Next Steps

1. **Configure your agent** - Edit `backend/agents/main_agent.py`
2. **Add your first tool** - Use the OpenAPI Tools Framework in `backend/tools/integrations.py`
3. **Customize the UI** - Modify React components in `frontend/src/components/`
4. **Deploy to production** - Use `deployment/deploy.sh prod`

**Start building your AI agent today!** 🚀