import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
// Import the configured API client
import '@/lib/api-client'

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) {
      login({ email_or_username: email, password })
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email or Username</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {loginError && (
            <div className="text-sm text-destructive" role="alert">
              {loginError.message || loginError.detail || String(loginError)}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoggingIn || !email || !password}
          >
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}