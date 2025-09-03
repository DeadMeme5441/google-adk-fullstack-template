import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import { useAuth } from '../lib/auth'
import { Eye, EyeOff, User, Lock } from 'lucide-react'

export function LoginForm() {
  const [formData, setFormData] = useState({
    email_or_username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData)
      // Redirect will be handled by the auth state change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-6">
          {/* Simple, clean header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              Sign In
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email/username input with icon */}
            <div className="space-y-1">
              <label htmlFor="email_or_username" className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Email or Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="email_or_username"
                  name="email_or_username"
                  type="text"
                  value={formData.email_or_username}
                  onChange={handleChange}
                  placeholder="Enter your email or username"
                  required
                  className="pl-10 h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password input with visibility toggle */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-50">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="pl-10 pr-10 h-11 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}