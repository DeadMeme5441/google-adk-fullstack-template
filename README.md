# 🤖 Agent Template Repository

> **A production-ready full-stack template for building AI agents with modern React UI and Python backend**

This template provides a complete foundation for building sophisticated AI agent applications using Google's Agent Development Kit (ADK) with a modern chat interface, persistent sessions, and deployment-ready architecture.

## ✨ Features

### 🧠 **Multiple Model Providers**
- **Google Gemini** (AI Studio & Vertex AI)
- **LiteLLM Integration** (OpenAI, Anthropic, Cohere, local models)
- **Local Models** (Ollama, vLLM support)

### 🛠 **Production-Ready Services**
- **MongoDB Sessions** - Persistent conversation storage
- **S3 Artifacts** - File storage with versioning
- **FastAPI Backend** - Modern async Python API with comprehensive OpenAPI schema
- **TanStack Start Frontend** - Modern React + TypeScript SPA with shadcn/ui components
- **Modern Chat Interface** - Professional chat UI with animations, gradients, and responsive design

### 🚀 **Deployment Ready**
- **Docker Compose** - Complete development environment
- **Production Config** - Nginx, scaling, monitoring
- **uv Integration** - Lightning-fast Python package management
- **Hot Reload** - Development productivity features

### 🔧 **Developer Experience**
- **Complete Type Safety** - OpenAPI → TypeScript types + Pydantic validation  
- **TanStack Query Integration** - Smart caching, optimistic updates, streaming support
- **Orval Code Generation** - Auto-generated API client from OpenAPI schema
- **shadcn/ui Components** - Modern, accessible React components with Tailwind CSS
- **Professional Chat UI** - Claude.ai-style interface with animations and gradients
- **Real-time Communication** - WebSocket, SSE streaming, standard HTTP
- **Configuration** - Environment-based settings
- **Documentation** - Comprehensive setup guides

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and setup
git clone <your-repo>
cd agent-template

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start everything
docker-compose up --build

# Access services
# Frontend Chat UI: http://localhost:3000
# Backend API: http://localhost:8000
# MinIO Console: http://localhost:9001
```

### Option 2: Local Development

**Prerequisites:**
- Python 3.12+
- uv ([install guide](https://docs.astral.sh/uv/getting-started/installation/))
- Bun 1.0+ (for TanStack Start frontend)
- MongoDB & MinIO (or use Docker services)

**Backend Setup:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
uv sync
uv run python main.py
```

**Frontend Setup (Modern Chat Interface):**
```bash
cd frontend
bun install
bun run dev          # Development server (http://localhost:3000)
bun run generate     # Generate API client from OpenAPI schema
bun run build        # Build for production
bun run preview      # Preview production build
```

## 📁 Project Structure

```
agent-template/
├── 🐳 docker-compose.yaml          # Development environment
├── 🐳 .env.example                 # Environment configuration
├── 📖 CLAUDE.md                    # Claude Code integration
│
├── backend/                        # Python ADK Backend
│   ├── agents/
│   │   └── main_agent.py           # 🤖 Your AI agent definition
│   ├── config.py                   # ⚙️ Settings management
│   ├── main.py                     # 🚀 FastAPI application
│   ├── Dockerfile                  # 🐳 Production container
│   ├── .env.example                # Backend configuration
│   └── pyproject.toml              # uv dependencies
│
├── frontend/                       # Modern Chat Interface
│   ├── src/
│   │   ├── routes/                # File-based routing
│   │   │   ├── index.tsx          # 🏠 Start page with chat input
│   │   │   ├── chat.tsx           # 💬 Chat layout page
│   │   │   └── chat.$sessionId.tsx # 🗨️ Individual chat sessions
│   │   ├── components/            # Modern React components
│   │   │   ├── ui/                # 🎨 shadcn/ui components
│   │   │   ├── StartPage.tsx      # 🚀 Landing page with prompts
│   │   │   ├── ChatInterface.tsx  # 💬 Main chat interface
│   │   │   ├── ChatSidebar.tsx    # 📋 Session management sidebar
│   │   │   ├── ChatMessage.tsx    # 💭 Message bubbles
│   │   │   └── ChatInput.tsx      # ✍️ Message input with animations
│   │   ├── api/
│   │   │   ├── generated.ts       # 🔷 Auto-generated API client (Orval)
│   │   │   └── mutator.ts         # 🌐 Axios HTTP client config
│   │   ├── lib/
│   │   │   └── utils.ts           # 🛠️ Utility functions
│   │   └── styles.css             # 🎨 Tailwind + animations
│   ├── components.json             # shadcn/ui configuration
│   ├── orval.config.ts             # API generation configuration  
│   ├── package.json               # Bun dependencies
│   └── vite.config.ts             # Vite + TanStack Start config
│
└── deployment/                     # 🚢 Production deployment
    ├── docker-compose.prod.yaml    # Production containers
    ├── nginx.conf                  # Load balancer config
    ├── deploy.sh                   # Deployment script
    └── .env.prod.example           # Production environment
```

