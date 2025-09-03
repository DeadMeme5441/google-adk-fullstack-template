import { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { ChatFileUploadButton } from './FileUploadButton'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  sessionId?: string
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSendMessage, sessionId, disabled = false, placeholder = "Type your message..." }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return
    
    onSendMessage(message.trim())
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  return (
    <div className="p-4 backdrop-blur-sm bg-white/50 border-t">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3 max-w-4xl mx-auto">
        {/* Upload button - only show when we have a sessionId */}
        {sessionId && (
          <ChatFileUploadButton 
            sessionId={sessionId}
            className="mb-1" 
          />
        )}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[52px] max-h-32 resize-none border-0 shadow-lg",
              "bg-white/80 backdrop-blur-sm",
              "focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500",
              "rounded-2xl px-4 py-3",
              "placeholder:text-gray-500",
              "transition-all duration-200",
              "hover:shadow-xl hover:bg-white/90",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            rows={1}
          />
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || disabled}
          size="icon"
          className={cn(
            "h-[52px] w-[52px] rounded-2xl flex-shrink-0",
            "bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600",
            "hover:from-purple-700 hover:via-purple-800 hover:to-blue-700",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "border-0"
          )}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      
      <div className="mt-3 text-xs text-gray-500 text-center max-w-4xl mx-auto">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}