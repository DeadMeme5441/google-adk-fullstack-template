# 📱 Frontend - TanStack Start React SPA

> **Modern React chat interface with shadcn/ui components, auto-generated API client, and professional design**

A sophisticated chat interface built with TanStack Start in SPA mode, featuring complete type safety, beautiful UI components, and seamless integration with the Google ADK backend.

## ✨ Key Features

### 🎨 **Professional Chat Interface**
- **Modern Design** - Claude.ai/ChatGPT-style interface with gradients and animations
- **shadcn/ui Components** - Beautiful, accessible components built on Radix UI primitives
- **Responsive Layout** - Mobile-first design that works on all screen sizes
- **Smooth Animations** - Custom CSS animations and transitions
- **Glass Morphism** - Backdrop blur effects and transparency

### 🔧 **Type-Safe Development**
- **Auto-Generated API Client** - TypeScript hooks generated from backend OpenAPI schema
- **Complete Type Safety** - End-to-end types from backend Pydantic models
- **TanStack Query** - Smart caching, background updates, optimistic UI
- **Real-time Updates** - WebSocket and SSE streaming support

### ⚡ **Modern Stack**
- **TanStack Start** - High-performance React framework with file-based routing
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first styling with custom design system
- **Bun** - Fast package manager and runtime
- **Orval** - OpenAPI to TypeScript client generation

## 🏗 Architecture

```
frontend/
├── src/
│   ├── routes/                      # 🗂️ File-based routing
│   │   ├── __root.tsx              # Root layout with navigation
│   │   ├── index.tsx               # Start page with chat input
│   │   ├── chat.tsx                # Chat layout page
│   │   └── chat.$sessionId.tsx     # Individual chat sessions
│   │
│   ├── components/                  # 🎨 React components
│   │   ├── ui/                     # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   ├── StartPage.tsx           # Landing page with examples
│   │   ├── ChatInterface.tsx       # Main chat component
│   │   ├── ChatSidebar.tsx         # Session management
│   │   ├── ChatMessage.tsx         # Message bubbles
│   │   └── ChatInput.tsx           # Message input area
│   │
│   ├── api/                         # 🔌 API integration
│   │   ├── generated.ts            # Auto-generated client (30+ hooks)
│   │   └── mutator.ts              # HTTP client configuration
│   │
│   ├── lib/
│   │   └── utils.ts                # Utility functions (cn helper)
│   │
│   └── styles.css                   # 🎨 Global styles and animations
│
├── components.json                  # shadcn/ui configuration
├── orval.config.ts                 # API client generation config
├── package.json                    # Bun dependencies
├── vite.config.ts                  # Vite + TanStack Start config
└── tailwind.config.ts              # Tailwind CSS configuration
```

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) 1.0+ (recommended)
- Node.js 18+ (alternative)
- Backend running on http://localhost:8000

### Installation & Development

```bash
cd frontend

# Install dependencies
bun install

# Generate API client from backend
bun run generate

# Start development server
bun run dev
# Opens at http://localhost:3000

# Watch for API changes (in separate terminal)
bun run generate:watch
```

### Build for Production

```bash
# Type checking
bun run typecheck

# Build optimized bundle
bun run build

# Preview production build
bun run preview
```

## 🎨 Design System

### Color Palette
Our design system uses a modern gradient-based approach:

```css
/* Primary Gradients */
.gradient-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
}

/* Background Gradients */  
.gradient-background {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

/* Card Backgrounds */
.card-glass {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.7);
}
```

### Typography
- **Headings** - Gradient text effects with `bg-gradient-to-r` and `bg-clip-text`
- **Body** - Clean, readable fonts with proper hierarchy
- **Code** - Keyboard shortcuts styled as `<kbd>` elements

