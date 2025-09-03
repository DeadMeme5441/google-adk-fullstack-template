import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Types matching the backend auth models
export interface User {
  id: string
  email: string
  username: string
  created_at: string
  is_active: boolean
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface LoginRequest {
  email_or_username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Base API URL
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

// Auth API functions
const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }
    
    return response.json()
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }
    
    return response.json()
  },

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get current user')
    }
    
    return response.json()
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  )
  const queryClient = useQueryClient()

  // Query to get current user when token exists
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(token!),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setToken(data.access_token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token)
      }
      queryClient.setQueryData(['currentUser'], data.user)
    },
    onError: () => {
      // Clear any stale auth data on login failure
      logout()
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setToken(data.access_token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token)
      }
      queryClient.setQueryData(['currentUser'], data.user)
    },
  })

  const logout = () => {
    setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    queryClient.clear() // Clear all queries on logout
  }

  // Clean up invalid token
  useEffect(() => {
    if (token && !isLoading && !user) {
      logout()
    }
  }, [token, isLoading, user])

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Additional hooks for specific auth operations
export function useLogin() {
  const { login } = useAuth()
  return useMutation({
    mutationFn: login,
  })
}

export function useRegister() {
  const { register } = useAuth()
  return useMutation({
    mutationFn: register,
  })
}
