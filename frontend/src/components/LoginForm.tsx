import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { login } from '../client'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { User, Lock, Eye, EyeOff, Mail, LogIn, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email_or_username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await login({
        body: formData
      })
      
      // Login successful - navigate to chat
      await navigate({ to: '/chat' })
    } catch (error) {
      console.error('Login error:', error)
      setError('Invalid email/username or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email_or_username.trim() && formData.password.trim()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 theme-bg-secondary">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 theme-primary-button rounded-xl shadow-lg mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Welcome back
          </h1>
          <p className="theme-text-secondary">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <Card className="theme-card theme-shadow">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="email_or_username" 
                  className="text-sm font-medium theme-text-primary block"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 theme-text-muted" />
                  </div>
                  <Input
                    id="email_or_username"
                    name="email_or_username"
                    type="text"
                    value={formData.email_or_username}
                    onChange={handleChange}
                    placeholder="Enter your email or username"
                    required
                    disabled={isLoading}
                    className="pl-10 h-12 theme-input theme-focus"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="text-sm font-medium theme-text-primary block"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 theme-text-muted" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="pl-10 pr-12 h-12 theme-input theme-focus"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center theme-text-muted hover:theme-text-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full h-12 text-base font-medium theme-primary-button transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign in</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="theme-text-secondary">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-medium theme-primary-text hover:underline transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>

        {/* Additional Links */}
        <div className="text-center mt-4 space-x-4">
          <Link 
            to="/" 
            className="text-sm theme-text-muted hover:theme-text-secondary transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}