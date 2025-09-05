import { useState, useRef, KeyboardEvent } from 'react'
import { useChat } from '@/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

export function ChatInput() {
  const { sendMessage, isLoading } = useChat()
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!message.trim() || isLoading) return
    
    const messageText = message.trim()
    setMessage('')
    
    try {
      await sendMessage(messageText)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Could show a toast notification here
    }
    
    // Focus back to input
    inputRef.current?.focus()
  }
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  return (
    <div className="border-t bg-card p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={!message.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}