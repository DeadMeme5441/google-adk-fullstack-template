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
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
              "min-h-[52px] max-h-32 resize-none border border-gray-200 dark:border-gray-600 shadow-sm",
              "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-50",
              "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400",
              "rounded-xl px-4 py-3",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "transition-all duration-200",
              "hover:shadow-md hover:bg-white dark:hover:bg-gray-600",
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
            "h-[52px] w-[52px] rounded-xl flex-shrink-0",
            "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-white"
          )}
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center max-w-4xl mx-auto">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">Shift+Enter</kbd> for new line
      </div>
    </div>
  )
}