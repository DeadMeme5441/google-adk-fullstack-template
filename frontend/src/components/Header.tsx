import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { Button } from './ui/button'
import { Avatar } from './ui/avatar'
import { useState } from 'react'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="h-14 px-6 border-b bg-white flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link 
          to={isAuthenticated ? "/chat" : "/"} 
          className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          Agent Template Frontend
        </Link>
      </div>
      
      <nav className="flex items-center space-x-6">
        {isAuthenticated ? (
          <>
            <Link 
              to="/chat" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              New Chat
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <div className="h-full w-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Avatar>
                <span>{user?.username}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link to="/register">
              <Button size="sm">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </nav>
      
      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}
