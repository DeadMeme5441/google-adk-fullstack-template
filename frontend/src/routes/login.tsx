import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    // Redirect to home if already authenticated
    // Note: This will be enhanced once we have proper auth state
  },
})

function LoginPage() {
  const { isAuthenticated } = useAuth()

  // Client-side redirect if already authenticated
  if (isAuthenticated) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <LoginForm />
    </div>
  )
}