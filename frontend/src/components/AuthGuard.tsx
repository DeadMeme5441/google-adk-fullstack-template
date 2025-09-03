import { useAuth } from '../lib/auth'
import { Navigate } from '@tanstack/react-router'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return fallback || <Navigate to="/login" />
  }

  return <>{children}</>
}