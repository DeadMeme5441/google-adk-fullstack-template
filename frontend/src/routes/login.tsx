import { createFileRoute, Navigate } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/hooks/use-auth'

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/chat" />
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your AI assistant
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})