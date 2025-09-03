import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Send, Paperclip } from 'lucide-react'
import { FileUploadButton } from './FileUploadButton'
import { cn } from '../lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  sessionId: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({ 
  onSendMessage, 
  sessionId, 
  disabled = false, 
  placeholder = "Type your message...",
  className 
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileUploadSuccess = () => {
    // File uploaded successfully - FileSidebar will update automatically
  }

  const isMessageValid = message.trim().length > 0

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end space-x-3 theme-card theme-border border rounded-2xl p-4 theme-shadow focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-200">
          
          {/* File Upload Button */}
          <div className="flex-shrink-0 pb-1">
            <FileUploadButton
              sessionId={sessionId}
              onUploadSuccess={handleFileUploadSuccess}
              disabled={disabled}
              className="h-10 w-10 p-0 theme-hover-bg-subtle rounded-lg flex items-center justify-center border-0 shadow-none transition-colors duration-200"
            >
              <Paperclip className="w-4 h-4 theme-text-muted group-hover:theme-text-primary transition-colors" />
            </FileUploadButton>
          </div>

          {/* Message Input */}
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[44px] max-h-48 resize-none border-0 shadow-none bg-transparent",
                "theme-text-primary placeholder:theme-text-muted",
                "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base leading-relaxed py-2 px-0",
                "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
              )}
              style={{ 
                minHeight: '44px',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0 pb-1">
            <Button
              type="submit"
              disabled={!isMessageValid || disabled}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg transition-all duration-200",
                isMessageValid && !disabled
                  ? "theme-primary-button shadow-sm hover:shadow-md hover:scale-105 transform"
                  : "theme-bg-secondary theme-border border theme-text-muted cursor-not-allowed opacity-50"
              )}
            >
              {disabled ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isMessageValid && !disabled ? "text-white" : ""
                )} />
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center space-x-4 text-xs theme-text-muted">
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 theme-bg-secondary theme-border border rounded text-xs font-mono">Enter</kbd>
              <span>to send</span>
            </span>
            <span className="flex items-center space-x-2">
              <kbd className="px-2 py-1 theme-bg-secondary theme-border border rounded text-xs font-mono">Shift+Enter</kbd>
              <span>for new line</span>
            </span>
          </div>
          {message.length > 0 && (
            <div className="text-xs theme-text-muted">
              {message.length} character{message.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}