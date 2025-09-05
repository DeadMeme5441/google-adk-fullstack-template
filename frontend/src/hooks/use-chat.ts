import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Message } from '@/components/chat/chat-message'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const { runAgent } = await import('@/client')
      const response = await runAgent({
        body: {
          appName: 'my-agent',
          userId: 'user123',
          sessionId: 'session456',
          newMessage: {
            parts: [{ text: messageText }]
          }
        }
      })
      return response.data
    },
    onSuccess: (data, messageText) => {
      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: messageText,
        timestamp: new Date()
      }
      
      // Add assistant response - extract text from the events array
      const assistantMessage: Message = {
        role: 'assistant',
        content: data?.[0]?.content?.parts?.[0]?.text || 'No response received',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage, assistantMessage])
    },
    onError: (error, messageText) => {
      // Add user message even if request fails
      const userMessage: Message = {
        role: 'user',
        content: messageText,
        timestamp: new Date()
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage, errorMessage])
    }
  })
  
  const sendMessage = useCallback((message: string) => {
    return sendMessageMutation.mutateAsync(message)
  }, [sendMessageMutation])
  
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])
  
  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error,
    sendMessage,
    clearMessages,
  }
}