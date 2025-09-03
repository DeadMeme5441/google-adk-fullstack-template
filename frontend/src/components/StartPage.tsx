import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createSession } from '../client'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Textarea } from './ui/textarea'
import { HeroFileUploadButton } from './FileUploadButton'
import { Sparkles, MessageCircle, Lightbulb, Code, BookOpen, Zap, Upload } from 'lucide-react'

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
  
  // Removed createSessionMutation - using direct API call

  const handleStartChat = async (promptText?: string) => {
    const textToSend = promptText || message.trim()
    if (!textToSend) return
    
    setIsCreating(true)
    try {
      const response = await createSession({
        path: {
          app_name: 'default',
          user_id: 'default-user',
        },
        body: {
          app_name: 'default',
          user_id: 'default-user',
        }
      })
      
      const session = response.data
      
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

  // Handle file upload success - create session and navigate
  const handleFileUploadSuccess = async (filename: string) => {
    setIsCreating(true)
    try {
      const response = await createSession({
        path: {
          app_name: 'default',
          user_id: 'default-user',
        },
        body: {
          app_name: 'default',
          user_id: 'default-user',
        }
      })
      
      const session = response.data
      
      await navigate({ 
        to: '/chat/$sessionId', 
        params: { sessionId: session.id },
        state: { initialMessage: `I've uploaded a file: ${filename}. Please analyze it.` }
      })
    } catch (error) {
      console.error('Failed to create session after upload:', error)
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
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-sm mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
                How can I help you today?
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Start a conversation with your AI assistant. Ask questions, get help with tasks, or just chat.
              </p>
            </div>
          </div>

          {/* Chat Input Section */}
          <Card className="shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Message your AI assistant..."
                    className="min-h-[120px] text-base resize-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    disabled={isCreating}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-end items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>or</span>
                  </div>
                  <HeroFileUploadButton 
                    sessionId="temp-session-for-upload"
                    onUploadSuccess={handleFileUploadSuccess}
                    className="order-first sm:order-none"
                  />
                  <Button 
                    onClick={() => handleStartChat()}
                    disabled={!message.trim() || isCreating}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 order-last"
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
            <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300">
              Or try one of these:
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {examplePrompts.map((example, index) => {
                const Icon = example.icon
                return (
                  <Card 
                    key={index}
                    className="group cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
                    onClick={() => handleStartChat(example.prompt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-gray-50 text-sm mb-1">
                            {example.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
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