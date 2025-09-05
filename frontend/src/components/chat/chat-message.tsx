import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

interface ChatMessageProps {
  message: Message
  isLast?: boolean
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'ml-2' : 'mr-2')}>
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <Card className={cn(
        'max-w-[80%] transition-colors',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        <CardContent className="p-3">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          {message.timestamp && (
            <div className={cn(
              'mt-2 text-xs',
              isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}