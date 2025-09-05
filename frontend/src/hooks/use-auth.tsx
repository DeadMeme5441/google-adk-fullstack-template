import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

interface User {
  id: string
  username: string
  email: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email_or_username: string; password: string }) => Promise<void>
  register: (userData: { email: string; username: string; password: string; full_name?: string }) => Promise<void>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const checkAuth = async () => {
    const token = auth.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        auth.clearToken()
        setUser(null)
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      auth.clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (credentials: { email_or_username: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.access_token) {
          auth.setToken(data.access_token)
          await checkAuth()
          navigate({ to: '/chat' })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: { email: string; username: string; password: string; full_name?: string }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.access_token) {
          auth.setToken(data.access_token)
          await checkAuth()
          navigate({ to: '/chat' })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    auth.clearToken()
    setUser(null)
    navigate({ to: '/login' })
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}