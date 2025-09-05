import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ChatMessages() {
  const { messages, isLoading } = useChat()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [messages])
  
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-2xl">👋</div>
          <h3 className="text-lg font-medium">Welcome to your AI Assistant</h3>
          <p className="text-muted-foreground">
            Start a conversation by typing a message below
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <ScrollArea ref={scrollAreaRef} className="h-full">
      <div className="space-y-4 p-4">
        {messages.map((message, index) => (
          <ChatMessage 
            key={index} 
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Assistant is thinking...</span>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}