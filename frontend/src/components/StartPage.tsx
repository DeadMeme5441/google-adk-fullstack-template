import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createSession } from '../client'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Textarea } from './ui/textarea'
import { HeroFileUploadButton } from './FileUploadButton'
import { 
  MessageCircle, 
  Lightbulb, 
  Code, 
  BookOpen, 
  Zap, 
  Sparkles,
  Send,
  Upload,
  ArrowRight
} from 'lucide-react'

const examplePrompts = [
  {
    icon: MessageCircle,
    title: "General conversation",
    prompt: "Let's have an interesting conversation about technology and its impact on society",
    gradient: "from-blue-500 to-purple-600"
  },
  {
    icon: Lightbulb,
    title: "Explain concepts",
    prompt: "How does machine learning work in simple terms? Include real-world examples",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: BookOpen,
    title: "Help me write",
    prompt: "Draft a professional email to my team about our project update and next steps",
    gradient: "from-green-500 to-teal-600"
  },
  {
    icon: Code,
    title: "Code assistance",
    prompt: "Review this Python function and suggest improvements for better performance",
    gradient: "from-purple-500 to-pink-600"
  },
  {
    icon: Zap,
    title: "Creative writing",
    prompt: "Write a short story about a robot discovering emotions for the first time",
    gradient: "from-red-500 to-pink-600"
  },
  {
    icon: Sparkles,
    title: "Problem solving",
    prompt: "Help me brainstorm innovative solutions for reducing food waste in restaurants",
    gradient: "from-indigo-500 to-blue-600"
  }
]

export function StartPage() {
  const [message, setMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  
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
        state: { initialMessage: `I've uploaded a file: ${filename}. Please analyze it for me.` }
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
    <div className="min-h-full theme-bg-secondary">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 theme-primary-button rounded-2xl shadow-lg mb-8 relative">
              <MessageCircle className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold theme-text-primary mb-6 leading-tight">
              How can I help you{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                today?
              </span>
            </h1>
            
            <p className="text-xl theme-text-secondary max-w-2xl mx-auto leading-relaxed">
              Start a conversation with your AI assistant. Ask questions, get help with tasks, 
              brainstorm ideas, or just have an engaging chat.
            </p>
          </div>

          {/* Chat Input Section */}
          <Card className="theme-card theme-shadow mb-12 overflow-hidden">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="relative">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message here... Press Enter to send, Shift+Enter for new line"
                    className="min-h-[120px] text-base resize-none theme-input theme-focus border-0 shadow-none pr-16"
                    disabled={isCreating}
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button
                      onClick={() => handleStartChat()}
                      disabled={!message.trim() || isCreating}
                      size="sm"
                      className="theme-primary-button shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                    >
                      {isCreating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-16"></div>
                    <span className="text-sm theme-text-muted font-medium">or upload a file</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent w-16"></div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <HeroFileUploadButton 
                    sessionId="temp-session-for-upload"
                    onUploadSuccess={handleFileUploadSuccess}
                    className="theme-hover-bg-subtle border-2 border-dashed theme-border hover:theme-border px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Prompts Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold theme-text-primary mb-2">
                Not sure where to start?
              </h3>
              <p className="theme-text-secondary">
                Try one of these conversation starters
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examplePrompts.map((example, index) => {
                const Icon = example.icon
                return (
                  <Card 
                    key={index}
                    className="group cursor-pointer theme-card theme-hover-bg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 theme-border hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
                    onClick={() => handleStartChat(example.prompt)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${example.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold theme-text-primary text-lg mb-2 group-hover:theme-primary-text transition-colors">
                            {example.title}
                          </h4>
                          <p className="text-sm theme-text-secondary leading-relaxed line-clamp-3">
                            {example.prompt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs theme-text-muted">
                          Click to try
                        </div>
                        <ArrowRight className="w-4 h-4 theme-text-muted group-hover:theme-primary-text group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 text-center">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center mx-auto theme-shadow">
                  <Lightbulb className="w-8 h-8 theme-primary-text" />
                </div>
                <h4 className="font-semibold theme-text-primary">Smart Conversations</h4>
                <p className="text-sm theme-text-secondary">
                  Engage in intelligent discussions on any topic with contextual understanding
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center mx-auto theme-shadow">
                  <Upload className="w-8 h-8 theme-primary-text" />
                </div>
                <h4 className="font-semibold theme-text-primary">File Analysis</h4>
                <p className="text-sm theme-text-secondary">
                  Upload documents, images, or code files for instant analysis and insights
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-16 h-16 theme-bg-primary rounded-2xl flex items-center justify-center mx-auto theme-shadow">
                  <Zap className="w-8 h-8 theme-primary-text" />
                </div>
                <h4 className="font-semibold theme-text-primary">Instant Help</h4>
                <p className="text-sm theme-text-secondary">
                  Get immediate assistance with writing, coding, analysis, and creative tasks
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}