## 🎯 Customization Guide

### 1. **Configure Your Agent**

Edit `backend/agents/main_agent.py`:

```python
# Basic configuration via environment variables
AGENT_NAME=my_assistant
AGENT_MODEL=gemini-2.0-flash-exp
AGENT_DESCRIPTION=My custom AI assistant

# Or edit the agent directly
root_agent = Agent(
    name="my_custom_agent",
    model="gemini-2.0-flash-exp",  # or LiteLlm(model="openai/gpt-4o")
    instruction="Your custom instructions here...",
    tools=[google_search, your_custom_tools],
    context={
        "expertise": "Your Domain",
        "capabilities": ["Custom", "Features"]
    }
)
```

### 2. **Choose Your Model Provider**

**Google Gemini (Default):**
```bash
MODEL_PROVIDER=gemini
GOOGLE_API_KEY=your_google_api_key
```

**OpenAI via LiteLLM:**
```bash
MODEL_PROVIDER=litellm
AGENT_MODEL=openai/gpt-4o
OPENAI_API_KEY=your_openai_key
```

**Local Ollama:**
```bash
MODEL_PROVIDER=litellm
AGENT_MODEL=ollama_chat/llama3.1
OLLAMA_API_BASE=http://localhost:11434
```

### 3. **Configure Services**

**MongoDB (Sessions):**
```bash
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=my_app_sessions
```

**S3 (Artifacts):**
```bash
S3_BUCKET_NAME=my-app-artifacts
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

## 🛠 Advanced Configuration

### Custom Tools Integration

Add your own tools to `backend/agents/main_agent.py`:

```python
from google.adk.tools import Tool

@Tool
def my_custom_tool(query: str) -> str:
    """Your custom tool description"""
    # Implementation
    return "Result"

root_agent = Agent(
    # ...
    tools=[google_search, my_custom_tool]
)
```

### Database Integration

Add database models in `backend/models/`:

```python
from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class MyModel(Base):
    __tablename__ = "my_table"
    id = Column(String, primary_key=True)
    # ... your fields
```

### Frontend API Integration

**Complete Type-Safe API Integration:**

```typescript
// 1. Generated TypeScript types from OpenAPI schema
import type { Session, Event, ChatParams } from '@/types/api';

// 2. Use TanStack Query hooks for API calls
import { useRunAgent, useRunAgentStream, useSessions } from '@/hooks/api-hooks';

// 3. Chat with agents (standard)
const { mutate: runAgent } = useRunAgent();
runAgent({
  appName: 'my-agent',
  userId: 'user123',
  sessionId: 'session456',
  message: { parts: [{ text: 'Hello!' }] }
});

// 4. Chat with agents (streaming)
const { startStream } = useRunAgentStream();
const stream = startStream(chatParams);
for await (const event of stream) {
  console.log('New event:', event);
}

// 5. Session management
const { data: sessions } = useSessions({ appName: 'my-agent', userId: 'user123' });
const { mutate: createSession } = useCreateSession();

