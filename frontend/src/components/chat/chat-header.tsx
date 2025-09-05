import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Bot } from 'lucide-react'

interface ChatHeaderProps {
  user: any
}

export function ChatHeader({ user }: ChatHeaderProps) {
  const { logout } = useAuth()
  
  return (
    <header className="border-b bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">AI Assistant</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user?.full_name?.[0] || user?.username?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {user?.full_name || user?.username || user?.email}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}