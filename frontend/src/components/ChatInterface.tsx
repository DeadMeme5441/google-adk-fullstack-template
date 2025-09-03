import { useState, useEffect, useRef } from 'react'
import { useGetSessionAppsAppNameUsersUserIdSessionsSessionIdGet, useRunAgentRunPost } from '../api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ScrollArea } from './ui/scroll-area'
import { Sparkles, Bot, Files, MessageCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'

interface ChatInterfaceProps {
  sessionId: string
  onToggleFileSidebar?: () => void
  isFileSidebarOpen?: boolean
}

export function ChatInterface({ sessionId, onToggleFileSidebar, isFileSidebarOpen }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  
  // Get session data
  const { data: session, isLoading: sessionLoading, error: sessionError } = 
    useGetSessionAppsAppNameUsersUserIdSessionsSessionIdGet(
      { 
        appName: 'default',
        userId: 'default-user',
        sessionId 
      },
      {
        refetchInterval: 2000, // Refresh every 2 seconds to get new messages
      }
    )
  
  const runAgentMutation = useRunAgentRunPost()

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [session?.events])

  // Handle initial message from navigation state
  useEffect(() => {
    const state = window.history.state
    if (state?.usr?.initialMessage && session?.events?.length === 0) {
      const message = state.usr.initialMessage
      // Clear the state to prevent re-sending
      window.history.replaceState({}, '', window.location.pathname)
      // Send the initial message
      handleSendMessage(message)
    }
  }, [session?.events])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return
    
    setIsLoading(true)
    try {
      await runAgentMutation.mutateAsync({
        data: {
          appName: 'default',
          userId: 'default-user',
          sessionId,
          newMessage: {
            text: message
          },
          streaming: false
        }
      })
      
      // Refresh session data to get new messages
      queryClient.invalidateQueries({
        queryKey: ['getSessionAppsAppNameUsersUserIdSessionsSessionIdGet']
      })
      
      // Also refresh sessions list to update preview
      queryClient.invalidateQueries({
        queryKey: ['listSessionsAppsAppNameUsersUserIdSessionsGet']
      })
      
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center theme-bg-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 theme-bg-secondary rounded-2xl flex items-center justify-center animate-pulse">
            <MessageCircle className="w-8 h-8 theme-primary-text" />
          </div>
          <div className="flex items-center space-x-3 theme-text-secondary">
            <div className="animate-spin w-5 h-5 border-2 border-blue-300 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 rounded-full" />
            <span className="text-sm font-medium">Loading conversation...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (sessionError) {
    return (
      <div className="flex-1 flex items-center justify-center theme-bg-primary">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Failed to load conversation
            </h3>
            <p className="text-sm theme-text-secondary">
              There was an error loading this chat session. Please try refreshing the page or start a new conversation.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="theme-primary-button"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  const messages = session?.events || []

  return (
    <div className="flex-1 flex flex-col h-full theme-bg-primary">
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 theme-bg-primary theme-border border-b theme-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 theme-primary-button rounded-full flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold theme-text-primary">
                AI Assistant
              </h2>
              <p className="text-xs theme-text-muted">
                {isLoading ? 'Typing...' : 'Online • Ready to help'}
              </p>
            </div>
          </div>
          
          {/* File Sidebar Toggle */}
          {onToggleFileSidebar && (
            <Button
              onClick={onToggleFileSidebar}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 theme-hover-bg-subtle rounded-lg"
              title={isFileSidebarOpen ? 'Hide files' : 'Show files'}
            >
              <Files className={`h-4 w-4 transition-all duration-200 ${
                isFileSidebarOpen 
                  ? 'theme-primary-text scale-110' 
                  : 'theme-text-muted hover:theme-text-primary hover:scale-110'
              }`} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 theme-bg-secondary">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[500px] p-8">
            <div className="text-center space-y-8 max-w-lg">
              {/* Welcome Animation */}
              <div className="relative">
                <div className="w-24 h-24 theme-bg-primary rounded-3xl flex items-center justify-center mx-auto theme-shadow">
                  <MessageCircle className="w-12 h-12 theme-primary-text" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              
              {/* Welcome Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold theme-text-primary">
                    Let's start chatting!
                  </h3>
                  <p className="text-lg theme-text-secondary leading-relaxed">
                    I'm your AI assistant, ready to help with questions, analysis, writing, coding, and more.
                  </p>
                </div>
                
                {/* Feature Pills */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                  <span className="px-4 py-2 theme-card theme-border border rounded-full text-sm theme-text-muted flex items-center space-x-2">
                    <span>💡</span>
                    <span>Ask anything</span>
                  </span>
                  <span className="px-4 py-2 theme-card theme-border border rounded-full text-sm theme-text-muted flex items-center space-x-2">
                    <span>📄</span>
                    <span>Upload files</span>
                  </span>
                  <span className="px-4 py-2 theme-card theme-border border rounded-full text-sm theme-text-muted flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Get instant help</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 md:px-6 space-y-8">
            {messages.map((event, index) => (
              <ChatMessage 
                key={event.invocationId || `msg-${index}`} 
                event={event} 
              />
            ))}
            
            {/* Loading Message */}
            {isLoading && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 theme-primary-button rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3 theme-text-muted">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Chat Input */}
      <div className="flex-shrink-0 theme-bg-primary theme-border border-t p-4">
        <ChatInput 
          onSendMessage={handleSendMessage}
          sessionId={sessionId}
          disabled={isLoading}
          placeholder={messages.length === 0 ? "Start your conversation..." : "Type your message..."}
        />
      </div>
    </div>
  )
}