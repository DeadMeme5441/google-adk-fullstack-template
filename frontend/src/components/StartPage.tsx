import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCreateSessionAppsAppNameUsersUserIdSessionsPost } from '../api/generated'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Textarea } from './ui/textarea'
import { Sparkles, MessageCircle, Lightbulb, Code, BookOpen, Zap } from 'lucide-react'

const examplePrompts = [
  {
    icon: MessageCircle,
    title: "General chat",
    prompt: "Let's have a conversation about anything interesting"
  },
  {
    icon: Lightbulb,
    title: "Explain concepts",
    prompt: "How does machine learning work in simple terms?"
  },
  {
    icon: BookOpen,
    title: "Help me write",
    prompt: "Draft a professional email to my team about our project update"
  },
  {
    icon: Code,
    title: "Code assistance",
    prompt: "Review this Python function and suggest improvements"
  },
  {
    icon: Zap,
    title: "Creative tasks",
    prompt: "Write a short story about a robot discovering emotions"
  },
  {
    icon: Sparkles,
    title: "Problem solving",
    prompt: "Help me brainstorm solutions for reducing food waste"
  }
]

export function StartPage() {
  const [message, setMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  
  const createSessionMutation = useCreateSessionAppsAppNameUsersUserIdSessionsPost()

  const handleStartChat = async (promptText?: string) => {
    const textToSend = promptText || message.trim()
    if (!textToSend) return
    
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
        params: { sessionId: session.id },
        state: { initialMessage: textToSend }
      })
    } catch (error) {
      console.error('Failed to create session:', error)
      setIsCreating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleStartChat()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg mb-6 animate-float animate-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="animate-slide-in-from-bottom">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                How can I help you today?
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Start a conversation with your AI assistant. Ask questions, get help with tasks, or just chat.
              </p>
            </div>
          </div>

          {/* Chat Input Section */}
          <Card className="shadow-xl border-0 bg-white/60 backdrop-blur-sm hover-lift animate-slide-in-from-bottom">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Message your AI assistant..."
                    className="min-h-[120px] text-base resize-none border-0 focus:ring-2 focus:ring-purple-500/20 bg-white/80"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleStartChat()}
                    disabled={!message.trim() || isCreating}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 shadow-lg"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example prompts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-700">
              Or try one of these:
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {examplePrompts.map((example, index) => {
                const Icon = example.icon
                return (
                  <Card 
                    key={index}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-0 bg-white/40 backdrop-blur-sm hover:bg-white/60 hover-lift animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleStartChat(example.prompt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {example.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {example.prompt}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}