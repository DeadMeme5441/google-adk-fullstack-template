import { useState, useEffect, useRef } from 'react'
import { useGetSessionAppsAppNameUsersUserIdSessionsSessionIdGet, useRunAgentRunPost } from '../api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Sparkles, Bot, Files } from 'lucide-react'
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
        appName: 'nbfc-analyst',
        userId: 'default-user',
        sessionId 
      },
      {
        refetchInterval: 5000, // Refresh every 5 seconds to get new messages
      }
    )
  
  const runAgentMutation = useRunAgentRunPost()

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.events])

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return
    
    setIsLoading(true)
    try {
      const response = await runAgentMutation.mutateAsync({
        data: {
          appName: 'nbfc-analyst',
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

  if (sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
          <div className="animate-spin w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 dark:border-blue-500/30 dark:border-t-blue-500 rounded-full" />
          <span>Loading conversation...</span>
        </div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto">
            <Bot className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load conversation</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  const messages = session?.events || []

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                AI Assistant
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Always here to help</p>
            </div>
          </div>
          
          {/* File Sidebar Toggle */}
          {onToggleFileSidebar && (
            <Button
              onClick={onToggleFileSidebar}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Files className={`h-4 w-4 transition-colors ${isFileSidebarOpen ? 'text-blue-600 dark:text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 md:px-6 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  Ready to chat!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask me anything - I'm here to help with questions, tasks, or just have a conversation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {messages.map((event, index) => (
              <ChatMessage 
                key={event.invocationId || index} 
                event={event} 
              />
            ))}
            {isLoading && (
              <ChatMessage 
                event={{
                  author: 'assistant',
                  content: { text: 'Thinking...' }
                }}
                isLoading={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <Separator className="bg-gray-200 dark:bg-gray-700" />

      {/* Chat Input */}
      <div className="bg-white dark:bg-gray-800">
        <ChatInput 
          onSendMessage={handleSendMessage}
          sessionId={sessionId}
          disabled={isLoading}
          placeholder="Message AI assistant..."
        />
      </div>
    </div>
  )
}