import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '../components/RegisterForm'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { isAuthenticated } = useAuth()

  // Client-side redirect if already authenticated
  if (isAuthenticated) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <RegisterForm />
    </div>
  )
}