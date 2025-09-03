import { createFileRoute } from '@tanstack/react-router'
import { StartPage } from '../components/StartPage'
import { AuthGuard } from '../components/AuthGuard'

export const Route = createFileRoute('/chat')({
  component: ChatStartPage,
})

function ChatStartPage() {
  return (
    <AuthGuard>
      <StartPage />
    </AuthGuard>
  )
}