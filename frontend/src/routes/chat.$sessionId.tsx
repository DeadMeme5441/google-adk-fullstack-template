import { createFileRoute } from '@tanstack/react-router'
import { ChatLayout } from '../components/ChatLayout'
import { AuthGuard } from '../components/AuthGuard'

export const Route = createFileRoute('/chat/$sessionId')({
  component: ChatSessionPage,
})

function ChatSessionPage() {
  const { sessionId } = Route.useParams()
  
  return (
    <AuthGuard>
      <ChatLayout sessionId={sessionId} />
    </AuthGuard>
  )
}