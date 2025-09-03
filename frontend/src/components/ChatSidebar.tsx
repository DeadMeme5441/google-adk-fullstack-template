import { Link, useNavigate } from '@tanstack/react-router'
import { useListSessionsAppsAppNameUsersUserIdSessionsGet, useCreateSessionAppsAppNameUsersUserIdSessionsPost } from '../api/generated'
import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { MessageCircle, Plus, Clock, Sparkles, Bot } from 'lucide-react'
import { cn } from '../lib/utils'

interface ChatSidebarProps {
  currentSessionId: string
}

export function ChatSidebar({ currentSessionId }: ChatSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  
  // Fetch sessions list
  const { data: sessions, isLoading, error } = useListSessionsAppsAppNameUsersUserIdSessionsGet(
    { appName: 'default', userId: 'default-user' },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )
  
  const createSessionMutation = useCreateSessionAppsAppNameUsersUserIdSessionsPost()

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      const session = await createSessionMutation.mutateAsync({
        appName: 'default',
        userId: 'default-user',
        data: {
          appName: 'default',
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
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getSessionPreview = (session: any) => {
    if (session.events && session.events.length > 0) {
      const lastEvent = session.events[session.events.length - 1]
      if (lastEvent.content?.text) {
        return lastEvent.content.text.substring(0, 60) + '...'
      }
    }
    return 'New conversation'
  }

  return (
    <div className="h-full flex flex-col theme-bg-secondary theme-border border-r">
      {/* Header */}
      <div className="p-4 theme-bg-primary theme-border border-b">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 theme-primary-button rounded-xl flex items-center justify-center shadow-sm">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold theme-text-primary text-sm">Conversations</h2>
            <p className="text-xs theme-text-muted">Chat history</p>
          </div>
        </div>
        
        <Button
          onClick={handleNewChat}
          disabled={isCreating}
          size="sm"
          className="w-full theme-primary-button transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
        >
          {isCreating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
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

      {/* Sessions List */}
      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 theme-text-muted">
            <div className="animate-spin w-6 h-6 border-2 border-blue-300 dark:border-blue-600 border-t-blue-600 dark:border-t-blue-400 rounded-full mb-3" />
            <p className="text-sm font-medium">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="w-12 h-12 theme-bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Failed to load</div>
            <div className="text-xs theme-text-muted">Please refresh and try again</div>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 theme-bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4 theme-shadow">
              <MessageCircle className="w-8 h-8 theme-text-muted" />
            </div>
            <h3 className="text-sm font-medium theme-text-primary mb-2">No conversations yet</h3>
            <p className="text-xs theme-text-muted leading-relaxed">Start a new chat to begin your AI conversation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, index) => (
              <Link
                key={session.id}
                to="/chat/$sessionId"
                params={{ sessionId: session.id }}
                className="block"
              >
                <Card 
                  className={cn(
                    "group cursor-pointer transition-all duration-200 hover:shadow-md theme-border border theme-hover-bg theme-shadow-sm",
                    session.id === currentSessionId 
                      ? "ring-2 ring-blue-500/30 bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-600 theme-shadow" 
                      : "theme-card hover:border-blue-300 dark:hover:border-blue-600"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={cn(
                          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                          session.id === currentSessionId 
                            ? "bg-blue-500 text-white" 
                            : "theme-bg-secondary theme-text-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30"
                        )}>
                          <Bot className="w-3 h-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={cn(
                            "font-medium text-sm truncate transition-colors",
                            session.id === currentSessionId 
                              ? "text-blue-900 dark:text-blue-100" 
                              : "theme-text-primary group-hover:theme-primary-text"
                          )}>
                            Chat #{session.id.substring(0, 8)}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 theme-text-muted flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {formatDate(session.lastUpdateTime)}
                        </span>
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs line-clamp-2 leading-relaxed transition-colors",
                      session.id === currentSessionId 
                        ? "text-blue-700 dark:text-blue-300" 
                        : "theme-text-secondary group-hover:theme-text-primary"
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

      {/* Footer */}
      <div className="p-4 theme-bg-primary theme-border border-t">
        <div className="flex items-center justify-center space-x-2 theme-text-muted">
          <Sparkles className="w-4 h-4 theme-primary-text" />
          <span className="text-xs font-medium">AI Assistant</span>
        </div>
      </div>
    </div>
  )
}