### Animations
Custom animations defined in `src/styles.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInFromBottom {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

## 🔌 API Integration

### Auto-Generated Client

The frontend uses [Orval](https://orval.dev/) to generate a complete TypeScript client from the backend's OpenAPI schema:

```typescript
// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  agent_api: {
    input: {
      target: 'http://localhost:8000/openapi.json'
    },
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',
      baseUrl: 'http://localhost:8000',
      override: {
        mutator: {
          path: './src/api/mutator.ts',
          name: 'customInstance'
        }
      }
    }
  }
});
```

### Generated Hooks

The client generates 30+ React hooks for all backend endpoints:

```typescript
// All hooks auto-generated from backend OpenAPI
import {
  // Agent operations
  useRunAgentAgentRunPost,
  useStreamAgentAgentStreamPost,
  
  // Session management
  useListSessionsAppsAppNameUsersUserIdSessionsGet,
  useCreateSessionAppsAppNameUsersUserIdSessionsPost,
  useDeleteSessionAppsAppNameUsersUserIdSessionsSessionIdDelete,
  
  // Authentication
  useLoginForAccessTokenAuthLoginPost,
  useRegisterAuthRegisterPost,
  useRefreshTokenAuthRefreshPost,
  
  // Health and system
  useHealthCheckHealthGet,
  useGetInfoInfoGet,
  
  // 20+ more hooks...
} from './api/generated';
```

### Usage Examples

**Chat with Agent:**
```typescript
function ChatInterface() {
  const { mutate: runAgent, isPending } = useRunAgentAgentRunPost();
  
  const handleSendMessage = (message: string) => {
    runAgent({
      data: {
        app_name: 'my-agent',
        user_id: 'user123',
        session_id: sessionId,
        message: { parts: [{ text: message }] }
      }
    });
  };
  
  return (
    <div>
      <ChatInput onSend={handleSendMessage} disabled={isPending} />
    </div>
  );
}
```

**Session Management:**
```typescript
function ChatSidebar() {
  const { data: sessions, isLoading } = useListSessionsAppsAppNameUsersUserIdSessionsGet({
    appName: 'my-agent',
    userId: 'user123'
  });
  
  const { mutate: createSession } = useCreateSessionAppsAppNameUsersUserIdSessionsPost();
  
  const handleNewChat = () => {
    createSession({
      appName: 'my-agent',
      userId: 'user123',
      data: { app_name: 'my-agent', user_id: 'user123' }
    });
  };
  
  return (
    <div>
      <Button onClick={handleNewChat}>New Chat</Button>
      {sessions?.map(session => (
        <SessionItem key={session.id} session={session} />
      ))}
    </div>
  );
}
```

**Real-time Streaming:**
```typescript
function StreamingChat() {
  const { mutate: streamAgent } = useStreamAgentAgentStreamPost();
  const [messages, setMessages] = useState([]);
  
  const handleStreamMessage = (message: string) => {
    streamAgent({
      data: {
        app_name: 'my-agent',
        user_id: 'user123', 
        session_id: sessionId,
        message: { parts: [{ text: message }] }
      }
    }, {
      onSuccess: (stream) => {
        // Handle SSE stream
        stream.on('data', (chunk) => {
          setMessages(prev => [...prev, chunk]);
        });
      }
    });
  };
  
  return <ChatInterface onSend={handleStreamMessage} />;
}
```

### Type Safety

Complete type safety from backend to frontend:

```typescript
// All types auto-generated from backend Pydantic models
import type { 
  Session, 
  Event, 
  Message, 
  User,
  AgentRunRequest,
  AgentRunResponse 
} from './api/generated';

// Type-safe component props
interface ChatMessageProps {
  message: Event;  // Fully typed from backend
  user?: User;
  isLoading?: boolean;
}

