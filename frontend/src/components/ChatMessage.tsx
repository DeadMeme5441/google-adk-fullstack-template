import { EventOutput } from '../api/generated'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Card, CardContent } from './ui/card'
import { User, Bot, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatMessageProps {
  event: Partial<EventOutput>
  isLoading?: boolean
}

export function ChatMessage({ event, isLoading = false }: ChatMessageProps) {
  const isUser = event.author === 'user'
  const isAssistant = event.author === 'assistant' || event.author?.includes('agent') || event.author?.includes('model')
  
  // Get message text from content
  const messageText = event.content?.text || ''
  
  // Don't render empty messages
  if (!messageText && !isLoading) {
    return null
  }

  return (
    <div className={cn(
      "flex gap-4 group",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <Avatar className={cn(
        "w-8 h-8 flex-shrink-0",
        isUser 
          ? "bg-blue-600 dark:bg-blue-500" 
          : "bg-gray-600 dark:bg-gray-500"
      )}>
        <AvatarFallback className={cn(
          "text-white text-xs font-medium border-0",
          isUser 
            ? "bg-blue-600 dark:bg-blue-500" 
            : "bg-gray-600 dark:bg-gray-500"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-1", isUser ? "items-end" : "items-start")}>
        {/* Name */}
        <div className={cn("text-xs font-medium text-gray-600 dark:text-gray-400 px-1", isUser ? "text-right" : "text-left")}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        {/* Message Bubble */}
        {isUser ? (
          // User message - blue bubble
          <div className={cn(
            "inline-block max-w-[80%] rounded-lg px-4 py-3",
            "bg-blue-600 dark:bg-blue-500 text-white shadow-sm",
            "ml-auto"
          )}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-white/80 text-sm">Thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {messageText}
              </div>
            )}
          </div>
        ) : (
          // Assistant message - card style
          <Card className="max-w-[80%] border border-gray-200 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-500 animate-pulse" />
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Thinking...</span>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-50">
                  {messageText}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {event.finishReason && !isLoading && (
          <div className={cn(
            "text-[10px] text-gray-500 dark:text-gray-400 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {event.finishReason}
          </div>
        )}
      </div>
    </div>
  )
}