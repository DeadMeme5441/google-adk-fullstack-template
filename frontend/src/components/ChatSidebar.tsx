import { Link, useNavigate } from '@tanstack/react-router'
import { useListSessionsAppsAppNameUsersUserIdSessionsGet, useCreateSessionAppsAppNameUsersUserIdSessionsPost } from '../api/generated'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { MessageCircle, Plus, Clock, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatSidebarProps {
  currentSessionId: string
}

export function ChatSidebar({ currentSessionId }: ChatSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  
  // Fetch sessions list
  const { data: sessions, isLoading, error } = useListSessionsAppsAppNameUsersUserIdSessionsGet(
    { appName: 'nbfc-analyst', userId: 'default-user' },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )
  
  const createSessionMutation = useCreateSessionAppsAppNameUsersUserIdSessionsPost()

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      const session = await createSessionMutation.mutateAsync({
        appName: 'nbfc-analyst',
        userId: 'default-user',
        data: {
          appName: 'nbfc-analyst',
          userId: 'default-user',
        }
      })
      
      await navigate({ 
        to: '/chat/$sessionId', 
        params: { sessionId: session.id }
      })
    } catch (error) {
      console.error('Failed to create session:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSessionPreview = (session: any) => {
    if (session.events && session.events.length > 0) {
      const lastEvent = session.events[session.events.length - 1]
      if (lastEvent.content?.text) {
        return lastEvent.content.text.substring(0, 80) + '...'
      }
    }
    return 'New conversation'
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-50">Conversations</span>
        </div>
        
        <Button
          onClick={handleNewChat}
          disabled={isCreating}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
        >
          {isCreating ? (
            <>
              <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </>
          )}
        </Button>
      </div>

      <Separator className="mx-4 bg-gray-200 dark:bg-gray-700" />

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-gray-600 dark:text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-600 dark:text-red-400 text-sm font-medium">Failed to load</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Please try again</div>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="py-2 space-y-2">
            {sessions.map((session, index) => (
              <Link
                key={session.id}
                to="/chat/$sessionId"
                params={{ sessionId: session.id }}
                className="block"
              >
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-200 hover:shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600",
                    session.id === currentSessionId && "ring-2 ring-blue-500/20 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-600"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <MessageCircle className={cn(
                          "w-3 h-3 flex-shrink-0",
                          session.id === currentSessionId ? "text-blue-600 dark:text-blue-500" : "text-gray-500 dark:text-gray-400"
                        )} />
                        <h4 className={cn(
                          "font-medium text-xs truncate",
                          session.id === currentSessionId ? "text-blue-900 dark:text-blue-50" : "text-gray-900 dark:text-gray-50"
                        )}>
                          Chat {session.id.substring(0, 8)}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[10px] flex-shrink-0">
                          {formatDate(session.lastUpdateTime)}
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-[11px] line-clamp-2 leading-relaxed",
                      session.id === currentSessionId ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400"
                    )}>
                      {getSessionPreview(session)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator className="mx-4 bg-gray-200 dark:bg-gray-700" />

      {/* Footer */}
      <div className="p-4">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
          AI Agent
        </div>
      </div>
    </div>
  )
}