function ChatMessage({ message, user, isLoading }: ChatMessageProps) {
  // TypeScript knows the shape of message and user
  return (
    <div>
      <span>{user?.name}</span>
      <p>{message.data.parts?.[0]?.text}</p>
    </div>
  );
}
```

## 🎯 Component Architecture

### StartPage Component
The landing page that introduces users to the agent:

```typescript
function StartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Sparkles className="h-16 w-16 mx-auto mb-6 text-purple-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Your AI Assistant
          </h1>
          <p className="text-lg text-slate-600 mt-4">
            Start a conversation and explore what we can accomplish together.
          </p>
        </div>
        
        {/* Chat Input */}
        <ChatInput onStart={handleStart} />
        
        {/* Example Prompts */}
        <ExamplePrompts onSelect={handlePromptSelect} />
      </div>
    </div>
  );
}
```

### ChatInterface Component
The main chat conversation view:

```typescript
function ChatInterface({ sessionId }: { sessionId: string }) {
  const { data: events, isLoading } = useListEventsAppsAppNameUsersUserIdSessionsSessionIdEventsGet({
    appName: 'my-agent',
    userId: 'user123',
    sessionId
  });
  
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {events?.map(event => (
            <ChatMessage key={event.id} event={event} />
          ))}
        </div>
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
```

### ChatMessage Component
Individual message bubbles with styling:

```typescript
function ChatMessage({ event, isLast }: ChatMessageProps) {
  const isUser = event.source === 'user';
  
  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-xs lg:max-w-md px-4 py-2 rounded-lg
        ${isUser 
          ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white' 
          : 'bg-white border shadow-sm'
        }
      `}>
        <p className="text-sm">{event.data.parts?.[0]?.text}</p>
      </div>
    </div>
  );
}
```

### ChatInput Component
Message input with auto-resize and keyboard shortcuts:

```typescript
function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white/50 backdrop-blur-sm">
      <div className="flex space-x-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 min-h-[44px] max-h-32 resize-none"
        />
        <Button type="submit" disabled={disabled || !message.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
      </p>
    </form>
  );
}
```

## 🛠 Development

### Available Scripts

```bash
# Development
bun run dev                 # Start dev server with hot reload
bun run generate           # Generate API client from backend
bun run generate:watch     # Watch for OpenAPI schema changes

# Production
bun run build              # Build optimized static files
bun run preview            # Preview production build locally

# Quality Assurance  
bun run typecheck          # TypeScript type checking
bun run test               # Run tests with Vitest
bun run test:watch         # Run tests in watch mode
bun run test:coverage      # Generate test coverage report
```

### Adding Components

**shadcn/ui components:**
```bash
# Add new shadcn/ui components
bunx shadcn@latest add dialog
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add popover
bunx shadcn@latest add toast

# List available components
bunx shadcn@latest add
```

**Custom components:**
```bash
# Create in src/components/
# Follow existing patterns for styling and TypeScript
# Use proper prop types and export conventions
```

### Routing

TanStack Start uses file-based routing:

```typescript
// src/routes/__root.tsx - Root layout
export const Route = createRootRoute({
  component: RootComponent
});

// src/routes/index.tsx - Home page  
export const Route = createFileRoute('/')({
  component: StartPage
});

// src/routes/chat.tsx - Chat layout
export const Route = createFileRoute('/chat')({
  component: ChatLayout  
});

// src/routes/chat.$sessionId.tsx - Dynamic session route
export const Route = createFileRoute('/chat/$sessionId')({
  component: ChatSession
});
```

### State Management

The application uses TanStack Query for server state and local React state for UI state:

```typescript
// Server state (auto-cached)
const { data: sessions, error, refetch } = useListSessionsAppsAppNameUsersUserIdSessionsGet({
  appName: 'my-agent',
  userId: 'user123'
});

// Local UI state
const [isLoading, setIsLoading] = useState(false);
const [message, setMessage] = useState('');
const [activeSession, setActiveSession] = useState<string | null>(null);
```

### Error Handling

```typescript
// API error handling
const { mutate: runAgent, error, isPending } = useRunAgentAgentRunPost();

if (error) {
  return (
    <div className="text-red-500">
      Error: {error.message}
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
}

// Global error boundary
function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong. Please refresh the page.</div>}
      onError={(error) => console.error('App error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 🚀 Deployment

### SPA Architecture

This application is built as a Single Page Application (SPA):

- **Client-side routing** - All navigation handled in the browser
- **Static build output** - No server-side rendering required
- **API-first architecture** - Backend provides JSON API, frontend consumes it
- **CDN friendly** - Can be deployed to any static hosting service

### Build Process

```bash
# Build generates optimized static files
bun run build

# Output structure:
dist/
├── index.html              # Entry point for SPA
├── assets/
│   ├── index-[hash].js     # Main application bundle
│   ├── index-[hash].css    # Styles
│   └── [asset]-[hash].*    # Images, fonts, etc.
└── vite.manifest.json      # Build manifest
```

### Deployment Options

**Static Hosting Services:**
```bash
# Vercel
vercel --prod

# Netlify  
netlify deploy --prod --dir=dist

# AWS S3 + CloudFront
aws s3 sync dist/ s3://your-bucket-name/

# GitHub Pages
# Push dist/ contents to gh-pages branch
```

**Docker Deployment:**
```dockerfile
# Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**FastAPI Integration:**
```python
# Serve frontend from backend (optional)
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="static")
```

### Environment Configuration

```bash
# .env or build-time variables
VITE_API_BASE_URL=https://api.yourdomain.com  # Production backend URL
VITE_APP_NAME=your-app-name                   # Application identifier
VITE_ENABLE_DEBUG=false                       # Disable debug in production
```

## 🧪 Testing

### Test Setup

The project uses Vitest with React Testing Library:

```typescript
// src/lib/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

### Test Examples

```typescript
// src/components/__tests__/ChatMessage.test.tsx
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../lib/test-utils';
import ChatMessage from '../ChatMessage';

describe('ChatMessage', () => {
  it('renders user messages with correct styling', () => {
    const mockEvent = {
      id: '1',
      source: 'user',
      data: { parts: [{ text: 'Hello!' }] }
    };
    
    const { getByText } = renderWithProviders(
      <ChatMessage event={mockEvent} />
    );
    
    expect(getByText('Hello!')).toBeInTheDocument();
  });
  
  it('renders assistant messages differently', () => {
    const mockEvent = {
      id: '2', 
      source: 'assistant',
      data: { parts: [{ text: 'Hi there!' }] }
    };
    
    const { container } = renderWithProviders(
      <ChatMessage event={mockEvent} />
    );
    
    expect(container.firstChild).toHaveClass('bg-white');
  });
});
```

### Running Tests

```bash
# Run all tests
bun test

# Watch mode for development  
bun test --watch

# Generate coverage report
bun test --coverage

# Run specific test file
bun test ChatMessage.test.tsx

# Debug tests
bun test --inspect-brk
```

## 📚 Useful Resources

### Documentation
- **[TanStack Start](https://tanstack.com/start)** - React framework documentation
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Orval](https://orval.dev/)** - API client generation
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

### Commands Reference
```bash
# Package Management
bun add <package>              # Add dependency
bun add -d <package>          # Add dev dependency
bun remove <package>          # Remove dependency
bun update                    # Update all dependencies

# shadcn/ui
bunx shadcn@latest init       # Initialize shadcn/ui
bunx shadcn@latest add <comp> # Add component
bunx shadcn@latest diff       # Check for updates

# API Client Generation
bun run generate              # One-time generation
bun run generate:watch        # Watch for changes
```

## 🤝 Contributing

### Development Workflow

1. **Setup development environment:**
   ```bash
   bun install
   bun run generate
   bun run dev
   ```

2. **Make changes following conventions:**
   - Use TypeScript for all components
   - Follow existing component patterns
   - Style with Tailwind CSS
   - Add tests for new functionality

3. **Validate changes:**
   ```bash
   bun run typecheck
   bun run test  
   bun run build
   ```

### Code Style

- **Components** - Use functional components with hooks
- **Styling** - Tailwind CSS with custom animations
- **Types** - Leverage auto-generated types from backend
- **Files** - kebab-case for files, PascalCase for components
- **Imports** - Absolute imports using path aliases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **[TanStack](https://tanstack.com/)** - Modern React tooling
- **[shadcn](https://twitter.com/shadcn)** - Beautiful component system
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

---

## 🎯 Next Steps

1. **Customize the design** - Update colors, fonts, and animations in `tailwind.config.ts`
2. **Add new features** - Build additional components using shadcn/ui patterns
3. **Integrate with backend** - Ensure API client stays in sync with `bun run generate`
4. **Deploy to production** - Choose your preferred static hosting solution

**Start building beautiful chat interfaces today!** 🚀