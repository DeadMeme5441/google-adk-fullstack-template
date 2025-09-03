import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { Button } from './ui/button'
import { Avatar } from './ui/avatar'
import { useState } from 'react'
import { Moon, Sun, MessageSquare, User, LogOut, Settings } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <header className="h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <Link 
          to={isAuthenticated ? "/chat" : "/"} 
          className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-gray-50 hover:text-blue-600 dark:hover:text-blue-500 transition-colors"
        >
          <MessageSquare className="w-6 h-6" />
          <span>AI Agent</span>
        </Link>
      </div>
      
      <nav className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {isAuthenticated ? (
          <>
            <Link 
              to="/chat" 
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>New Chat</span>
            </Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-xs font-medium rounded-full">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Avatar>
                <span className="hidden sm:inline">{user?.username}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {user?.username}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </div>
                    </div>
                    
                    <button
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      disabled
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
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
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign in
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
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
