import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { Button } from './ui/button'
import { Avatar } from './ui/avatar'
import { useState } from 'react'
import { Moon, Sun, MessageSquare, LogOut, Settings, Menu, X } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { isDark, toggleTheme, isLoading } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const closeMobileMenu = () => {
    setShowMobileMenu(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b theme-border theme-bg-primary theme-shadow">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              to={isAuthenticated ? "/chat" : "/"} 
              className="flex items-center space-x-2 text-xl font-bold theme-text-primary hover:theme-primary-text transition-colors group"
            >
              <div className="relative">
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <span className="hidden sm:inline">AI Agent</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              disabled={isLoading}
              className="relative h-9 w-9 rounded-lg theme-hover-bg-subtle theme-text-muted hover:theme-text-primary transition-colors"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <div className="relative w-5 h-5">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isDark ? (
                      <Sun className="w-5 h-5 transition-transform hover:rotate-12" />
                    ) : (
                      <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
                    )}
                  </>
                )}
              </div>
            </Button>

            {isAuthenticated ? (
              <>
                {/* New Chat Button */}
                <Link to="/chat">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 theme-hover-bg-subtle theme-text-secondary hover:theme-text-primary transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">New Chat</span>
                  </Button>
                </Link>
                
                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="h-9 px-2 theme-hover-bg-subtle theme-text-secondary hover:theme-text-primary transition-colors"
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white flex items-center justify-center text-xs font-semibold rounded-full">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Avatar>
                    <span className="hidden lg:inline max-w-24 truncate">
                      {user?.username || 'User'}
                    </span>
                  </Button>
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 theme-card rounded-lg shadow-lg border theme-border z-50">
                      <div className="py-2">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b theme-border-subtle">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white flex items-center justify-center text-sm font-semibold rounded-full">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium theme-text-primary truncate">
                                {user?.username || 'User'}
                              </div>
                              <div className="text-xs theme-text-muted truncate">
                                {user?.email || 'user@example.com'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          <button
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm theme-text-secondary theme-hover-bg transition-colors"
                            disabled
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                            <span className="ml-auto text-xs theme-text-muted">Soon</span>
                          </button>
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Auth Buttons */}
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 theme-hover-bg-subtle theme-text-secondary hover:theme-text-primary transition-colors"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="h-9 px-4 theme-primary-button shadow-sm hover:shadow transition-all"
                  >
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Mobile Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              disabled={isLoading}
              className="h-9 w-9 rounded-lg theme-hover-bg-subtle theme-text-muted hover:theme-text-primary"
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isDark ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </>
              )}
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="h-9 w-9 rounded-lg theme-hover-bg-subtle theme-text-muted hover:theme-text-primary"
            >
              {showMobileMenu ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t theme-border theme-bg-secondary">
            <div className="px-4 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-3 border-b theme-border-subtle">
                    <Avatar className="h-8 w-8">
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white flex items-center justify-center text-sm font-semibold rounded-full">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium theme-text-primary">
                        {user?.username || 'User'}
                      </div>
                      <div className="text-xs theme-text-muted">
                        {user?.email || 'user@example.com'}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <Link to="/chat" onClick={closeMobileMenu}>
                    <div className="flex items-center space-x-3 py-2 theme-text-secondary hover:theme-text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>New Chat</span>
                    </div>
                  </Link>

                  <button
                    className="w-full flex items-center space-x-3 py-2 theme-text-secondary hover:theme-text-primary transition-colors"
                    disabled
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                    <span className="ml-auto text-xs theme-text-muted">Soon</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                    className="w-full flex items-center space-x-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <div className="py-2 theme-text-secondary hover:theme-text-primary transition-colors">
                      Sign in
                    </div>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button className="w-full theme-primary-button">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Backdrop for mobile menu and user menu */}
      {(showMobileMenu || showUserMenu) && (
        <div 
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" 
          onClick={() => {
            setShowMobileMenu(false)
            setShowUserMenu(false)
          }}
        />
      )}

      {/* Backdrop for desktop user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30 hidden md:block" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  )
}