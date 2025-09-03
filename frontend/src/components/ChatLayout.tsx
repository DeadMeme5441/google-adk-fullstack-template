import { ChatSidebar } from './ChatSidebar'
import { ChatInterface } from './ChatInterface'

interface ChatLayoutProps {
  sessionId: string
}

export function ChatLayout({ sessionId }: ChatLayoutProps) {
  return (
    <div className="flex h-full chat-container">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r flex-shrink-0 hidden md:block">
        <ChatSidebar currentSessionId={sessionId} />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatInterface sessionId={sessionId} />
      </div>
    </div>
  )
}