// 6. Real-time WebSocket connection
import { adkApiClient } from '@/lib/api-client';
const ws = adkApiClient.createLiveConnection({
  appName: 'my-agent',
  userId: 'user123', 
  sessionId: 'session456'
});
```

**Available API Hooks (30+ hooks):**
- **Sessions**: `useSessions()`, `useCreateSession()`, `useDeleteSession()`
- **Agent Execution**: `useRunAgent()`, `useRunAgentStream()`
- **Artifacts**: `useArtifacts()`, `useArtifact()`, `useDeleteArtifact()`
- **Evaluations**: `useEvalSets()`, `useRunEval()`, `useEvalResults()`
- **Debug/Tracing**: `useTraceData()`, `useSessionTrace()`, `useEventGraph()`

### API Endpoints

Add custom endpoints in `backend/main.py`:

```python
@app.get("/api/custom")
async def custom_endpoint():
    return {"data": "custom response"}
```

## 🏗 Architecture

### Frontend: TanStack Start SPA Mode

This template uses **TanStack Start in SPA (Single Page Application) mode**:

- **Client-side rendering** - No server-side rendering of routes
- **Server functions** - Type-safe bridge between frontend and FastAPI backend  
- **File-based routing** - Organized route structure in `src/routes/`
- **Static deployment ready** - Build output can be served from CDN or static hosting
- **Development server** - Full hot reload and dev tools during development

### Backend: FastAPI + Google ADK

- **Google Agent Development Kit** - Sophisticated AI agent processing
- **MongoDB Sessions** - Persistent conversation storage via adk-extra-services
- **S3 Artifacts** - File storage and versioning via adk-extra-services
- **Multi-model support** - Gemini, LiteLLM (OpenAI, Anthropic, local models)
- **Type-safe APIs** - Pydantic validation and OpenAPI documentation

### Communication Flow

```
Frontend (TanStack Start SPA)
    ↓ Server Functions (Type-safe)
FastAPI Backend (Python)
    ↓ Google ADK
AI Models (Gemini/LiteLLM/Local)
    ↓ Storage
MongoDB (Sessions) + S3 (Artifacts)
```

## 🚢 Deployment

### Development
```bash
./deployment/deploy.sh dev
```

### Production
```bash
# Configure production environment
cp deployment/.env.prod.example .env.prod
# Edit .env.prod with production values

# Deploy
./deployment/deploy.sh prod
```

### Deployment Script Commands
```bash
./deployment/deploy.sh dev      # Start development
./deployment/deploy.sh prod     # Start production
./deployment/deploy.sh logs     # View logs
./deployment/deploy.sh stop     # Stop services
./deployment/deploy.sh clean    # Full cleanup
```

## 🔧 Development Tools

### Hot Reload Development
```bash
# Enable hot reload in docker-compose.yaml
volumes:
  - ./backend:/app
  - /app/.venv  # Keep venv separate
```

### Debugging
```bash
# Enable LiteLLM debug
LITELLM_DEBUG=True

# Backend logs
docker-compose logs -f backend

# Database inspection
docker-compose --profile tools up  # Starts MongoDB Express
```

### Testing
```bash
# Backend tests
cd backend && uv run pytest

# Frontend tests  
cd frontend && bun test

# Integration tests
curl http://localhost:8000/health
```

## 📚 Documentation

### Service Integration
- **MongoDB Sessions**: See [adk-extra-services](https://github.com/edu010101/adk-extra-services)
- **S3 Artifacts**: Compatible with AWS S3, MinIO, DigitalOcean Spaces
- **LiteLLM**: Supports 100+ model providers
- **Google ADK**: [Official documentation](https://github.com/google/adk-python)

### Model Providers
- **Gemini Models**: AI Studio (development) or Vertex AI (production)
- **OpenAI**: GPT-4, GPT-3.5-turbo via LiteLLM
- **Anthropic**: Claude models via LiteLLM  
- **Local Models**: Ollama, vLLM, or any OpenAI-compatible endpoint

### Environment Variables
See `.env.example` and `backend/.env.example` for complete configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google ADK](https://github.com/google/adk-python) - Agent Development Kit
- [adk-extra-services](https://github.com/edu010101/adk-extra-services) - MongoDB & S3 services
- [LiteLLM](https://github.com/BerriAI/litellm) - Multi-model integration
- [uv](https://github.com/astral-sh/uv) - Fast Python package management

---

## 🚀 Get Started Now

```bash
git clone <this-repo>
cd google-adk-template
cp .env.example .env
# Add your API keys to .env
docker-compose up --build
```

**Your AI agent will be running at `http://localhost:8000`** 🎉