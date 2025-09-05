import { useAuth } from '@/hooks/use-auth'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'

export function ChatInterface() {
  const { user } = useAuth()
  
  return (
    <div className="flex h-screen flex-col">
      <ChatHeader user={user} />
      <div className="flex-1 overflow-hidden">
        <ChatMessages />
      </div>
      <ChatInput />
    </div>
  )
}