import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { register } from '../client'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import { User, Lock, Eye, EyeOff, Mail, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export function RegisterForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    // Clear success message
    if (success) setSuccess('')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setSuccess('')

    try {
      const response = await register({
        body: formData
      })
      
      // Registration successful
      setSuccess('Account created successfully! Redirecting to login...')
      
      // Wait a moment then redirect to login
      setTimeout(() => {
        navigate({ to: '/login' })
      }, 2000)
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific error cases
      if (error?.message?.includes('email')) {
        setErrors({ email: 'Email is already taken' })
      } else if (error?.message?.includes('username')) {
        setErrors({ username: 'Username is already taken' })
      } else {
        setErrors({ general: 'Registration failed. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.email.trim() && formData.username.trim() && formData.password.trim()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 theme-bg-secondary">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 theme-primary-button rounded-xl shadow-lg mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Create Account
          </h1>
          <p className="theme-text-secondary">
            Join us and start your AI conversation journey
          </p>
        </div>

        {/* Registration Form */}
        <Card className="theme-card theme-shadow">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="text-sm font-medium theme-text-primary block"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 theme-text-muted" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    className={`pl-10 h-12 theme-input theme-focus ${errors.email ? 'border-red-500 dark:border-red-400' : ''}`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-xs">{errors.email}</p>
                  </div>
                )}
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="username" 
                  className="text-sm font-medium theme-text-primary block"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 theme-text-muted" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                    disabled={isLoading}
                    minLength={3}
                    maxLength={50}
                    className={`pl-10 h-12 theme-input theme-focus ${errors.username ? 'border-red-500 dark:border-red-400' : ''}`}
                  />
                </div>
                {errors.username && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-xs">{errors.username}</p>
                  </div>
                )}
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
                    placeholder="Create a secure password"
                    required
                    disabled={isLoading}
                    minLength={6}
                    className={`pl-10 pr-12 h-12 theme-input theme-focus ${errors.password ? 'border-red-500 dark:border-red-400' : ''}`}
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
                {errors.password && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <p className="text-xs">{errors.password}</p>
                  </div>
                )}
              </div>

              {/* General Error Message */}
              {errors.general && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Password Requirements */}
              <div className="text-xs theme-text-muted space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li className={formData.password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
                    At least 6 characters
                  </li>
                  <li className={formData.username.length >= 3 && formData.username.length <= 50 ? 'text-green-600 dark:text-green-400' : ''}>
                    Username: 3-50 characters
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={!isFormValid || isLoading || !!success}
                className="w-full h-12 text-base font-medium theme-primary-button transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : success ? (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Account created!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="theme-text-secondary">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium theme-primary-text hover:underline transition-colors"
            >
              Sign in here
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