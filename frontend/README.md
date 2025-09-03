# 🎨 Agent Template - Frontend

> **Modern React chat interface with shadcn/ui, TanStack Start SPA, and auto-generated API client**

This is the frontend component of the Agent Template Repository. It provides a professional chat interface similar to Claude.ai or ChatGPT.com for interacting with AI agents, built with modern React and TypeScript.

## ✨ Features

### 🎨 **Modern Chat Interface**
- **Professional Design** - Claude.ai/ChatGPT-style chat interface
- **shadcn/ui Components** - Beautiful, accessible components with Radix UI primitives
- **Smooth Animations** - Custom CSS animations, hover effects, and transitions
- **Purple/Blue Gradients** - Modern gradient color scheme throughout
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### 🚀 **Technical Stack**
- **TanStack Start SPA** - Modern React framework with file-based routing
- **TypeScript** - Complete type safety from backend to frontend  
- **Orval Code Generation** - Auto-generated API client from OpenAPI schema
- **TanStack Query** - Smart caching, optimistic updates, and streaming support
- **Tailwind CSS** - Utility-first styling with custom animations

### 🔧 **Developer Experience**
- **Type Safety** - Complete TypeScript integration from backend OpenAPI schema
- **Hot Reload** - Instant updates during development
- **Auto-Generated API** - 30+ React hooks generated from backend API
- **Modern Tooling** - Bun, Vite, and ESLint for optimal development experience

## 🚀 Quick Start

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
bun install

# Start development server
bun run dev
# Opens at: http://localhost:3000

# Generate API client from backend
bun run generate

# Type checking
bun run typecheck

# Build for production  
bun run build

# Preview production build
bun run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── routes/                      # File-based routing
│   │   ├── __root.tsx              # Root layout component
│   │   ├── index.tsx               # 🏠 Start page with chat input
│   │   ├── chat.tsx                # 💬 Chat layout page  
│   │   └── chat.$sessionId.tsx     # 🗨️ Individual chat sessions
│   ├── components/                  # React components
│   │   ├── ui/                     # 🎨 shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ...
│   │   ├── StartPage.tsx           # 🚀 Landing page with example prompts
│   │   ├── ChatInterface.tsx       # 💬 Main chat interface
│   │   ├── ChatSidebar.tsx         # 📋 Session management sidebar
│   │   ├── ChatMessage.tsx         # 💭 Message bubbles with avatars
│   │   └── ChatInput.tsx           # ✍️ Message input with animations
│   ├── api/
│   │   ├── generated.ts            # 🔷 Auto-generated API client (Orval)
│   │   └── mutator.ts              # 🌐 Axios HTTP client configuration
│   ├── lib/
│   │   └── utils.ts                # 🛠️ Utility functions (cn helper)
│   └── styles.css                  # 🎨 Global styles, animations
├── components.json                  # shadcn/ui configuration
├── orval.config.ts                 # API client generation config
├── package.json                    # Bun dependencies
├── vite.config.ts                  # Vite + TanStack Start config
└── tailwind.config.ts              # Tailwind CSS configuration
```

## ⚙️ Configuration

### API Client Generation (Orval)

The frontend automatically generates a TypeScript API client from the backend's OpenAPI schema:

```typescript
// orval.config.ts - Clean configuration
import { defineConfig } from 'orval';

export default defineConfig({
  nbfc: {
    input: {
      target: 'http://localhost:8000/openapi.json', // Backend OpenAPI
    },
    output: {
      target: 'src/api/generated.ts',               // Generated client
      client: 'react-query',                       // TanStack Query hooks  
      baseUrl: 'http://localhost:8000',
      override: {
        mutator: {
          path: './src/api/mutator.ts',             // Custom HTTP client
          name: 'customInstance',
        },
      },
    },
  },
});
```

### shadcn/ui Components

Modern, accessible components configured in `components.json`:

```json
{
  "style": "default",
  "rsc": false, 
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils"
  }
}
```

## 🎨 Design System

### Color Scheme
- **Primary**: Purple to blue gradients (`from-purple-600 to-blue-600`)
- **Background**: Subtle gray gradients (`from-slate-50 to-white`)
- **Cards**: Glass morphism with `backdrop-blur-sm` and transparency
- **Text**: Gradient text effects for headings

### Animations
Custom animations defined in `styles.css`:

```css
/* Fade in animation */
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out forwards;
}

/* Slide in from bottom */
.animate-slide-in-from-bottom {
  animation: slideInFromBottom 0.6s ease-out forwards;
}

/* Hover lift effect */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Typography
- **Headers**: Gradient text with `bg-gradient-to-r` and `bg-clip-text`
- **Body**: Clean, readable fonts with proper hierarchy
- **Code**: Keyboard shortcuts styled as `<kbd>` elements

## 🔌 API Integration

### Auto-Generated Hooks

Orval generates 30+ React hooks from the backend OpenAPI schema:

```typescript
// Generated hooks available in src/api/generated.ts
import {
  useHealthCheckHealthGet,
  useListSessionsAppsAppNameUsersUserIdSessionsGet,
  useCreateSessionAppsAppNameUsersUserIdSessionsPost,
  useRunAgentAgentRunPost,
  // ... 30+ more hooks
} from './api/generated'

// Usage in components
function ChatComponent() {
  const { data: sessions } = useListSessionsAppsAppNameUsersUserIdSessionsGet({
    appName: 'my-agent',
    userId: 'user123'
  })

  const createSession = useCreateSessionAppsAppNameUsersUserIdSessionsPost()
  
  return (
    // Your component JSX
  )
}
```

### Type Safety

Complete type safety from backend to frontend:

```typescript
// All types auto-generated from backend Pydantic models
import type { Session, Event, ChatRequest } from './api/generated'

// Type-safe API calls
const session: Session = await createSession.mutateAsync({
  appName: 'my-agent', 
  userId: 'user123',
  data: {
    appName: 'my-agent',
    userId: 'user123'
  }
})
```

## 🎯 Chat Interface Components

### StartPage Component
- **Welcome section** with animated Sparkles icon
- **Chat input** with glass morphism card design
- **Example prompts** with staggered animations and hover effects
- **Responsive layout** adapting to different screen sizes

### ChatInterface Component  
- **Message history** with auto-scroll and loading states
- **Empty state** with friendly messaging
- **Error handling** with retry mechanisms
- **Real-time updates** via TanStack Query

### ChatSidebar Component
- **Session list** with recent conversations
- **New chat button** with loading states
- **Session previews** showing message content
- **Active session highlighting** with gradient borders

### ChatMessage Component
- **User messages**: Gradient bubble design (`purple-500 to blue-600`)
- **Assistant messages**: Card-based with backdrop blur
- **Avatar system**: Gradient avatars for user/assistant differentiation  
- **Responsive design**: Proper spacing and alignment

### ChatInput Component
- **Auto-resizing textarea** with smooth transitions
- **Send button** with loading spinner and gradient background
- **Keyboard shortcuts** clearly indicated with `<kbd>` styling
- **Glass morphism** styling matching the overall design

## 🛠 Development

### Available Scripts

```bash
# Development
bun run dev                    # Start dev server
bun run generate              # Generate API client  
bun run generate:watch        # Watch for OpenAPI changes

# Production
bun run build                 # Build static files
bun run preview               # Preview production build

# Quality
bun run typecheck            # TypeScript checking
bun run test                 # Run tests with Vitest
```

### Adding New Components

1. **shadcn/ui components**:
   ```bash
   bunx shadcn@latest add button
   bunx shadcn@latest add dialog
   bunx shadcn@latest add dropdown-menu
   ```

2. **Custom components**:
   ```bash
   # Create in src/components/
   # Follow existing patterns for styling and TypeScript
   ```

### Styling Guidelines
- Use **Tailwind CSS** classes for styling
- Apply **custom animations** from `styles.css`
- Follow **shadcn/ui** patterns for new components
- Use **gradient effects** for visual interest
- Implement **hover states** and **transitions**

## 🚢 Deployment

### SPA Mode Architecture

This application runs in **SPA (Single Page Application) mode**:

- **Client-side rendering** - No server-side rendering of routes
- **Static file output** - Build generates `_shell.html` and assets
- **CDN friendly** - Can be served from any static hosting
- **Backend integration** - API calls to FastAPI backend

### Build Output

```bash
bun run build
# Generates dist/ folder with:
# ├── _shell.html          # SPA bootstrap file
# ├── assets/             # JS, CSS, images  
# └── vite.config.json    # Build manifest
```

### Deployment Options

1. **Static Hosting**:
   ```bash
   # Vercel, Netlify, GitHub Pages, etc.
   # Just upload the dist/ folder
   ```

2. **CDN Deployment**:
   ```bash
   # CloudFront, CloudFlare, etc.
   # Serve dist/ folder contents
   ```

3. **FastAPI Integration**:
   ```python
   # Serve frontend from FastAPI backend
   from fastapi.staticfiles import StaticFiles
   app.mount("/", StaticFiles(directory="frontend/dist", html=True))
   ```

### Environment Variables

```bash
# Backend API URL (for production)
VITE_API_BASE_URL=https://your-api.com

# Enable/disable development tools
VITE_ENABLE_DEVTOOLS=false
```

## 🧪 Testing

```bash
# Run tests
bun test

# Watch mode  
bun test --watch

# Coverage
bun test --coverage
```

This project uses [Vitest](https://vitest.dev/) for testing with React Testing Library integration.

## 🤝 Contributing

1. **Follow existing patterns** for component structure
2. **Use TypeScript** with proper type definitions
3. **Style with Tailwind CSS** and custom animations
4. **Test components** with Vitest and Testing Library  
5. **Generate API client** after backend changes with `bun run generate`

## 📄 License

This project is part of the Agent Template Repository and follows the same MIT License.

---

## 🔗 Related

- **Backend**: FastAPI with Google ADK in `../backend/`  
- **Main README**: Complete setup guide in `../README.md`
- **Claude Code Integration**: Development guidance in `../CLAUDE.md`
