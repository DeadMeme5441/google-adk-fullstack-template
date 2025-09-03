import { User, Bot, Copy, Check, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import { cn } from '../lib/utils'
import type { Event } from '../api/generated'

interface ChatMessageProps {
  event: Event
  isLoading?: boolean
  className?: string
}

export function ChatMessage({ event, isLoading = false, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  
  const isUser = event.author === 'user' || event.author === 'human'
  const messageText = event.content?.text || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  if (isUser) {
    return (
      <div className={cn("flex justify-end mb-6", className)}>
        <div className="flex items-start space-x-3 max-w-[85%]">
          <div className="flex-1 min-w-0">
            <div className="group relative">
              <div className="theme-primary-button rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {messageText}
                </p>
              </div>
              
              {/* Copy button for user messages */}
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg border theme-border"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 theme-text-muted hover:theme-text-primary transition-colors" />
                )}
              </Button>
            </div>
          </div>

          {/* User Avatar */}
          <div className="flex-shrink-0 w-8 h-8 theme-bg-secondary rounded-full flex items-center justify-center theme-border border shadow-sm">
            <User className="w-4 h-4 theme-text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex justify-start mb-6", className)}>
      <div className="flex items-start space-x-3 max-w-[90%]">
        
        {/* Assistant Avatar */}
        <div className="flex-shrink-0 w-8 h-8 theme-primary-button rounded-full flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="group relative">
            <div className="theme-card theme-border border rounded-2xl rounded-bl-sm px-4 py-3 theme-shadow">
              {isLoading ? (
                <div className="flex items-center space-x-4 py-3">
                  {/* Animated dots */}
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  
                  {/* Thinking indicator */}
                  <div className="flex items-center space-x-2 theme-text-muted">
                    <Sparkles className="w-4 h-4 theme-primary-text animate-pulse" />
                    <span className="text-sm font-medium">Assistant is thinking...</span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words theme-text-primary mb-0">
                    {messageText}
                  </p>
                </div>
              )}
            </div>

            {/* Copy button for assistant messages */}
            {!isLoading && messageText && (
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="absolute -right-12 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 p-0 theme-hover-bg-subtle rounded-lg border theme-border"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 theme-text-muted hover:theme-text-primary transition-colors" />
                )}
              </Button>
            )}
          </div>

          {/* Optional timestamp - ready for future enhancement */}
          {/* <div className="mt-2 text-xs theme-text-muted pl-2">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div> */}
        </div>
      </div>
    </div>
  )
}