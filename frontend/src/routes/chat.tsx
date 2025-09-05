import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { ChatInterface } from '@/components/chat/chat-interface'

function ChatPage() {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <ChatInterface />
}

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})