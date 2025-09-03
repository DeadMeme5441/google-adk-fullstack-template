import { useState } from 'react'
import { ChatSidebar } from './ChatSidebar'
import { ChatInterface } from './ChatInterface'
import { FileSidebar } from './FileSidebar'

interface ChatLayoutProps {
  sessionId: string
}

export function ChatLayout({ sessionId }: ChatLayoutProps) {
  const [isFileSidebarOpen, setIsFileSidebarOpen] = useState(false)

  return (
    <div className="flex h-full chat-container">
      {/* Left Sidebar - Chat Sessions */}
      <div className="w-80 bg-gray-50 border-r flex-shrink-0 hidden md:block">
        <ChatSidebar currentSessionId={sessionId} />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <ChatInterface 
          sessionId={sessionId}
          onToggleFileSidebar={() => setIsFileSidebarOpen(!isFileSidebarOpen)}
          isFileSidebarOpen={isFileSidebarOpen}
        />
      </div>
      
      {/* Right Sidebar - File Management */}
      <FileSidebar 
        sessionId={sessionId}
        isOpen={isFileSidebarOpen}
        onToggle={() => setIsFileSidebarOpen(!isFileSidebarOpen)}
        className="fixed right-0 top-0 z-50 h-full"
      />
    </div>
  )
}